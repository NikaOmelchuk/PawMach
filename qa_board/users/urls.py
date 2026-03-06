from django.urls import path
from .views import AppInfoView, RegisterView, LoginView, LogoutView, ProfileView

urlpatterns = [
    path('app/', AppInfoView.as_view(), name='app-info'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
]
