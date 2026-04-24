from celery import shared_task
from django.core.mail import send_mail
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from lab_services.models import AsyncTaskResult
import json

@shared_task(queue='email')
def send_bulk_email_task(subject, message, recipient_list):
    send_mail(subject, message, None, recipient_list)
    
    result = AsyncTaskResult.objects.create(
        task_name="Масова розсилка",
        task_data=f"Отримувачі: {', '.join(recipient_list)}",
        result=f"Відправлено {len(recipient_list)} листів"
    )
    
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "admin_tasks",
        {
            "type": "task_completed",
            "data": {
                "task_name": result.task_name,
                "task_data": result.task_data,
                "result": result.result,
                "completed_at": result.completed_at.strftime("%Y-%m-%d %H:%M:%S")
            }
        }
    )
    return result.result
