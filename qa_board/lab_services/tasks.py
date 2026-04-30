import time
import random
import logging
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from lab_services.models import AsyncTaskResult
from django.core.mail import get_connection, EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

SITE_URL = "https://conceivably-orthostyle-mel.ngrok-free.dev"


def _notify_admin(task_name: str, task_data: str, result_text: str):
    record = AsyncTaskResult.objects.using('lab_db').create(
        task_name=task_name,
        task_data=task_data,
        result=result_text,
    )

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "admin_tasks",
        {
            "type": "task_completed",
            "data": {
                "task_name": record.task_name,
                "task_data": record.task_data,
                "result": record.result,
                "completed_at": record.completed_at.strftime("%Y-%m-%d %H:%M:%S"),
            },
        },
    )
    return record


@shared_task(queue='email', name='lab_services.tasks.send_survey_invitation_email')
def send_survey_invitation_email(survey_title: str | None = None):
    from django.contrib.auth import get_user_model
    from surveys.models import Survey

    User = get_user_model()

    if not survey_title:
        titles = list(Survey.objects.filter(is_active=True).values_list('title', flat=True))
        if titles:
            survey_title = random.choice(titles)
        else:
            survey_title = "Знайди свою пару"

    recipients = list(
        User.objects.filter(is_active=True, email__isnull=False)
        .exclude(email='')
        .values_list('email', flat=True)
    )

    if not recipients:
        result_text = "Не знайдено жодного користувача для розсилки."
        _notify_admin(
            task_name="📧 Email-розсилка",
            task_data=f"Опитування: «{survey_title}»",
            result_text=result_text,
        )
        return result_text

    subject = f"🐾 Час пройти опитування разом з друзями!"

    message = (
        f"Привіт!\n\n"
        f"Час пройти опитування «{survey_title}» разом зі своїми друзями — "
        f"дізнайся, наскільки ви сумісні! 🐾\n\n"
        f"Переходь за посиланням та розпочни сесію прямо зараз:\n"
        f"{SITE_URL}/dashboard\n\n"
        f"Побачимось у грі!\n"
        f"— Команда PawMatch\n"
    )

    html_message = (
        f"<html><body style='font-family:Arial,sans-serif;color:#333;'>"
        f"<h2 style='color:#7c4dff;'>🐾 Час пройти опитування!</h2>"
        f"<p>Привіт!</p>"
        f"<p>Час пройти опитування <strong>«{survey_title}»</strong> разом зі своїми друзями - "
        f"дізнайся, наскільки ви сумісні!</p>"
        f"<p style='text-align:center;margin:30px 0;'>"
        f"<a href='{SITE_URL}/dashboard' "
        f"style='background:#7c4dff;color:white;padding:14px 30px;border-radius:8px;"
        f"text-decoration:none;font-size:16px;font-weight:bold;'>"
        f"🚀 Розпочати опитування"
        f"</a></p>"
        f"<p style='color:#888;font-size:13px;'>— Команда PawMatch</p>"
        f"</body></html>"
    )

    sent_count = 0
    failed_list = []

    logger.info(
        f"[Email] Початок розсилки: backend={settings.EMAIL_BACKEND}, "
        f"host={settings.EMAIL_HOST}:{settings.EMAIL_PORT}, "
        f"user={settings.EMAIL_HOST_USER}, "
        f"tls={settings.EMAIL_USE_TLS}, "
        f"recipients={len(recipients)}"
    )

    MAX_RETRIES = 3

    for i, email in enumerate(recipients):
        success = False
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                conn = get_connection(
                    backend=settings.EMAIL_BACKEND,
                    host=settings.EMAIL_HOST,
                    port=settings.EMAIL_PORT,
                    username=settings.EMAIL_HOST_USER,
                    password=settings.EMAIL_HOST_PASSWORD,
                    use_tls=settings.EMAIL_USE_TLS,
                    fail_silently=False,
                )
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[email],
                    connection=conn,
                )
                msg.attach_alternative(html_message, "text/html")
                msg.send(fail_silently=False)
                sent_count += 1
                success = True
                logger.info(f"[Email] ✅ Надіслано на {email} (спроба {attempt})")
                break
            except Exception as e:
                logger.warning(
                    f"[Email] ⚠️ Спроба {attempt}/{MAX_RETRIES} для {email} — {e}"
                )
                try:
                    conn.close()
                except Exception:
                    pass
                if attempt < MAX_RETRIES:
                    wait = 5 * attempt
                    logger.info(f"[Email] ⏳ Чекаю {wait}с перед повтором...")
                    time.sleep(wait)

        if not success:
            logger.error(f"[Email] ❌ Не вдалося надіслати на {email} після {MAX_RETRIES} спроб")
            failed_list.append(email)

        if i < len(recipients) - 1:
            time.sleep(5)

    if failed_list:
        result_text = (
            f"Надіслано: {sent_count}/{len(recipients)} листів. "
            f"Помилки: {', '.join(failed_list)}"
        )
    else:
        result_text = f"Успішно надіслано {sent_count} листів усім користувачам."

    _notify_admin(
        task_name="📧 Email-розсилка",
        task_data=f"Опитування: «{survey_title}» | Одержувачів: {len(recipients)}",
        result_text=result_text,
    )
    return result_text



@shared_task(queue='default', name='lab_services.tasks.generate_compatibility_report_task')
def generate_compatibility_report_task(session_id: int):
    from surveys.models import SurveySession, UserAnswer, CompatibilityResult

    time.sleep(10)

    try:
        session = SurveySession.objects.get(pk=session_id)
        survey_title = session.survey.title
        participants = list(session.participants.all())
        participant_count = len(participants)

        if participant_count < 2:
            result_text = (
                f"Сесія #{session_id} («{survey_title}»): "
                f"недостатньо учасників для аналізу (потрібно мінімум 2)."
            )
        else:
            results = CompatibilityResult.objects.filter(session=session)
            if results.exists():
                avg_score = sum(r.score for r in results) / results.count()
                result_text = (
                    f"Звіт для сесії #{session_id} («{survey_title}») згенеровано. "
                    f"Учасників: {participant_count}. "
                    f"Середня сумісність: {avg_score:.1f}%."
                )
            else:
                answers_count = UserAnswer.objects.filter(session=session).count()
                mock_score = random.uniform(60, 95)
                result_text = (
                    f"Звіт для сесії #{session_id} («{survey_title}») згенеровано. "
                    f"Учасників: {participant_count}, відповідей: {answers_count}. "
                    f"Прогнозована сумісність: {mock_score:.1f}%."
                )

    except SurveySession.DoesNotExist:
        result_text = f"Сесія #{session_id} не знайдена в базі даних."

    _notify_admin(
        task_name="📊 Звіт про сумісність",
        task_data=f"ID сесії: {session_id}",
        result_text=result_text,
    )
    return result_text
