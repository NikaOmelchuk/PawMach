import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class OnlineStatusConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        await self._set_online(True)
        await self.channel_layer.group_add('admin_online', self.channel_name)
        await self.accept()
        await self._broadcast_online_list()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self._set_online(False)
            await self.channel_layer.group_discard('admin_online', self.channel_name)
            await self._broadcast_online_list()

    async def receive(self, text_data):
        pass

    async def online_list_update(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def _set_online(self, status):
        from users.models import CustomUser
        CustomUser.objects.filter(pk=self.user.pk).update(
            is_online=status,
            last_seen=timezone.now(),
        )

    @database_sync_to_async
    def _get_online_users(self):
        from users.models import CustomUser
        users = CustomUser.objects.filter(is_online=True).values(
            'id', 'username', 'email', 'last_seen'
        )
        return [
            {
                'id': u['id'],
                'username': u['username'],
                'email': u['email'],
                'last_seen': u['last_seen'].strftime('%H:%M:%S') if u['last_seen'] else None,
            }
            for u in users
        ]

    async def _broadcast_online_list(self):
        users = await self._get_online_users()
        await self.channel_layer.group_send(
            'admin_online',
            {
                'type': 'online_list_update',
                'users': users,
                'count': len(users),
            }
        )
