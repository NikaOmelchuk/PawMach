from django.contrib import admin
from django.urls import path
from django.http import HttpResponseRedirect
from django.contrib import messages
from .models import AsyncTaskResult

# ── Переклад адмін-панелі django_celery_results ──────────────────────────────
try:
    from django_celery_results.models import TaskResult, GroupResult
    from django_celery_results.admin import TaskResultAdmin, GroupResultAdmin

    admin.site.unregister(TaskResult)
    admin.site.unregister(GroupResult)

    class UkTaskResultAdmin(TaskResultAdmin):
        def task_name_column(self, obj):
            return obj.task_name
        task_name_column.short_description = 'Назва задачі'

        # Перевизначаємо list_display, щоб вставити перейменований стовпець
        list_display = (
            'task_id', 'task_name', 'date_done', 'status', 'worker',
        )

        # Назва розділу в бічній панелі і заголовок сторінки
        def changelist_view(self, request, extra_context=None):
            extra_context = extra_context or {}
            extra_context['title'] = 'Результати задач'
            return super().changelist_view(request, extra_context=extra_context)

    class UkGroupResultAdmin(GroupResultAdmin):
        def changelist_view(self, request, extra_context=None):
            extra_context = extra_context or {}
            extra_context['title'] = 'Результати груп'
            return super().changelist_view(request, extra_context=extra_context)

    admin.site.register(TaskResult, UkTaskResultAdmin)
    admin.site.register(GroupResult, UkGroupResultAdmin)
except Exception:
    pass

# ── Переклад назви колонки «task_name» через proxy-app та AppConfig ───────────
# Назва секції «CELERY RESULTS» береться з AppConfig пакету.
# Перевизначаємо її через власний AppConfig у apps.py (verbose_name вже 'Лабораторні сервіси').
# Для самої секції «CELERY RESULTS» → додамо monkey-patch нижче.
try:
    from django.apps import apps as _apps
    _celery_results_config = _apps.get_app_config('django_celery_results')
    _celery_results_config.verbose_name = 'Результати Celery'
except Exception:
    pass


@admin.register(AsyncTaskResult)
class AsyncTaskResultAdmin(admin.ModelAdmin):
    list_display = ('task_name_col', 'short_data', 'short_result', 'completed_at')
    list_display_links = ('task_name_col',)
    readonly_fields = ('task_name', 'task_data', 'result', 'completed_at')
    ordering = ('-completed_at',)
    list_per_page = 20
    change_list_template = 'admin/change_list_auto_refresh.html'

    def get_queryset(self, request):
        return super().get_queryset(request).using('lab_db')

    def task_name_col(self, obj):
        return obj.task_name
    task_name_col.short_description = 'Назва задачі'

    def short_data(self, obj):
        return obj.task_data[:80] + '…' if len(obj.task_data) > 80 else obj.task_data
    short_data.short_description = 'Дані операції'

    def short_result(self, obj):
        return obj.result[:100] + '…' if len(obj.result) > 100 else obj.result
    short_result.short_description = 'Результат'

    def get_urls(self):
        urls = super().get_urls()
        extra = [
            path(
                'trigger-email/',
                self.admin_site.admin_view(self.trigger_email_view),
                name='asynctaskresult_trigger_email',
            ),
            path(
                'trigger-report/',
                self.admin_site.admin_view(self.trigger_report_view),
                name='asynctaskresult_trigger_report',
            ),
        ]
        return extra + urls

    def trigger_email_view(self, request):
        from .tasks import send_survey_invitation_email
        send_survey_invitation_email.delay()
        self.message_user(
            request,
            '✅ Email-розсилку поставлено у чергу. Результат з\'явиться в таблиці нижче.',
            level=messages.SUCCESS,
        )
        return HttpResponseRedirect('../')

    def trigger_report_view(self, request):
        from .tasks import generate_compatibility_report_task
        from surveys.models import SurveySession
        session = SurveySession.objects.order_by('-created_at').first()
        session_id = session.pk if session else 1
        generate_compatibility_report_task.delay(session_id)
        self.message_user(
            request,
            f'✅ Генерацію звіту для сесії #{session_id} поставлено у чергу.',
            level=messages.SUCCESS,
        )
        return HttpResponseRedirect('../')
