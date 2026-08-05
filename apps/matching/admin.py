from django.contrib import admin
from .models import Like, Match

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['from_user', 'to_user', 'like_type', 'created_at', 'is_active']
    list_filter = ['like_type', 'is_active', 'created_at']
    search_fields = ['from_user__email', 'to_user__email']

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ['user_1', 'user_2', 'status', 'created_at', 'unmatched_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user_1__email', 'user_2__email']
