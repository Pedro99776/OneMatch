from django.urls import path
from .views import SwipeFeedView

urlpatterns = [
    path('feed/', SwipeFeedView.as_view(), name='swipe_feed'),
]
