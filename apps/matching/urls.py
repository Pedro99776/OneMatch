from django.urls import path
from .views import GiveLikeView, CurrentMatchView, UnmatchView

urlpatterns = [
    path('like/', GiveLikeView.as_view(), name='give_like'),
    path('current/', CurrentMatchView.as_view(), name='current_match'),
    path('<int:match_id>/unmatch/', UnmatchView.as_view(), name='unmatch'),
]
