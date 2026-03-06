import random
from django.core.management.base import BaseCommand
from surveys.models import SurveyCategory, Survey, Question, AnswerOption

class Command(BaseCommand):
    help = 'Populates the database with 10 surveys, each having 20 questions'

    def handle(self, *args, **kwargs):
        self.stdout.write('Запуск масової генерації опитувань...')

        Survey.objects.all().delete()
        SurveyCategory.objects.all().delete()

        themes = [
            {'name': 'Подорожі та Відпочинок', 'icon': '✈️', 'desc': 'Наскільки сумісні ваші ідеальні відпустки?'},
            {'name': 'Технології та Гаджети', 'icon': '💻', 'desc': 'Apple чи Android? Роботи чи люди?'},
            {'name': 'Кулінарні Вподобання', 'icon': '🍕', 'desc': 'Піца з ананасами: злочин чи геніальність?'},
            {'name': 'Музичний Смак', 'icon': '🎧', 'desc': 'Покажи мені свій плейлист, і я скажу хто ти.'},
            {'name': 'Спорт і Активність', 'icon': '🏃', 'desc': 'Спортзал, пробіжки чи кіберспорт?'},
            {'name': 'Психологія і Емоції', 'icon': '💡', 'desc': 'Як ви реагуєте на стрес та конфлікти?'},
            {'name': 'Екстрим та Адреналін', 'icon': '🎢', 'desc': 'Готові стрибнути з парашутом?'},
            {'name': 'Мистецтво та Культура', 'icon': '🎭', 'desc': 'Музеї, театри та виставки.'},
            {'name': 'Книги і Література', 'icon': '📚', 'desc': 'Які світи сторінок вас приваблюють?'},
            {'name': 'Фінанси та Гроші', 'icon': '💰', 'desc': 'Транжира чи економ? Поговоримо про гроші.'},
        ]

        scale_templates = [
            "Оцініть наскільки вам це подобається (від 1 до 5)",
            "Як часто ви робите це протягом тижня?",
            "Наскільки ви задоволені цим аспектом свого життя?",
            "Оцініть рівень вашої зацікавленості темою",
            "Наскільки ви згодні з цим твердженням?",
            "Яка ваша оцінка від 1 до 5?",
            "Оцініть свій рівень енергії",
            "Наскільки вам близька ця ідея?"
        ]

        choice_templates = [
            {
                'text': "Що ти обереш в ідеальній ситуації?",
                'options': ["Класичний перевірений варіант", "Щось абсолютно нове", "Те, що порадять друзі", "Найдорожче"]
            },
            {
                'text': "Твій підхід до проблеми:",
                'options': ["Аналізувати всі деталі", "Діяти інтуїтивно", "Попросити допомоги", "Ігнорувати, поки не стане гірше"]
            },
            {
                'text': "Що приносить тобі найбільше задоволення?",
                'options': ["Процес", "Результат", "Похвала від інших", "Завершення справи"]
            },
            {
                'text': "В компанії незнайомців ти зазвичай:",
                'options': ["Спостерігаю", "Одразу знайомлюсь", "Жартую щоб розрядити обстановку", "Шукаю кота/собаку"]
            },
            {
                'text': "Твоя реакція на несподівані зміни:",
                'options': ["Паніка", "Роздратування", "Спокійний пошук рішення", "Захоплення новими можливостями"]
            },
            {
                'text': "Що для тебе найвищий пріоритет?",
                'options': ["Комфорт", "Швидкість", "Якість", "Емоції"]
            },
            {
                'text': "Який формат навчання тобі ближче?",
                'options': ["Читати книги/статті", "Дивитись відео", "Слухати пояснення", "Вчитись на практиці (навіть з помилками)"]
            },
            {
                'text': "Твоя ідеальна погода для цього:",
                'options': ["Сонце та спека", "Прохолода та дощ", "Сніг та мороз", "Немає значення, якщо настрій є"]
            },
            {
                'text': "Якщо тобі треба прийняти складне рішення, ти:",
                'options': ["Кинеш монетку", "Складеш список плюсів і мінусів", "Поспиш з цим", "Запитаєш у ChatGPT"]
            },
            {
                'text': "Як ти святкуєш успіх?",
                'options': ["Гучна вечірка", "Тиха вечеря вдома", "Купую собі подарунок", "Одразу берусь за наступне завдання"]
            },
            {
                'text': "Що тебе найбільше мотивує?",
                'options': ["Гроші", "Визнання", "Власний інтерес", "Страх невдачі"]
            }
        ]

        total_surveys_created = 0
        total_questions_created = 0

        for idx, theme in enumerate(themes):
            cat = SurveyCategory.objects.create(
                name=theme['name'],
                icon=theme['icon'],
                description=theme['desc']
            )

            survey = Survey.objects.create(
                title=f"{theme['icon']} {theme['name']}",
                description=theme['desc'] + " Пройдіть 20 коротких запитань, щоб знайти однодумців.",
                category=cat,
                max_participants=5,
                is_active=True
            )
            total_surveys_created += 1

            for i in range(1, 21):

                is_scale = (i % 3 == 0)

                if is_scale:
                    q_text = random.choice(scale_templates)
                    Question.objects.create(
                        survey=survey,
                        text=f"Питання {i}: {q_text}",
                        question_type='scale',
                        order=i
                    )
                else:
                    template = random.choice(choice_templates)
                    q = Question.objects.create(
                        survey=survey,
                        text=f"Питання {i}: {template['text']}",
                        question_type='choice',
                        order=i
                    )

                    for opt_idx, opt_text in enumerate(template['options']):
                        AnswerOption.objects.create(
                            question=q,
                            text=opt_text,
                            score=opt_idx + 1
                        )
                total_questions_created += 1

        self.stdout.write(self.style.SUCCESS(f'Успіх! Створено {total_surveys_created} опитувань та {total_questions_created} питань.'))
