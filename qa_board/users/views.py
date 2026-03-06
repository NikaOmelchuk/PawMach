from rest_framework import generics, status, permissions
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import CustomUser
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer
)

class AppInfoView(APIView):
    
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary='Інформація про додаток',
        responses={200: OpenApiResponse(description='Назва, опис, версія')}
    )
    def get(self, request):
        return Response({
            'name': 'Survey Compatibility API',
            'version': '1.0.0',
            'description': (
                'Система персональних опитувань для визначення сумісності, '
                'вподобань, стилю життя та цінностей учасників.'
            ),
            'categories': [
                'Сумісність характерів',
                'Вподобання та стиль життя',
                'Робочий стиль',
                'Цінності та пріоритети',
            ],
            'icon': '🔍',
        })

class RegisterView(generics.CreateAPIView):
    
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary='Реєстрація користувача')
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'token': token.key,
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary='Вхід в систему',
        request=UserLoginSerializer,
        responses={200: OpenApiResponse(description='Token + профіль')}
    )
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'token': token.key,
        })

class LogoutView(APIView):
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = None

    @extend_schema(summary='Вихід з системи', responses={204: None})
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({'detail': 'Успішно вийшли з системи.'})

class ProfileView(generics.RetrieveUpdateAPIView):
    
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary='Переглянути профіль')
    def get_object(self):
        return self.request.user

