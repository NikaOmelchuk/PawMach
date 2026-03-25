from rest_framework import serializers
from users.serializers import UserShortSerializer
from .models import (
    SurveyCategory, Survey, Question, AnswerOption,
    SurveySession, UserAnswer, CompatibilityResult
)

class SurveyCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyCategory
        fields = ('id', 'name', 'description', 'icon')

class AnswerOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerOption
        fields = ('id', 'text', 'score')

class QuestionSerializer(serializers.ModelSerializer):
    options = AnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'question_type', 'order', 'options')

class SurveyListSerializer(serializers.ModelSerializer):
    
    category = SurveyCategorySerializer(read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = (
            'id', 'title', 'description', 'category',
            'max_participants', 'is_active', 'question_count', 'created_at'
        )

    def get_question_count(self, obj) -> int:
        return obj.questions.count()

class SurveyDetailSerializer(serializers.ModelSerializer):
    
    category = SurveyCategorySerializer(read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Survey
        fields = (
            'id', 'title', 'description', 'category',
            'max_participants', 'is_active', 'questions', 'created_at'
        )

class SurveySessionSerializer(serializers.ModelSerializer):
    
    survey = SurveyListSerializer(read_only=True)
    survey_id = serializers.PrimaryKeyRelatedField(
        queryset=Survey.objects.filter(is_active=True),
        source='survey', write_only=True
    )
    participants = UserShortSerializer(many=True, read_only=True)
    created_by = UserShortSerializer(read_only=True)
    participant_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    has_submitted = serializers.SerializerMethodField()
    submitted_users = serializers.SerializerMethodField()

    class Meta:
        model = SurveySession
        fields = (
            'id', 'survey', 'survey_id', 'session_code',
            'participants', 'participant_count', 'is_full',
            'created_by', 'status', 'has_submitted', 'submitted_users', 'created_at'
        )
        read_only_fields = ('session_code', 'status', 'created_by', 'created_at')

    def get_has_submitted(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return UserAnswer.objects.filter(session=obj, user=request.user).exists()

    def get_submitted_users(self, obj):
        users = UserAnswer.objects.filter(session=obj).values_list('user__username', flat=True).distinct()
        return list(users)

class UserAnswerSubmitSerializer(serializers.Serializer):
    
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField(required=False, allow_null=True)
    scale_value = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=10)

    def validate(self, data):
        if not data.get('selected_option_id') and not data.get('scale_value'):
            raise serializers.ValidationError(
                'Потрібно вказати або selected_option_id або scale_value.'
            )
        return data

class SubmitAnswersSerializer(serializers.Serializer):
    
    answers = UserAnswerSubmitSerializer(many=True)

class CompatibilityResultSerializer(serializers.ModelSerializer):
    user1 = UserShortSerializer(read_only=True)
    user2 = UserShortSerializer(read_only=True)

    class Meta:
        model = CompatibilityResult
        fields = (
            'id', 'user1', 'user2', 'score',
            'strengths', 'weaknesses', 'lifestyle_tags', 'created_at'
        )
