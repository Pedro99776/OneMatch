from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from django.db.models import Q
from apps.accounts.models import Profile
from apps.accounts.serializers import ProfileSerializer
from apps.matching.models import Like

User = get_user_model()

class SwipeFeedView(generics.ListAPIView):
    """Retorna perfis para o feed no estilo Swipe"""
    serializer_class = ProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        user = self.request.user
        
        # 1. Se o usuário tem um match ativo, ele NÃO PODE explorar (retorna vazio)
        if user.profile.has_active_match:
            return Profile.objects.none()
            
        # 2. Usuários que já receberam like (para não mostrar de novo)
        liked_users = Like.objects.filter(from_user=user).values_list('to_user_id', flat=True)
        
        # 3. Filtros básicos
        queryset = Profile.objects.filter(
            has_active_match=False  # Só mostrar pessoas livres
        ).exclude(
            user=user  # Exclui o próprio usuário
        ).exclude(
            user_id__in=liked_users  # Exclui quem já recebeu like
        )
        
        # Filtro de gênero baseado na preferência do usuário logado
        looking_for = user.profile.looking_for
        if looking_for != 'A':  # Se não for "Todos"
            queryset = queryset.filter(gender=looking_for)
            
        # Para MVP: Filtro estrito de mesma cidade (opcional, dependendo de como preferir)
        # queryset = queryset.filter(city=user.profile.city, state=user.profile.state)
        
        # Randomizando ou ordenando
        return queryset.order_by('?')[:20]  # Retorna 20 perfis aleatórios para o feed
