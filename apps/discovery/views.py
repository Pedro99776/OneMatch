from rest_framework import generics, permissions
from django.db.models import Q
from apps.accounts.models import Profile
from apps.accounts.serializers import ProfileSerializer
from apps.matching.models import Like


class SwipeFeedView(generics.ListAPIView):
    """
    Retorna perfis para o feed de descoberta (estilo Swipe).
    
    Regras de filtragem:
    1. Usuário com match ativo → feed vazio (não pode explorar)
    2. Exclui o próprio usuário
    3. Exclui quem já recebeu like deste usuário
    4. Exclui perfis com match ativo (evita aparecer para alguém indisponível)
    5. Filtro de compatibilidade bidirecional de gênero:
       - Se busco Mulheres (F), só mostro mulheres que buscam Homens (M) ou Todos (A)
       - Se busco Homens (M), só mostro homens que buscam Mulheres (F) ou Todos (A)
       - Se busco Todos (A), só mostro quem aceita o meu gênero ou busca Todos

    Filtro geográfico:
    - Desabilitado no MVP para não limitar o feed com poucos usuários.
    - Para ativar no futuro, descomentar o bloco `# GEO_FILTER` abaixo.
    """
    serializer_class = ProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        user = self.request.user

        # — Regra 1: Usuário com match ativo não pode explorar
        if hasattr(user, 'profile') and user.profile.has_active_match:
            return Profile.objects.none()

        # — Regra 2/3: Usuários que já receberam like
        liked_user_ids = Like.objects.filter(
            from_user=user
        ).values_list('to_user_id', flat=True)

        # — Regra 4/5: Filtro base + perfis com match ativo excluídos
        queryset = Profile.objects.filter(
            display_name__gt='',          # Só perfis com setup completo
            has_active_match=False,        # PROTEÇÃO PRINCIPAL: exclui quem já tem match
        ).exclude(
            user=user                      # Exclui o próprio usuário
        ).exclude(
            user_id__in=liked_user_ids     # Exclui quem já recebeu like
        )

        # — Filtro bidirecional de gênero e preferências
        my_gender = getattr(getattr(user, 'profile', None), 'gender', '')
        looking_for = getattr(getattr(user, 'profile', None), 'looking_for', 'A')

        if looking_for != 'A':
            # Filtro no gênero do outro: só mostro o gênero que busco
            queryset = queryset.filter(gender=looking_for)

        # Filtro bidirecional: o outro deve também aceitar o meu gênero
        if my_gender:
            queryset = queryset.filter(
                Q(looking_for=my_gender) | Q(looking_for='A')
            )

        # ─── GEO_FILTER (desabilitado no MVP) ───────────────────────────
        # Para ativar: descomentar as linhas abaixo e remover este comentário.
        # Recomendação futura: migrar para PostGIS e usar filtro por distância (km).
        #
        # user_city = getattr(getattr(user, 'profile', None), 'city', '')
        # user_state = getattr(getattr(user, 'profile', None), 'state', '')
        # if user_city and user_state:
        #     queryset = queryset.filter(city=user_city, state=user_state)
        # ────────────────────────────────────────────────────────────────

        return queryset.order_by('?')[:20]
