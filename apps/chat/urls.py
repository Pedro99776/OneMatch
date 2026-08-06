from django.urls import path
from . import views

urlpatterns = [
    path('<int:match_id>/messages/', views.MessageListView.as_view(), name='chat-messages'),
]
