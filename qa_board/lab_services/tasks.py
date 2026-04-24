from celery import shared_task
import time
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from lab_services.models import AsyncTaskResult
import json

@shared_task(queue='default')
def generate_compatibility_report_task(session_id):
    time.sleep(10)
    
    result_text = f"Звіт для сесії #{session_id} згенеровано. Фінальний результат: 85%"
    
    result = AsyncTaskResult.objects.create(
        task_name="Звіт про сумісність",
        task_data=f"ID сесії: {session_id}",
        result=result_text
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
