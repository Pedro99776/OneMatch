import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from apps.matching.models import Match

User = get_user_model()
logger = logging.getLogger(__name__)

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
        logger.debug(f"[WS RECEIVE] Recebendo mensagem: {text_data}")
        text_data_json = json.loads(text_data)
        msg_type = text_data_json.get('type', 'chat_message')
        
        if msg_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_status',
                    'sender_id': self.user.id,
                    'is_typing': text_data_json.get('is_typing', False)
                }
            )
        elif msg_type == 'read_receipt':
            # Persiste no banco: marca mensagens não lidas do outro usuário como lidas
            await self.mark_messages_read(self.user, self.match_id)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt_status',
                    'reader_id': self.user.id
                }
            )
        else:
            message = text_data_json.get('message')
            if not message:
                return

            # Salva no banco de dados e retorna os dados seguros
            logger.debug("[WS RECEIVE] Salvando no banco de dados...")
            msg_data = await self.save_message(self.user, self.match_id, message)
            
            if msg_data:
                logger.debug(f"[WS RECEIVE] Mensagem salva com sucesso: {msg_data}. Enviando para o grupo {self.room_group_name}...")
                # Envia a mensagem para a sala (group)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message,
                        'sender_id': msg_data['sender_id'],
                        'sender_name': msg_data['sender_name'],
                        'msg_id': msg_data['msg_id'],
                        'created_at': msg_data['created_at'],
                    }
                )
                logger.debug("[WS RECEIVE] group_send finalizado!")
            else:
                logger.warning("[WS RECEIVE] Falha ao salvar a mensagem (provavelmente match não está ativo).")

    # Recebe a mensagem do group (Redis) e manda pro WebSocket
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'msg_id': event['msg_id'],
            'created_at': event.get('created_at', ''),
        }))

    async def typing_status(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender_id': event['sender_id'],
            'is_typing': event['is_typing']
        }))

    async def read_receipt_status(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'reader_id': event['reader_id']
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
                
            msg = Message.objects.create(
                conversation=conversation,
                sender=user,
                content=content
            )
            
            # Puxa o nome do perfil de forma segura na thread sincrona
            sender_name = user.profile.display_name if hasattr(user, 'profile') else user.username
            
            return {
                'msg_id': msg.id,
                'sender_id': user.id,
                'sender_name': sender_name,
                'created_at': msg.created_at.isoformat(),
            }
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def mark_messages_read(self, user, match_id):
        """Marca como lidas todas as mensagens da conversa enviadas pelo outro usuário."""
        try:
            conversation = Conversation.objects.get(match_id=match_id)
            Message.objects.filter(
                conversation=conversation,
                is_read=False
            ).exclude(sender=user).update(is_read=True)
        except Conversation.DoesNotExist:
            pass

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        
        if self.user.is_anonymous:
            await self.close()
            return
            
        self.room_group_name = f'user_notifications_{self.user.id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def notification_message(self, event):
        await self.send(text_data=json.dumps(event['message']))
