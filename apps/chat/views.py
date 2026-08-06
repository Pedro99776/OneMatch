from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import MessageSerializer

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        match_id = self.kwargs['match_id']
        user = self.request.user
        
        # Obtém a conversa
        conversation = get_object_or_404(Conversation, match_id=match_id)
        
        # Verifica se o usuário pertence ao match
        if conversation.match.user_1 != user and conversation.match.user_2 != user:
            return Message.objects.none()
            
        # Retorna as últimas 100 mensagens (em ordem cronológica graças ao Meta.ordering)
        # Para carregar as últimas 100, primeiro buscamos do fim para o início e depois invertemos.
        messages = Message.objects.filter(
            conversation=conversation
        ).select_related('sender__profile').order_by('-created_at')[:100]
        
        # Inverte para retornar na ordem correta (mais antigas primeiro)
        return reversed(messages)
        
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        # Se retornou vazio (não pertence à conversa ou sem mensagens)
        if not queryset and not isinstance(queryset, reversed):
            return Response({"error": "Acesso negado ou chat não existe."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
