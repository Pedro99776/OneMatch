from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from .models import Like, Match
from apps.chat.models import Conversation

class MatchService:
    """Lógica core de negócio do Match Único e Limites (Monetização)"""
    
    @staticmethod
    def can_user_like(user) -> dict:
        """Verifica se o usuário pode dar like baseado no status do match e limites diários"""
        if user.profile.has_active_match:
            return {"allowed": False, "reason": "Você já tem um match ativo. Desfaça-o primeiro para curtir novos perfis."}
            
        # Lógica de monetização (Limite diário)
        if not user.is_premium:
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            likes_today = Like.objects.filter(from_user=user, created_at__gte=today_start).count()
            
            if likes_today >= 10:
                return {"allowed": False, "reason": "Você atingiu o limite de 10 likes por dia. Assine o plano Premium para curtidas ilimitadas!"}
                
        return {"allowed": True, "reason": ""}

    @staticmethod
    @transaction.atomic
    def process_like(from_user, to_user, is_super_like=False) -> dict:
        """Processa um like e verifica se gerou match"""
        can_like = MatchService.can_user_like(from_user)
        if not can_like['allowed']:
            return {"success": False, "message": can_like['reason'], "is_match": False}
            
        # Verifica se o outro usuário já deu like neste (Match!)
        # Considera apenas likes ativos
        mutual_like = Like.objects.filter(from_user=to_user, to_user=from_user, is_active=True).first()
        
        like_type = 'super' if is_super_like else 'normal'
        
        if mutual_like:
            # É UM MATCH! 🎉
            # 1. Cria o Match
            match = Match.objects.create(user_1=from_user, user_2=to_user)
            
            # 2. Atualiza os perfis (Bloqueia ambos - Regra do Match Único)
            from_user.profile.has_active_match = True
            from_user.profile.save()
            
            to_user.profile.has_active_match = True
            to_user.profile.save()
            
            # 3. Desativa os likes para não serem reprocessados
            mutual_like.is_active = False
            mutual_like.save()
            
            Like.objects.create(from_user=from_user, to_user=to_user, like_type=like_type, is_active=False)
            
            # 4. Cria a sala de chat (Conversation)
            Conversation.objects.create(match=match)
            
            return {"success": True, "message": "Match!", "is_match": True, "match_id": match.id}
        else:
            # Apenas um Like normal
            # Verifica se já existe para não duplicar (usando get_or_create ou update_or_create)
            Like.objects.update_or_create(
                from_user=from_user, 
                to_user=to_user,
                defaults={'like_type': like_type, 'is_active': True}
            )
            return {"success": True, "message": "Like enviado com sucesso.", "is_match": False}

    @staticmethod
    @transaction.atomic
    def unmatch(user, match_id) -> bool:
        """Desfaz o match e libera os dois usuários"""
        try:
            from django.db.models import Q
            match = Match.objects.get(id=match_id, status='active')
            
            # Verifica se o usuário pertence a este match
            if match.user_1 != user and match.user_2 != user:
                return False
                
            # 1. Atualiza o status do Match
            match.status = 'unmatched'
            match.unmatched_at = timezone.now()
            match.unmatched_by = user
            match.save()
            
            # 2. Libera ambos os usuários
            match.user_1.profile.has_active_match = False
            match.user_1.profile.save()
            
            match.user_2.profile.has_active_match = False
            match.user_2.profile.save()
            
            # A conversa fica preservada no histórico (opcional), mas não permite novas mensagens
            # pois o match não é mais 'active'.
            
            return True
        except Match.DoesNotExist:
            return False
