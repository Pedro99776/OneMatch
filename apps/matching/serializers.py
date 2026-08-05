from rest_framework import serializers
from .models import Like, Match
from apps.accounts.serializers import UserSerializer

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ('id', 'from_user', 'to_user', 'like_type', 'created_at')
        read_only_fields = ('from_user', 'created_at')

class MatchSerializer(serializers.ModelSerializer):
    user_1 = UserSerializer(read_only=True)
    user_2 = UserSerializer(read_only=True)
    
    class Meta:
        model = Match
        fields = ('id', 'user_1', 'user_2', 'status', 'created_at')
