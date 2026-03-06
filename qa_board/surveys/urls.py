from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SurveyCategoryViewSet, SurveyViewSet, SurveySessionViewSet

router = DefaultRouter()
router.register(r'categories', SurveyCategoryViewSet, basename='category')
router.register(r'surveys', SurveyViewSet, basename='survey')
router.register(r'sessions', SurveySessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
]
