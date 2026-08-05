from rest_framework import serializers
from .models import Like, Match
from apps.accounts.models import Profile
from apps.accounts.serializers import ProfilePhotoSerializer


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ('id', 'from_user', 'to_user', 'like_type', 'created_at')
        read_only_fields = ('from_user', 'created_at')


class PartnerProfileSerializer(serializers.ModelSerializer):
    """Perfil resumido do parceiro no match — exposto para o frontend."""
    photos = ProfilePhotoSerializer(many=True, read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Profile
        fields = ('id', 'user_id', 'display_name', 'bio', 'gender', 'city', 'state', 'photos')


class MatchSerializer(serializers.ModelSerializer):
    """
    Retorna os dados do match com o perfil do PARCEIRO.
    O campo 'partner_profile' é sempre o outro usuário (não o que fez a requisição).
    Como o serializer não tem acesso ao request diretamente, ele serializa ambos os perfis
    e o frontend decide qual usar baseado no user_id do contexto.
    """
    profile_user_1 = PartnerProfileSerializer(source='user_1.profile', read_only=True)
    profile_user_2 = PartnerProfileSerializer(source='user_2.profile', read_only=True)
    user_1_id = serializers.IntegerField(source='user_1.id', read_only=True)
    user_2_id = serializers.IntegerField(source='user_2.id', read_only=True)

    class Meta:
        model = Match
        fields = (
            'id', 'status', 'created_at',
            'user_1_id', 'user_2_id',
            'profile_user_1', 'profile_user_2',
        )
