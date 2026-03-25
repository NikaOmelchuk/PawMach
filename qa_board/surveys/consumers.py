import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from surveys.models import SurveySession


class SurveyChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.group_name = f'chat_{self.session_id}'
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        is_participant = await self._check_participant()
        if not is_participant:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'message': f'{self.user.username} приєднався до чату',
                'username': 'Система',
                'timestamp': timezone.localtime().strftime('%H:%M'),
                'is_system': True,
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'chat_message',
                    'message': f'{self.user.username} покинув чат',
                    'username': 'Система',
                    'timestamp': timezone.localtime().strftime('%H:%M'),
                    'is_system': True,
                }
            )
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '').strip()
        if not message:
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': self.user.username,
                'timestamp': timezone.localtime().strftime('%H:%M'),
                'is_system': False,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def _check_participant(self):
        try:
            session = SurveySession.objects.get(pk=self.session_id)
            return session.participants.filter(pk=self.user.pk).exists()
        except SurveySession.DoesNotExist:
            return False

    async def survey_progress(self, event):
        await self.send(text_data=json.dumps(event))
