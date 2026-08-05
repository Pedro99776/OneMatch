from django.db import models
from apps.accounts.models import CustomUser

class Like(models.Model):
    """Registro de curtida. Usuário gratuito tem limite de 10/dia."""
    LIKE_TYPE_CHOICES = [
        ('normal', 'Normal'),
        ('super', 'Super Like'),
    ]
    
    from_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='likes_given')
    to_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='likes_received')
    like_type = models.CharField(max_length=10, choices=LIKE_TYPE_CHOICES, default='normal')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)  # False se expirou ou match foi feito
    
    class Meta:
        unique_together = ('from_user', 'to_user')

class Match(models.Model):
    """Match entre dois usuários — APENAS UM ATIVO POR USUÁRIO"""
    STATUS_CHOICES = [
        ('active', 'Ativo'),
        ('unmatched', 'Desfeito'),
    ]
    
    user_1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='matches_as_user1')
    user_2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='matches_as_user2')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    unmatched_at = models.DateTimeField(null=True, blank=True)
    unmatched_by = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL, related_name='unmatched_matches')
    
    class Meta:
        constraints = [
            # Garante que cada usuário só tem UM match ativo
            models.UniqueConstraint(
                fields=['user_1'], 
                condition=models.Q(status='active'),
                name='unique_active_match_user1'
            ),
            models.UniqueConstraint(
                fields=['user_2'], 
                condition=models.Q(status='active'),
                name='unique_active_match_user2'
            ),
        ]
