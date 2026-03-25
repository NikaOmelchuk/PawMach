from django.urls import re_path
from surveys.consumers import SurveyChatConsumer
from users.consumers import OnlineStatusConsumer

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<session_id>\d+)/$', SurveyChatConsumer.as_asgi()),
    re_path(r'^ws/online/$', OnlineStatusConsumer.as_asgi()),
]
