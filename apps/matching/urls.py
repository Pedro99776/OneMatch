from django.urls import path
from .views import GiveLikeView, CurrentMatchView, UnmatchView, PassView

urlpatterns = [
    path('like/', GiveLikeView.as_view(), name='give_like'),
    path('pass/', PassView.as_view(), name='give_pass'),
    path('current/', CurrentMatchView.as_view(), name='current_match'),
    path('<int:match_id>/unmatch/', UnmatchView.as_view(), name='unmatch'),
]
