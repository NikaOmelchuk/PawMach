import random
import string
from django.db import models
from django.conf import settings

class SurveyCategory(models.Model):
    
    name = models.CharField(max_length=100, verbose_name='Назва')
    description = models.TextField(blank=True, verbose_name='Опис')
    icon = models.CharField(max_length=10, default='📋', verbose_name='Іконка')

    class Meta:
        verbose_name = 'Категорія'
        verbose_name_plural = 'Категорії'

    def __str__(self):
        return f'{self.icon} {self.name}'

class Survey(models.Model):
    
    title = models.CharField(max_length=200, verbose_name='Назва')
    description = models.TextField(blank=True, verbose_name='Опис')
    category = models.ForeignKey(
        SurveyCategory, on_delete=models.PROTECT,
        related_name='surveys', verbose_name='Категорія'
    )
    max_participants = models.PositiveIntegerField(
        default=5, verbose_name='Максимальна кількість учасників'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активне')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='created_surveys',
        verbose_name='Створив'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')

    class Meta:
        verbose_name = 'Опитування'
        verbose_name_plural = 'Опитування'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Question(models.Model):
    
    QUESTION_TYPES = [
        ('choice', 'Вибір варіанту'),
        ('scale', 'Шкала 1-10'),
    ]

    survey = models.ForeignKey(
        Survey, on_delete=models.CASCADE,
        related_name='questions', verbose_name='Опитування'
    )
    text = models.TextField(verbose_name='Текст питання')
    question_type = models.CharField(
        max_length=10, choices=QUESTION_TYPES, default='choice',
        verbose_name='Тип питання'
    )
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')

    class Meta:
        verbose_name = 'Питання'
        verbose_name_plural = 'Питання'
        ordering = ['order']

    def __str__(self):
        return f'[{self.survey.title}] {self.text[:60]}'

class AnswerOption(models.Model):
    
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE,
        related_name='options', verbose_name='Питання'
    )
    text = models.CharField(max_length=300, verbose_name='Текст варіанту')
    score = models.IntegerField(default=0, verbose_name='Числова оцінка')

    class Meta:
        verbose_name = 'Варіант відповіді'
        verbose_name_plural = 'Варіанти відповідей'
        ordering = ['score']

    def __str__(self):
        return f'{self.text} ({self.score})'

def generate_session_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class SurveySession(models.Model):
    
    STATUS_CHOICES = [
        ('pending', 'Очікування учасників'),
        ('active', 'Активна'),
        ('completed', 'Завершена'),
    ]

    survey = models.ForeignKey(
        Survey, on_delete=models.CASCADE,
        related_name='sessions', verbose_name='Опитування'
    )
    session_code = models.CharField(
        max_length=8, unique=True,
        default=generate_session_code, verbose_name='Код сесії'
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True,
        related_name='sessions', verbose_name='Учасники'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='owned_sessions', verbose_name='Організатор'
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending',
        verbose_name='Статус'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')

    class Meta:
        verbose_name = 'Сесія опитування'
        verbose_name_plural = 'Сесії опитувань'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.survey.title} [{self.session_code}] — {self.status}'

    @property
    def participant_count(self):
        return self.participants.count()

    @property
    def is_full(self):
        return self.participant_count >= self.survey.max_participants

class UserAnswer(models.Model):
    
    session = models.ForeignKey(
        SurveySession, on_delete=models.CASCADE,
        related_name='user_answers', verbose_name='Сесія'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='answers', verbose_name='Користувач'
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE,
        related_name='user_answers', verbose_name='Питання'
    )
    selected_option = models.ForeignKey(
        AnswerOption, on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='user_answers', verbose_name='Обраний варіант'
    )
    scale_value = models.IntegerField(
        null=True, blank=True,
        verbose_name='Числова оцінка (1-10)'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Відповідь користувача'
        verbose_name_plural = 'Відповіді користувачів'
        unique_together = ('session', 'user', 'question')

    def __str__(self):
        return f'{self.user} → {self.question.text[:40]}'

    @property
    def effective_score(self):
        
        if self.selected_option:
            return self.selected_option.score
        return self.scale_value or 0

class CompatibilityResult(models.Model):
    
    session = models.ForeignKey(
        SurveySession, on_delete=models.CASCADE,
        related_name='results', verbose_name='Сесія'
    )
    user1 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='compatibility_as_user1', verbose_name='Учасник 1'
    )
    user2 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='compatibility_as_user2', verbose_name='Учасник 2'
    )
    score = models.FloatField(verbose_name='Сумісність (%)')
    strengths = models.JSONField(default=list, verbose_name='Спільні сильні сторони')
    weaknesses = models.JSONField(default=list, verbose_name='Розбіжності')
    lifestyle_tags = models.JSONField(default=list, verbose_name='Теги стилю життя')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Результат сумісності'
        verbose_name_plural = 'Результати сумісності'
        unique_together = ('session', 'user1', 'user2')

    def __str__(self):
        return f'{self.user1} & {self.user2}: {self.score:.1f}%'
