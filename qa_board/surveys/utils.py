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
    for answer in answers:
        uid = answer.user_id
        qid = answer.question_id
        if uid not in user_scores:
            user_scores[uid] = {}
        user_scores[uid][qid] = answer.effective_score

    results = []
    for user1, user2 in combinations(participants, 2):
        result = _compare_users(session, user1, user2, user_scores)
        results.append(result)

    return results

def _compare_users(session, user1, user2, user_scores):
    
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
            s1 = scores1[qid]
            s2 = scores2[qid]
            diff = abs(s1 - s2)

            max_diff = 10
            sim = max(0, 1 - diff / max_diff)
            similarities.append(sim)

            if sim >= 0.8:
                strengths.append(f'Питання #{qid}: спільна думка')
            elif sim <= 0.3:
                weaknesses.append(f'Питання #{qid}: різні погляди')

        compatibility_score = (sum(similarities) / len(similarities)) * 100

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
