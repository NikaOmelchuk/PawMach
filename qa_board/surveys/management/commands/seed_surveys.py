from django.core.management.base import BaseCommand
from surveys.models import SurveyCategory, Survey, Question, AnswerOption

class Command(BaseCommand):
    help = 'Populates the database with initial surveys for PawMatch'

    def handle(self, *args, **kwargs):
        self.stdout.write('Заповнення бази тестовими даними...')

        Survey.objects.all().delete()
        SurveyCategory.objects.all().delete()

        cat_friendship = SurveyCategory.objects.create(name='Характер та Дружба', icon='😺', description='Дізнайся наскільки ви схожі за темпераментом')

        survey_cat = Survey.objects.create(
            title='Який ти котик в душі?',
            description='Коротий тест щоб дізнатись твій внутрішній котячий вайб та знайти схожих друзів.',
            category=cat_friendship,
            max_participants=2,
            is_active=True
        )

        q1 = Question.objects.create(survey=survey_cat, text='Ідеальні вихідні для тебе — це:', question_type='choice')
        AnswerOption.objects.create(question=q1, text='Спати 16 годин і їсти смачненьке', score=1)
        AnswerOption.objects.create(question=q1, text='Бігати по квартирі о 3-й ночі', score=2)
        AnswerOption.objects.create(question=q1, text='Спостерігати за пташками у вікно', score=3)
        AnswerOption.objects.create(question=q1, text='Вимагати уваги та гладитись', score=4)

        q2 = Question.objects.create(survey=survey_cat, text='Оціни свою любов до спілкування (1-Інтроверт, 10-Душа компанії):', question_type='scale')

        q3 = Question.objects.create(survey=survey_cat, text='Твоя реакція на несподіваного гостя:', question_type='choice')
        AnswerOption.objects.create(question=q3, text='Заховатись під ліжко', score=1)
        AnswerOption.objects.create(question=q3, text='Йти обнюхувати і знайомитись', score=2)
        AnswerOption.objects.create(question=q3, text='Ігнорувати, нехай сам підходить', score=3)

        cat_lifestyle = SurveyCategory.objects.create(name='Стиль життя', icon='☕', description='Побут, звички та вподобання')

        survey_lifestyle = Survey.objects.create(
            title='Побутова сумісність',
            description='Перевір чи зможете ви жити разом, не повбивавши один одного через немиту чашку.',
            category=cat_lifestyle,
            max_participants=2,
            is_active=True
        )

        q4 = Question.objects.create(survey=survey_lifestyle, text='Твоє ставлення до раннього підйому:', question_type='scale')

        q5 = Question.objects.create(survey=survey_lifestyle, text='Хто має мити посуд?', question_type='choice')
        AnswerOption.objects.create(question=q5, text='Той, хто готував', score=1)
        AnswerOption.objects.create(question=q5, text='Посудомийна машина', score=2)
        AnswerOption.objects.create(question=q5, text='Миємо разом під музику', score=3)
        AnswerOption.objects.create(question=q5, text='Завтра помию... може', score=4)

        q6 = Question.objects.create(survey=survey_lifestyle, text='Рівень твоєї любові до спонтанних планів:', question_type='scale')

        cat_interests = SurveyCategory.objects.create(name='Розваги та Інтереси', icon='🎮', description='Фільми, ігри, хобі')

        survey_fun = Survey.objects.create(
            title='Вечір п\'ятниці',
            description='Як ви проводите вільний час? Шукаємо ідеального напарника для кіно та ігор.',
            category=cat_interests,
            max_participants=10,
            is_active=True
        )

        q7 = Question.objects.create(survey=survey_fun, text='Обери жанр кіно на вечір:', question_type='choice')
        AnswerOption.objects.create(question=q7, text='Лютий горор', score=1)
        AnswerOption.objects.create(question=q7, text='Романтична комедія', score=2)
        AnswerOption.objects.create(question=q7, text='Фантастика / Sci-Fi', score=3)
        AnswerOption.objects.create(question=q7, text='Документалка про природу', score=4)

        q8 = Question.objects.create(survey=survey_fun, text='Наскільки ти геймер?', question_type='scale')

        q9 = Question.objects.create(survey=survey_fun, text='Твій ідеальний саундтрек для подорожі:', question_type='choice')
        AnswerOption.objects.create(question=q9, text='Спокійний Lo-Fi', score=1)
        AnswerOption.objects.create(question=q9, text='Гучний Рок / Метал', score=2)
        AnswerOption.objects.create(question=q9, text='Поп хіти щоб підспівувати', score=3)
        AnswerOption.objects.create(question=q9, text='Подкасти або Аудіокниги', score=4)

        self.stdout.write(self.style.SUCCESS('Успіх! 3 опитування успішно додані в базу.'))
