from itertools import combinations
from .models import UserAnswer, CompatibilityResult

def calculate_compatibility(session):
    
    participants = list(session.participants.all())
    if len(participants) < 2:
        return []

    answers = UserAnswer.objects.filter(session=session).select_related(
        'user', 'question', 'selected_option'
    )

    user_scores = {}
    question_map = {}
    for answer in answers:
        uid = answer.user_id
        qid = answer.question_id
        if uid not in user_scores:
            user_scores[uid] = {}
        user_scores[uid][qid] = answer
        if qid not in question_map:
            question_map[qid] = answer.question

    results = []
    for user1, user2 in combinations(participants, 2):
        result = _compare_users(session, user1, user2, user_scores, question_map)
        results.append(result)

    return results

def _compare_users(session, user1, user2, user_scores, question_map):
    
    scores1 = user_scores.get(user1.id, {})
    scores2 = user_scores.get(user2.id, {})

    common_questions = set(scores1.keys()) & set(scores2.keys())

    if not common_questions:
        compatibility_score = 0.0
        strengths = []
        weaknesses = []
    else:
        similarities = []
        strengths = []
        weaknesses = []

        for qid in common_questions:
            question = question_map[qid]
            ans1 = scores1[qid]
            ans2 = scores2[qid]

            sim = 0.0

            if question.question_type == 'scale':
                v1 = int(ans1.scale_value or 5)
                v2 = int(ans2.scale_value or 5)
                diff = float(abs(v1 - v2))
                sim = float(max(0.0, 1.0 - diff / 9.0))
            else:
                opt1 = ans1.selected_option
                opt2 = ans2.selected_option
                
                sim = 1.0 if (opt1 and opt2 and opt1.id == opt2.id) else 0.0

            similarities.append(float(sim))

            q_text = question.text[:60] + '...' if len(question.text) > 60 else question.text
            if sim >= 0.8:
                strengths.append(f'{q_text}: спільна думка')
            elif sim <= 0.3:
                weaknesses.append(f'{q_text}: різні погляди')

        total_questions = session.survey.questions.count()
        if total_questions > 0:
            compatibility_score = (sum(similarities) / total_questions) * 100
        else:
            compatibility_score = 0.0

    lifestyle_tags = _generate_lifestyle_tags(compatibility_score)

    obj, _ = CompatibilityResult.objects.update_or_create(
        session=session,
        user1=user1,
        user2=user2,
        defaults={
            'score': round(compatibility_score, 1),
            'strengths': strengths,
            'weaknesses': weaknesses,
            'lifestyle_tags': lifestyle_tags,
        }
    )
    return obj

def _generate_lifestyle_tags(score):
    
    if score >= 80:
        return ['Дуже схожий стиль життя', 'Спільні цінності', 'Відмінна командна робота']
    elif score >= 60:
        return ['Схожі пріоритети', 'Є точки дотику', 'Добре розуміння']
    elif score >= 40:
        return ['Різні підходи', 'Є можливість навчитись одне від одного']
    else:
        return ['Різні стилі життя', 'Потребує взаємних компромісів']
