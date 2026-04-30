import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from lab_services.models import AsyncTaskResult

logger = logging.getLogger(__name__)

@shared_task(queue='email')
def send_bulk_email_task(subject, message, recipient_list):
    logger.info(
        f"[BulkEmail] Початок розсилки: recipients={recipient_list}, "
        f"backend={settings.EMAIL_BACKEND}, host={settings.EMAIL_HOST}:{settings.EMAIL_PORT}"
    )

    try:
        sent = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            fail_silently=False,
        )
        logger.info(f"[BulkEmail] ✅ send_mail повернув {sent}")
    except Exception as e:
        logger.error(f"[BulkEmail] ❌ Помилка: {e}")
        result = AsyncTaskResult.objects.using('lab_db').create(
            task_name="Масова розсилка",
            task_data=f"Отримувачі: {', '.join(recipient_list)}",
            result=f"❌ Помилка відправки: {e}"
        )
        raise

    result = AsyncTaskResult.objects.using('lab_db').create(
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
