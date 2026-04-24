from rest_framework import serializers
from .models import (
    ChatMessage, Article, Comment, Announcement, AnnouncementReaction,
    QnaQuestion, QnaAnswer, TodoTask, Timer,
    LabPoll, LabPollOption, LabPollVote,
    ScoreEntry, Quiz, QuizQuestion, QuizChoice, QuizSubmission,
    AsyncTaskResult
)

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'author_id', 'content', 'created_at']
        read_only_fields = ['id', 'author_id', 'created_at']

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'article', 'author_id', 'text', 'created_at']
        read_only_fields = ['id', 'author_id', 'created_at']

class ArticleSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'author_id', 'created_at', 'comments']
        read_only_fields = ['id', 'author_id', 'created_at']

class AnnouncementReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementReaction
        fields = ['id', 'announcement', 'user_id', 'reaction_type']
        read_only_fields = ['id', 'user_id']

class AnnouncementSerializer(serializers.ModelSerializer):
    reactions_count = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'created_at', 'reactions_count']
        read_only_fields = ['id', 'created_at']

    def get_reactions_count(self, obj):
        return obj.reactions.count()

class QnaAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QnaAnswer
        fields = ['id', 'question', 'author_id', 'content', 'rating', 'created_at']
        read_only_fields = ['id', 'author_id', 'created_at']

class QnaQuestionSerializer(serializers.ModelSerializer):
    answers = QnaAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QnaQuestion
        fields = ['id', 'author_id', 'title', 'content', 'created_at', 'answers']
        read_only_fields = ['id', 'author_id', 'created_at']

class TodoTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = TodoTask
        fields = ['id', 'user_id', 'title', 'description', 'is_completed', 'created_at']
        read_only_fields = ['id', 'user_id', 'created_at']

class TimerSerializer(serializers.ModelSerializer):
    is_finished = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Timer
        fields = ['id', 'user_id', 'title', 'duration_seconds', 'started_at', 'is_finished', 'remaining_seconds']
        read_only_fields = ['id', 'user_id', 'started_at']

    def get_is_finished(self, obj):
        from django.utils import timezone
        elapsed = (timezone.now() - obj.started_at).total_seconds()
        return elapsed >= obj.duration_seconds

    def get_remaining_seconds(self, obj):
        from django.utils import timezone
        elapsed = (timezone.now() - obj.started_at).total_seconds()
        return max(0, obj.duration_seconds - int(elapsed))

class LabPollVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabPollVote
        fields = ['id', 'option', 'user_id']
        read_only_fields = ['id', 'user_id']

class LabPollOptionSerializer(serializers.ModelSerializer):
    votes_count = serializers.SerializerMethodField()

    class Meta:
        model = LabPollOption
        fields = ['id', 'poll', 'text', 'votes_count']

    def get_votes_count(self, obj):
        return obj.votes.count()

class LabPollSerializer(serializers.ModelSerializer):
    options = LabPollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()

    class Meta:
        model = LabPoll
        fields = ['id', 'author_id', 'title', 'created_at', 'options', 'total_votes']
        read_only_fields = ['id', 'author_id', 'created_at']

    def get_total_votes(self, obj):
        return sum(opt.votes.count() for opt in obj.options.all())

class ScoreEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoreEntry
        fields = ['id', 'user_id', 'score', 'last_updated']
        read_only_fields = ['id', 'last_updated']

class QuizChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizChoice
        fields = ['id', 'question', 'text', 'is_correct']

class QuizQuestionSerializer(serializers.ModelSerializer):
    choices = QuizChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = ['id', 'quiz', 'text', 'choices']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'author_id', 'title', 'created_at', 'questions']
        read_only_fields = ['id', 'author_id', 'created_at']

class QuizSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSubmission
        fields = ['id', 'quiz', 'user_id', 'score', 'created_at']
        read_only_fields = ['id', 'user_id', 'created_at']

class AsyncTaskResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsyncTaskResult
        fields = '__all__'
