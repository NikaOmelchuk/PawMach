from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import SurveyCategory, Survey, SurveySession, UserAnswer, AnswerOption, Question
from .serializers import (
    SurveyCategorySerializer, SurveyListSerializer, SurveyDetailSerializer,
    SurveySessionSerializer, SubmitAnswersSerializer, CompatibilityResultSerializer
)
from .utils import calculate_compatibility

class SurveyCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    
    queryset = SurveyCategory.objects.all()
    serializer_class = SurveyCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class SurveyViewSet(viewsets.ReadOnlyModelViewSet):
    
    queryset = Survey.objects.filter(is_active=True).select_related('category')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SurveyDetailSerializer
        return SurveyListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

class SurveySessionViewSet(viewsets.ModelViewSet):
    
    serializer_class = SurveySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return SurveySession.objects.filter(
            participants=user
        ).select_related('survey', 'survey__category', 'created_by').distinct()

    def perform_create(self, serializer):
        session = serializer.save(created_by=self.request.user)

        session.participants.add(self.request.user)
        session.status = 'active'
        session.save()

    @extend_schema(
        summary='Приєднатись до сесії за кодом',
        responses={200: SurveySessionSerializer}
    )
    @action(detail=False, methods=['post'], url_path='join')
    def join(self, request):
        
        code = request.data.get('session_code', '').strip().upper()
        if not code:
            return Response({'detail': 'Вкажіть session_code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = SurveySession.objects.get(session_code=code)
        except SurveySession.DoesNotExist:
            return Response({'detail': 'Сесію не знайдено.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status == 'completed':
            return Response({'detail': 'Сесія вже завершена.'}, status=status.HTTP_400_BAD_REQUEST)

        if session.is_full and request.user not in session.participants.all():
            return Response(
                {'detail': f'Сесія заповнена (макс. {session.survey.max_participants} учасників).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.participants.add(request.user)
        return Response(SurveySessionSerializer(session).data)

    @extend_schema(
        summary='Надіслати відповіді',
        request=SubmitAnswersSerializer,
        responses={200: OpenApiResponse(description='Відповіді збережено')}
    )
    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        
        session = self.get_object()

        if session.status == 'completed':
            return Response({'detail': 'Сесія вже завершена.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user not in session.participants.all():
            return Response({'detail': 'Ви не є учасником цієї сесії.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = SubmitAnswersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        saved = 0
        errors = []
        for ans_data in serializer.validated_data['answers']:
            q_id = ans_data['question_id']
            try:
                question = Question.objects.get(id=q_id, survey=session.survey)
            except Question.DoesNotExist:
                errors.append(f'Питання {q_id} не належить до цього опитування.')
                continue

            opt_id = ans_data.get('selected_option_id')
            selected_option = None
            if opt_id:
                try:
                    selected_option = AnswerOption.objects.get(id=opt_id, question=question)
                except AnswerOption.DoesNotExist:
                    errors.append(f'Варіант {opt_id} не існує для питання {q_id}.')
                    continue

            UserAnswer.objects.update_or_create(
                session=session,
                user=request.user,
                question=question,
                defaults={
                    'selected_option': selected_option,
                    'scale_value': ans_data.get('scale_value'),
                }
            )
            saved += 1

        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'chat_{session.id}',
            {
                'type': 'survey_progress',
                'username': request.user.username,
                'message': f'{request.user.username} щойно завершив відповідати! 🎉',
                'is_system': True,
                'submitted': True,
            }
        )

        return Response({
            'saved': saved,
            'errors': errors,
            'detail': f'Збережено {saved} відповідей.'
        })

    @extend_schema(
        summary='Завершити сесію та отримати результати сумісності',
        responses={200: CompatibilityResultSerializer(many=True)}
    )
    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        
        session = self.get_object()

        if request.user != session.created_by:
            return Response({'detail': 'Тільки організатор може завершити сесію.'}, status=status.HTTP_403_FORBIDDEN)

        if session.status == 'completed':
            return Response({'detail': 'Сесія вже завершена.'}, status=status.HTTP_400_BAD_REQUEST)

        session.status = 'completed'
        session.save()

        results = calculate_compatibility(session)
        return Response(CompatibilityResultSerializer(results, many=True).data)

    @extend_schema(
        summary='Переглянути результати сумісності',
        responses={200: CompatibilityResultSerializer(many=True)}
    )
    @action(detail=True, methods=['get'], url_path='results')
    def results(self, request, pk=None):
        
        session = self.get_object()
        results = session.results.select_related('user1', 'user2').all()
        return Response(CompatibilityResultSerializer(results, many=True).data)
