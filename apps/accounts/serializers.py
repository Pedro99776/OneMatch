from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Profile, ProfilePhoto, ProfilePrompt

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Retorna dados do usuário e status do perfil junto com os tokens JWT."""

    def validate(self, attrs):
        from rest_framework_simplejwt.exceptions import AuthenticationFailed
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            email = attrs.get(User.USERNAME_FIELD)
            user_exists = User.objects.filter(**{User.USERNAME_FIELD: email}).exists() if email else False
            if user_exists:
                raise AuthenticationFailed("Senha incorreta")
            else:
                raise AuthenticationFailed("Usuário inválido")
                
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
            'last_birth_date_change': user.last_birth_date_change,
        }

        return data

class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'password', 'phone', 'date_of_birth', 'last_birth_date_change')
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        import uuid
        if 'username' not in validated_data or not validated_data['username']:
            email = validated_data.get('email', '')
            base_username = email.split('@')[0] if email else 'user'
            validated_data['username'] = f"{base_username}_{uuid.uuid4().hex[:8]}"
        user = User.objects.create_user(**validated_data)
        return user

class ProfilePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilePhoto
        fields = ('id', 'image', 'is_primary', 'order', 'caption')

class ProfilePromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilePrompt
        fields = ('id', 'question', 'answer', 'order')

class ProfileSerializer(serializers.ModelSerializer):
    photos = ProfilePhotoSerializer(many=True, read_only=True)
    prompts = ProfilePromptSerializer(many=True, read_only=True)
    # user_id é exposto para que o frontend saiba qual ID enviar no like
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = Profile
        fields = (
            'id', 'user_id', 'display_name', 'bio', 'gender', 'looking_for', 
            'city', 'state', 'latitude', 'longitude', 'has_active_match', 'photos', 'prompts',
            'max_distance_km', 'min_age_preference', 'max_age_preference',
            'height_cm', 'education', 'university', 'job_title', 'company',
            'religion', 'politics', 'children',
            'filter_min_height', 'filter_max_height', 'filter_education',
            'filter_religion', 'filter_politics'
        )
        read_only_fields = ('has_active_match', 'user_id')
