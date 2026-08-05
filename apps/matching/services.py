from django.utils import timezone
from django.db import transaction
from .models import Like, Match
from apps.chat.models import Conversation


class MatchService:
    """Lógica core de negócio do Match Único e Limites (Monetização)"""
    
    @staticmethod
    def can_user_like(user) -> dict:
        """Verifica se o usuário pode dar like baseado no status do match e limites diários"""
        if user.profile.has_active_match:
            return {
                "allowed": False,
                "reason": "Você já tem um match ativo. Desfaça-o primeiro para curtir novos perfis.",
                "code": "has_active_match",
            }
            
        # Lógica de monetização (Limite diário para usuários gratuitos)
        if not user.is_premium:
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            likes_today = Like.objects.filter(from_user=user, created_at__gte=today_start).count()
            
            if likes_today >= 10:
                return {
                    "allowed": False,
                    "reason": "Você atingiu o limite de 10 likes por dia. Assine o plano Premium para curtidas ilimitadas!",
                    "code": "daily_limit",
                }
                
        return {"allowed": True, "reason": "", "code": None}

    @staticmethod
    @transaction.atomic
    def process_like(from_user, to_user, is_super_like=False) -> dict:
        """
        Processa um like e verifica se gerou match.
        
        Proteções de integridade:
        1. Verifica se o from_user pode dar likes (match ativo / limite diário)
        2. Usa select_for_update() para bloquear o perfil do to_user durante a transação,
           evitando race condition onde dois likes simultâneos geram dois matches.
        3. Re-verifica se o to_user ainda está disponível NO MOMENTO do like
           (pode ter acabado de dar match com outra pessoa entre o feed e o like).
        4. Em caso de indisponibilidade, retorna erro GENÉRICO — nunca revela
           que o outro perfil fez match com outra pessoa.
        """
        # — Verificação 1: O usuário que está dando like pode fazê-lo?
        can_like = MatchService.can_user_like(from_user)
        if not can_like['allowed']:
            return {
                "success": False,
                "message": can_like['reason'],
                "code": can_like['code'],
                "is_match": False,
            }
        
        # — Verificação 2: Bloqueia o perfil do destinatário com select_for_update
        # Isso garante que, em requisições simultâneas, apenas uma processa o match.
        try:
            to_user_profile = to_user.profile.__class__.objects.select_for_update().get(
                user=to_user
            )
        except Exception:
            return {
                "success": False,
                "message": "Não foi possível completar a ação. Tente novamente.",
                "code": "generic_error",
                "is_match": False,
            }

        # — Verificação 3: O destinatário ainda está disponível?
        # (pode ter dado match com outra pessoa após o feed ser carregado)
        if to_user_profile.has_active_match:
            return {
                "success": False,
                "message": "Ops! Algo deu errado. Esse perfil não está mais disponível.",
                "code": "target_unavailable",  # Código genérico — não revela o motivo real
                "is_match": False,
            }
            
        # — Verificação do like mútuo
        mutual_like = Like.objects.filter(
            from_user=to_user,
            to_user=from_user,
            is_active=True
        ).first()
        
        like_type = 'super' if is_super_like else 'normal'
        
        if mutual_like:
            # É UM MATCH! 🎉
            
            # 1. Cria o Match
            match = Match.objects.create(user_1=from_user, user_2=to_user)
            
            # 2. Bloqueia ambos os perfis (Regra do Match Único)
            #    Atualizamos diretamente pelo ORM com update() para garantir
            #    que nenhuma outra transação paralela também consiga criar um match.
            from_user.profile.__class__.objects.filter(user=from_user).update(has_active_match=True)
            to_user_profile.__class__.objects.filter(user=to_user).update(has_active_match=True)

            # Recarrega os objetos para refletir o estado atualizado
            from_user.profile.refresh_from_db()
            to_user_profile.refresh_from_db()
            
            # 3. Desativa os likes para não serem reprocessados
            mutual_like.is_active = False
            mutual_like.save()
            
            Like.objects.create(
                from_user=from_user,
                to_user=to_user,
                like_type=like_type,
                is_active=False
            )
            
            # 4. Cria a sala de chat (Conversation)
            Conversation.objects.create(match=match)
            
            return {
                "success": True,
                "message": "É um Match!",
                "is_match": True,
                "match_id": match.id,
            }
        else:
            # Apenas um Like normal — registra para verificação futura de match mútuo
            Like.objects.update_or_create(
                from_user=from_user, 
                to_user=to_user,
                defaults={'like_type': like_type, 'is_active': True}
            )
            return {
                "success": True,
                "message": "Like enviado com sucesso.",
                "is_match": False,
            }

    @staticmethod
    @transaction.atomic
    def unmatch(user, match_id) -> bool:
        """Desfaz o match e libera os dois usuários"""
        try:
            from django.db.models import Q
            match = Match.objects.select_for_update().get(id=match_id, status='active')
            
            # Verifica se o usuário pertence a este match
            if match.user_1 != user and match.user_2 != user:
                return False
                
            # 1. Atualiza o status do Match
            match.status = 'unmatched'
            match.unmatched_at = timezone.now()
            match.unmatched_by = user
            match.save()
            
            # 2. Libera ambos os usuários
            match.user_1.profile.__class__.objects.filter(user=match.user_1).update(has_active_match=False)
            match.user_2.profile.__class__.objects.filter(user=match.user_2).update(has_active_match=False)
            
            # A conversa fica preservada no histórico (não permite novas mensagens
            # pois o match não é mais 'active').
            
            return True
        except Match.DoesNotExist:
            return False
