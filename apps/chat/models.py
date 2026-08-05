from django.db import models
from apps.accounts.models import CustomUser
from apps.matching.models import Match

class Conversation(models.Model):
    """Conversa vinculada a um match"""
    match = models.OneToOneField(Match, on_delete=models.CASCADE, related_name='conversation')
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    """Mensagem individual no chat em tempo real"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
