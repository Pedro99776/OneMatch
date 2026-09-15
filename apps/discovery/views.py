from rest_framework import generics, permissions
from django.db.models import Q, F
from django.db.models.functions import ACos, Cos, Radians, Sin
from apps.accounts.models import Profile
from apps.accounts.serializers import ProfileSerializer
from django.utils import timezone
from datetime import timedelta
from apps.matching.models import Like, Pass


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
        
        # Passes nos últimos 90 dias
        cutoff_date = timezone.now() - timedelta(days=90)
        passed_user_ids = Pass.objects.filter(
            from_user=user,
            created_at__gte=cutoff_date
        ).values_list('to_user_id', flat=True)

        # — Regra 4/5: Filtro base + perfis com match ativo excluídos
        base_queryset = Profile.objects.filter(
            display_name__gt='',          # Só perfis com setup completo
            has_active_match=False,        # PROTEÇÃO PRINCIPAL: exclui quem já tem match
        ).exclude(
            user=user                      # Exclui o próprio usuário
        ).exclude(
            user_id__in=liked_user_ids     # Exclui quem já recebeu like
        ).exclude(
            user_id__in=passed_user_ids    # Exclui passes recentes
        )

        queryset = base_queryset

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

        # — Filtros de Idade (Bidirecional)
        if user.date_of_birth:
            today = timezone.now().date()
            # Calcula minha idade
            my_age = today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day))
            
            # Filtro 1: O outro me aceita (minha idade está dentro da preferência do outro)
            queryset = queryset.filter(
                min_age_preference__lte=my_age,
                max_age_preference__gte=my_age
            )

        # Filtro 2: Eu aceito o outro (a data de nascimento do outro está na minha faixa)
        my_profile = getattr(user, 'profile', None)
        if my_profile:
            min_age = my_profile.min_age_preference
            max_age = my_profile.max_age_preference
            
            today = timezone.now().date()
            try:
                min_birth_date = today.replace(year=today.year - max_age - 1) + timedelta(days=1)
            except ValueError:
                min_birth_date = today.replace(year=today.year - max_age - 1, day=28) + timedelta(days=1)
                
            try:
                max_birth_date = today.replace(year=today.year - min_age)
            except ValueError:
                max_birth_date = today.replace(year=today.year - min_age, day=28)
                
            queryset = queryset.filter(
                user__date_of_birth__gte=min_birth_date,
                user__date_of_birth__lte=max_birth_date
            )
            
        # — Novos Filtros Opcionais
        if my_profile:
            if my_profile.filter_min_height:
                queryset = queryset.filter(
                    Q(height_cm__gte=my_profile.filter_min_height) | Q(height_cm__isnull=True)
                )
            if my_profile.filter_max_height:
                queryset = queryset.filter(
                    Q(height_cm__lte=my_profile.filter_max_height) | Q(height_cm__isnull=True)
                )
            if my_profile.filter_education:
                queryset = queryset.filter(
                    Q(education__in=my_profile.filter_education) | Q(education='')
                )
            if my_profile.filter_religion:
                queryset = queryset.filter(
                    Q(religion__in=my_profile.filter_religion) | Q(religion='')
                )
            if my_profile.filter_politics:
                queryset = queryset.filter(
                    Q(politics__in=my_profile.filter_politics) | Q(politics='')
                )

        # ─── HA VERSINE FILTER (MVP) ───────────────────────────
        # NOTA: Para milhares de usuários numa mesma região, esta fórmula pode ficar lenta
        # por recalcular a distância em cada linha (Full Table Scan sem índice espacial).
        # ESCALABILIDADE: Quando tiver tração, habilite a extensão PostGIS no Supabase,
        # altere lat/lon para um PointField e use `distance__lte` nativo do GeoDjango.
        
        user_lat = getattr(my_profile, 'latitude', None)
        user_lon = getattr(my_profile, 'longitude', None)
        user_max_dist = getattr(my_profile, 'max_distance_km', 50)
        
        if user_lat is not None and user_lon is not None:
            import math
            lat_delta = user_max_dist / 111.0
            lon_delta = user_max_dist / (111.0 * abs(math.cos(math.radians(user_lat))))
            
            queryset = queryset.filter(
                latitude__gte=user_lat - lat_delta,
                latitude__lte=user_lat + lat_delta,
                longitude__gte=user_lon - lon_delta,
                longitude__lte=user_lon + lon_delta
            )
            
            queryset = queryset.annotate(
                distance=ACos(
                    Cos(Radians(user_lat)) * Cos(Radians(F('latitude'))) *
                    Cos(Radians(F('longitude')) - Radians(user_lon)) +
                    Sin(Radians(user_lat)) * Sin(Radians(F('latitude')))
                ) * 6371.0
            ).filter(distance__lte=user_max_dist)
        # ────────────────────────────────────────────────────────────────

        # Fallback se os filtros rígidos (idade, opções avançadas, distância) deixarem o feed vazio
        results = list(queryset.prefetch_related('photos', 'prompts').order_by('?')[:20])

        if not results:
            # Retornamos apenas com os filtros base e de gênero (que consideramos inegociável)
            fallback_qs = base_queryset
            if looking_for != 'A':
                fallback_qs = fallback_qs.filter(gender=looking_for)
            if my_gender:
                fallback_qs = fallback_qs.filter(
                    Q(looking_for=my_gender) | Q(looking_for='A')
                )
            results = list(fallback_qs.prefetch_related('photos', 'prompts').order_by('?')[:20])

        return results
