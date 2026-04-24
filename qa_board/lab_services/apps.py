from django.apps import AppConfig

class LabServicesConfig(AppConfig):
    name = 'lab_services'
    verbose_name = 'Лабораторні сервіси'

    def ready(self):
        from django.apps import apps
        try:
            celery_app = apps.get_app_config('django_celery_results')
            celery_app.verbose_name = 'Результати Celery'

            TaskResult = apps.get_model('django_celery_results', 'TaskResult')
            TaskResult._meta.verbose_name = 'Результат задачі'
            TaskResult._meta.verbose_name_plural = 'Результати задач'

            GroupResult = apps.get_model('django_celery_results', 'GroupResult')
            GroupResult._meta.verbose_name = 'Результат групи'
            GroupResult._meta.verbose_name_plural = 'Результати груп'

            ChordCounter = apps.get_model('django_celery_results', 'ChordCounter')
            ChordCounter._meta.verbose_name = 'Лічильник акордів'
            ChordCounter._meta.verbose_name_plural = 'Лічильники акордів'
        except LookupError:
            pass
