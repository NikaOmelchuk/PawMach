import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qa_board.settings')

app = Celery('qa_board')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
