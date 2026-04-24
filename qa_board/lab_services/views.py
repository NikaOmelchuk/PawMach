from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    ChatMessage, Article, Comment, Announcement, AnnouncementReaction,
    QnaQuestion, QnaAnswer, TodoTask, Timer,
    LabPoll, LabPollOption, LabPollVote,
    ScoreEntry, Quiz, QuizQuestion, QuizChoice, QuizSubmission,
    AsyncTaskResult
)
from .serializers import (
    ChatMessageSerializer, ArticleSerializer, CommentSerializer,
    AnnouncementSerializer, AnnouncementReactionSerializer,
    QnaQuestionSerializer, QnaAnswerSerializer,
    TodoTaskSerializer, TimerSerializer,
    LabPollSerializer, LabPollOptionSerializer, LabPollVoteSerializer,
    ScoreEntrySerializer, QuizSerializer, QuizQuestionSerializer,
    QuizChoiceSerializer, QuizSubmissionSerializer,
    AsyncTaskResultSerializer
)

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ChatMessage.objects.using('lab_db').all().order_by('created_at')

    def perform_create(self, serializer):
        serializer.save(author_id=self.request.user.id)

class ArticleViewSet(viewsets.ModelViewSet):
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Article.objects.using('lab_db').all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author_id=self.request.user.id)

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Comment.objects.using('lab_db').all().order_by('-created_at')

    def get_queryset(self):
        article_id = self.request.query_params.get('article')
        qs = Comment.objects.using('lab_db').all()
        if article_id:
            qs = qs.filter(article_id=article_id)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author_id=self.request.user.id)

class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.using('lab_db').all().order_by('-created_at')

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def react(self, request, pk=None):
        announcement = self.get_object()
        reaction_type = request.data.get('reaction_type', 'like')
        user_id = request.user.id
        obj, created = AnnouncementReaction.objects.using('lab_db').update_or_create(
            announcement=announcement, user_id=user_id,
            defaults={'reaction_type': reaction_type},
        )
        return Response({'status': 'Реакцію збережено', 'reaction_type': obj.reaction_type})

class QnaQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QnaQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = QnaQuestion.objects.using('lab_db').all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author_id=self.request.user.id)

class QnaAnswerViewSet(viewsets.ModelViewSet):
    serializer_class = QnaAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = QnaAnswer.objects.using('lab_db').all().order_by('-rating')

    def perform_create(self, serializer):
        serializer.save(author_id=self.request.user.id)

    @action(detail=True, methods=['post'])
    def upvote(self, request, pk=None):
        answer = self.get_object()
        answer.rating += 1
        answer.save(using='lab_db')
        return Response({'rating': answer.rating})

    @action(detail=True, methods=['post'])
    def downvote(self, request, pk=None):
        answer = self.get_object()
        answer.rating -= 1
        answer.save(using='lab_db')
        return Response({'rating': answer.rating})

class TodoTaskViewSet(viewsets.ModelViewSet):
    serializer_class = TodoTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TodoTask.objects.using('lab_db').filter(user_id=self.request.user.id).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.id)

class TimerViewSet(viewsets.ModelViewSet):
    serializer_class = TimerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Timer.objects.using('lab_db').filter(user_id=self.request.user.id).order_by('-started_at')

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.id)

class LabPollViewSet(viewsets.ModelViewSet):
    serializer_class = LabPollSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = LabPoll.objects.using('lab_db').all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author_id=self.request.user.id)

class LabPollOptionViewSet(viewsets.ModelViewSet):
    serializer_class = LabPollOptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = LabPollOption.objects.using('lab_db').all()

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        option = self.get_object()
        user_id = request.user.id
        if LabPollVote.objects.using('lab_db').filter(option__poll=option.poll, user_id=user_id).exists():
            return Response({'error': 'Ви вже голосували у цьому опитуванні'}, status=status.HTTP_400_BAD_REQUEST)
        LabPollVote.objects.using('lab_db').create(option=option, user_id=user_id)
        return Response({'status': 'Голос зараховано!'})

class ScoreEntryViewSet(viewsets.ModelViewSet):
    serializer_class = ScoreEntrySerializer
    queryset = ScoreEntry.objects.using('lab_db').all().order_by('-score')

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_points(self, request):
        points = int(request.data.get('points', 0))
        entry, _ = ScoreEntry.objects.using('lab_db').get_or_create(user_id=request.user.id)
        entry.score += points
        entry.save(using='lab_db')
        return Response({'score': entry.score})

class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Quiz.objects.using('lab_db').all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author_id=self.request.user.id)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        answers = request.data.get('answers', [])
        score = 0
        for item in answers:
            try:
                choice = QuizChoice.objects.using('lab_db').get(
                    id=item.get('choice_id'),
                    question_id=item.get('question_id'),
                )
                if choice.is_correct:
                    score += 1
            except QuizChoice.DoesNotExist:
                pass
        submission = QuizSubmission.objects.using('lab_db').create(
            quiz=quiz, user_id=request.user.id, score=score
        )
        return Response({'score': score, 'submission_id': submission.id})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def trigger_report(self, request, pk=None):
        from .tasks import generate_compatibility_report_task
        generate_compatibility_report_task.delay(pk)
        return Response({'status': 'Генерацію звіту поставлено у чергу'})

class AsyncTaskResultViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AsyncTaskResultSerializer
    queryset = AsyncTaskResult.objects.using('lab_db').all()
    permission_classes = [permissions.IsAdminUser]

class QuizQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuizQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = QuizQuestion.objects.using('lab_db').all()

class QuizChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = QuizChoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = QuizChoice.objects.using('lab_db').all()


class EmailBroadcastViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['post'], url_path='send')
    def send(self, request):
        from .tasks import send_survey_invitation_email
        survey_title = request.data.get('survey_title', None)
        send_survey_invitation_email.delay(survey_title)
        return Response({
            'status': 'Розсилку поставлено у чергу',
            'message': 'Email-листи будуть надіслані усім зареєстрованим користувачам.',
        })


class ReportGenerationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        from .tasks import generate_compatibility_report_task
        from surveys.models import SurveySession
        session = SurveySession.objects.order_by('-created_at').first()
        if not session:
            return Response(
                {'error': 'Не знайдено жодної сесії опитування. Спочатку створіть та завершіть сесію.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        generate_compatibility_report_task.delay(session.pk)
        return Response({
            'status': 'Генерацію звіту поставлено у чергу',
            'session_id': session.pk,
            'survey': session.survey.title,
        })
