from django.db import models

class ChatMessage(models.Model):
    author_id = models.IntegerField(help_text="ID користувача з основної бази")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Msg by User#{self.author_id} at {self.created_at}"

class Article(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author_id = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    author_id = models.IntegerField()
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class AnnouncementReaction(models.Model):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name='reactions')
    user_id = models.IntegerField()
    reaction_type = models.CharField(max_length=50)

class QnaQuestion(models.Model):
    author_id = models.IntegerField()
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class QnaAnswer(models.Model):
    question = models.ForeignKey(QnaQuestion, on_delete=models.CASCADE, related_name='answers')
    author_id = models.IntegerField()
    content = models.TextField()
    rating = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class TodoTask(models.Model):
    user_id = models.IntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Timer(models.Model):
    user_id = models.IntegerField()
    title = models.CharField(max_length=255)
    duration_seconds = models.IntegerField()
    started_at = models.DateTimeField(auto_now_add=True)

class LabPoll(models.Model):
    author_id = models.IntegerField()
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class LabPollOption(models.Model):
    poll = models.ForeignKey(LabPoll, on_delete=models.CASCADE, related_name='options')
    text = models.CharField(max_length=255)

class LabPollVote(models.Model):
    option = models.ForeignKey(LabPollOption, on_delete=models.CASCADE, related_name='votes')
    user_id = models.IntegerField()

class ScoreEntry(models.Model):
    user_id = models.IntegerField(unique=True)
    score = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

class Quiz(models.Model):
    author_id = models.IntegerField()
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=255)

class QuizChoice(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

class QuizSubmission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='submissions')
    user_id = models.IntegerField()
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class AsyncTaskResult(models.Model):
    task_name = models.CharField(max_length=255)
    task_data = models.TextField()
    result = models.TextField()
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']
