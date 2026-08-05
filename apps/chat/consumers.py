import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from apps.matching.models import Match

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.room_group_name = f'chat_{self.match_id}'
        self.user = self.scope['user']
        
        # Verifica se usuário está autenticado e se pertence a este match
        if self.user.is_anonymous:
            await self.close()
            return
            
        is_member = await self.is_match_member(self.user, self.match_id)
        if not is_member:
            await self.close()
            return

        # Entra na sala (group) do Redis
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Sai da sala
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recebe mensagem do WebSocket (Frontend)
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message')
        
        if not message:
            return

        # Salva no banco de dados
        msg_obj = await self.save_message(self.user, self.match_id, message)
        
        if msg_obj:
            # Envia a mensagem para a sala (group)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': self.user.id,
                    'sender_name': self.user.profile.display_name
                }
            )

    # Recebe a mensagem do group (Redis) e manda pro WebSocket
    async def chat_message(self, event):
        message = event['message']
        sender_id = event['sender_id']
        sender_name = event['sender_name']

        await self.send(text_data=json.dumps({
            'message': message,
            'sender_id': sender_id,
            'sender_name': sender_name
        }))

    @database_sync_to_async
    def is_match_member(self, user, match_id):
        try:
            match = Match.objects.get(id=match_id, status='active')
            return match.user_1 == user or match.user_2 == user
        except Match.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, user, match_id, content):
        try:
            conversation = Conversation.objects.get(match_id=match_id)
            # Confere novamente se o match está ativo antes de salvar
            if conversation.match.status != 'active':
                return None
                
            return Message.objects.create(
                conversation=conversation,
                sender=user,
                content=content
            )
        except Conversation.DoesNotExist:
            return None
