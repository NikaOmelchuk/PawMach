from django.contrib import admin
from .models import (
    SurveyCategory, Survey, Question, AnswerOption,
    SurveySession, UserAnswer, CompatibilityResult
)

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1

class AnswerOptionInline(admin.TabularInline):
    model = AnswerOption
    extra = 2

@admin.register(SurveyCategory)
class SurveyCategoryAdmin(admin.ModelAdmin):
    list_display = ('icon', 'name', 'description')
    search_fields = ('name',)

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'max_participants', 'is_active', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('title', 'description')
    inlines = [QuestionInline]

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'survey', 'question_type', 'order')
    list_filter = ('survey', 'question_type')
    inlines = [AnswerOptionInline]

@admin.register(AnswerOption)
class AnswerOptionAdmin(admin.ModelAdmin):
    list_display = ('text', 'question', 'score')
    list_filter = ('question__survey',)

@admin.register(SurveySession)
class SurveySessionAdmin(admin.ModelAdmin):
    change_list_template = "admin/change_list_auto_refresh.html"

    list_display = ('survey', 'session_code', 'status', 'participant_count', 'created_at')
    list_filter = ('status', 'survey')
    search_fields = ('session_code',)
    list_editable = ('status',)
    filter_horizontal = ('participants',)
    readonly_fields = ('session_code', 'created_at')

@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ('user', 'session', 'question', 'selected_option', 'scale_value')
    list_filter = ('session__survey',)

@admin.register(CompatibilityResult)
class CompatibilityResultAdmin(admin.ModelAdmin):
    list_display = ('session', 'user1', 'user2', 'score', 'created_at')
    list_filter = ('session__survey',)
    readonly_fields = ('created_at',)
