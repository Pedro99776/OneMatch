from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import Profile, ProfilePhoto
from .serializers import UserSerializer, ProfileSerializer, ProfilePhotoSerializer

User = get_user_model()


class MeView(APIView):
    """Retorna dados do usuário logado + status do perfil."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        has_profile = Profile.objects.filter(
            user=user,
            display_name__gt='',
        ).exists()
        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'is_premium': user.is_premium,
            'has_profile': has_profile,
        })

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        # Retorna o perfil do usuário logado ou cria um vazio
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

class ProfilePhotoUploadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        profile = request.user.profile
        
        # Verifica limite de 6 fotos
        if profile.photos.count() >= 6:
            return Response(
                {"error": "Limite máximo de 6 fotos atingido."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer = ProfilePhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfilePhotoDeleteView(generics.DestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ProfilePhotoSerializer
    
    def get_queryset(self):
        return ProfilePhoto.objects.filter(profile=self.request.user.profile)


class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response({"error": "current_password and new_password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({"error": "Senha atual incorreta."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"success": "Senha alterada com sucesso."}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, *args, **kwargs):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
