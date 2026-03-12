import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qa_board.settings')
django.setup()

from surveys.models import SurveySession, UserAnswer
from surveys.utils import _compare_users

sess = SurveySession.objects.get(id=20)
print("Session ID:", sess.id)
print("Total Questions:", sess.survey.questions.count())

users = list(sess.participants.all())
user_scores = {}
q_map = {}

for q in sess.survey.questions.all():
    q_map[q.id] = q

for ans in sess.user_answers.all():
    if ans.user_id not in user_scores:
        user_scores[ans.user_id] = {}
    user_scores[ans.user_id][ans.question_id] = ans

res = _compare_users(sess, users[0], users[1], user_scores, q_map)
print("SCORE:", res.score, "STRENGTHS:", res.strengths)

scores1 = user_scores.get(users[0].id, {})
scores2 = user_scores.get(users[1].id, {})
common_questions = set(scores1.keys()) & set(scores2.keys())
print(f"Common questions answered by both: {len(common_questions)}")


