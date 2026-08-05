from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Match
from .serializers import MatchSerializer
from .services import MatchService

User = get_user_model()


class GiveLikeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        to_user_id = request.data.get('to_user_id')
        is_super_like = request.data.get('is_super_like', False)
        
        if not to_user_id:
            return Response(
                {"error": "to_user_id é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if request.user == to_user:
            return Response(
                {"error": "Você não pode dar like em si mesmo."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        result = MatchService.process_like(request.user, to_user, is_super_like)
        
        if result.get('success'):
            return Response(result, status=status.HTTP_200_OK)
        
        # Mapeia os códigos de erro para os status HTTP corretos
        code = result.get('code', 'generic_error')
        if code == 'has_active_match':
            return Response(result, status=status.HTTP_403_FORBIDDEN)
        elif code == 'daily_limit':
            return Response(result, status=status.HTTP_429_TOO_MANY_REQUESTS)
        else:
            # target_unavailable e generic_error → 409 Conflict (genérico, não revela o motivo)
            return Response(result, status=status.HTTP_409_CONFLICT)


class CurrentMatchView(APIView):
    """Retorna o match ativo atual do usuário, se houver."""
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request, *args, **kwargs):
        match = Match.objects.filter(
            (Q(user_1=request.user) | Q(user_2=request.user)) & Q(status='active')
        ).select_related(
            'user_1__profile', 'user_2__profile'
        ).prefetch_related(
            'user_1__profile__photos', 'user_2__profile__photos'
        ).first()
        
        if match:
            serializer = MatchSerializer(match)
            return Response(serializer.data)
        return Response({"message": "Nenhum match ativo."}, status=status.HTTP_204_NO_CONTENT)


class UnmatchView(APIView):
    """Desfaz um match."""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, match_id, *args, **kwargs):
        success = MatchService.unmatch(request.user, match_id)
        if success:
            return Response(
                {"message": "Match desfeito com sucesso. Ambos os perfis estão livres para novos likes!"},
                status=status.HTTP_200_OK
            )
        return Response(
            {"error": "Match não encontrado ou não pertence a você."},
            status=status.HTTP_404_NOT_FOUND
        )
