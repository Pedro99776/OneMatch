from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Profile, ProfilePhoto

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Retorna dados do usuário e status do perfil junto com os tokens JWT."""

    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        has_profile = Profile.objects.filter(
            user=user,
            display_name__gt='',  # Perfil com nome preenchido = setup completo
        ).exists()

        data['user'] = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'is_premium': user.is_premium,
            'has_profile': has_profile,
        }

        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'password', 'phone', 'date_of_birth')
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class ProfilePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilePhoto
        fields = ('id', 'image', 'is_primary', 'order')

class ProfileSerializer(serializers.ModelSerializer):
    photos = ProfilePhotoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = (
            'id', 'display_name', 'bio', 'gender', 'looking_for', 
            'city', 'state', 'has_active_match', 'photos'
        )
        read_only_fields = ('has_active_match',)
