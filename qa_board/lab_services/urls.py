from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    ChatMessageViewSet, ArticleViewSet, CommentViewSet,
    AnnouncementViewSet, QnaQuestionViewSet, QnaAnswerViewSet,
    TodoTaskViewSet, TimerViewSet,
    LabPollViewSet, LabPollOptionViewSet,
    ScoreEntryViewSet, QuizViewSet, QuizQuestionViewSet, QuizChoiceViewSet
)

router = DefaultRouter()
router.register(r'chat', ChatMessageViewSet, basename='chat')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'qna/questions', QnaQuestionViewSet, basename='question')
router.register(r'qna/answers', QnaAnswerViewSet, basename='answer')
router.register(r'todo', TodoTaskViewSet, basename='todo')
router.register(r'timers', TimerViewSet, basename='timer')
router.register(r'polls', LabPollViewSet, basename='poll')
router.register(r'polls/options', LabPollOptionViewSet, basename='poll-option')
router.register(r'scores', ScoreEntryViewSet, basename='score')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'quizzes/questions', QuizQuestionViewSet, basename='quiz-question')
router.register(r'quizzes/choices', QuizChoiceViewSet, basename='quiz-choice')

urlpatterns = [
    path('', include(router.urls)),
]
