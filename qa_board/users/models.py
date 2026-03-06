from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):

    GENDER_CHOICES = [
        ('M', 'Чоловік'),
        ('F', 'Жінка'),
        ('O', 'Інше'),
    ]

    DELETE_POLICY_CHOICES = [
        (0, 'Не видаляти'),
        (30, '30 днів'),
        (60, '60 днів'),
        (90, '90 днів'),
    ]

    email = models.EmailField(unique=True, verbose_name='Email')
    gender = models.CharField(
        max_length=1, choices=GENDER_CHOICES, blank=True, null=True,
        verbose_name='Стать'
    )
    birth_date = models.DateField(blank=True, null=True, verbose_name='Дата народження')
    bio = models.TextField(blank=True, default='', verbose_name='Про себе')
    avatar = models.ImageField(
        upload_to='avatars/', blank=True, null=True, verbose_name='Аватар'
    )
    delete_after_days = models.IntegerField(
        choices=DELETE_POLICY_CHOICES, default=0, verbose_name='Автовидалення після бездії (днів)',
        help_text='Кількість днів після останнього входу, коли акаунт буде видалено автоматично.'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'Користувач'
        verbose_name_plural = 'Користувачі'

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.email})'
