import os
import django
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        # Verifica se o token é válido
        UntypedToken(token_key)
        # Extrai os dados do payload
        decoded_data = jwt_decode(token_key, settings.SECRET_KEY, algorithms=["HS256"])
        # select_related('profile') evita consultas síncronas bloqueantes dentro do AsyncWebsocketConsumer
        user = User.objects.select_related('profile').get(id=decoded_data["user_id"])
        return user
    except (InvalidToken, TokenError, Exception) as e:
        import traceback
        traceback.print_exc()
        print(f"ERRO AO DECODIFICAR TOKEN NO WEBSOCKET: {e}")
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Middleware customizado que lê o JWT da query string do WebSocket
    Exemplo: ws://localhost:8000/ws/chat/1/?token=ey...
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        
        token = query_params.get('token')
        if token:
            token = token[0]
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
            
        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
