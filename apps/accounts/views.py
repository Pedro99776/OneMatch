from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from django.contrib.auth import get_user_model
import mimetypes
from .models import Profile, ProfilePhoto, ProfilePrompt
from .serializers import UserSerializer, ProfileSerializer, ProfilePhotoSerializer, ProfilePromptSerializer

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
            'date_of_birth': user.date_of_birth,
        })
        
    def patch(self, request):
        """Permite atualizar dados do usuário base, como data de nascimento"""
        user = request.user
        if 'date_of_birth' in request.data:
            user.date_of_birth = request.data['date_of_birth']
            user.save()
            return Response({'status': 'updated'})
        return Response({'status': 'no fields updated'}, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        # Retorna o perfil do usuário logado ou cria um vazio
        profile, created = Profile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'max_distance_km': 50,
                'min_age_preference': 18,
                'max_age_preference': 99
            }
        )
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
            
        # Validação de tamanho e tipo do arquivo
        photo = request.FILES.get('photo')
        if photo:
            if photo.size > 5 * 1024 * 1024:
                return Response({"error": "A imagem não pode ultrapassar 5MB."}, status=status.HTTP_400_BAD_REQUEST)
                
            mime_type, _ = mimetypes.guess_type(photo.name)
            allowed_types = ['image/jpeg', 'image/png', 'image/webp']
            if not mime_type or mime_type not in allowed_types:
                return Response({"error": "Apenas imagens JPG, PNG ou WEBP são permitidas."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = ProfilePhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfilePhotoUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ProfilePhotoSerializer
    
    def get_queryset(self):
        return ProfilePhoto.objects.filter(profile=self.request.user.profile)


class ProfilePromptListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ProfilePromptSerializer
    
    def get_queryset(self):
        return ProfilePrompt.objects.filter(profile=self.request.user.profile)
        
    def perform_create(self, serializer):
        profile = self.request.user.profile
        if profile.prompts.count() >= 3:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Limite de 3 prompts atingido.")
        serializer.save(profile=profile)


class ProfilePromptDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ProfilePromptSerializer
    
    def get_queryset(self):
        return ProfilePrompt.objects.filter(profile=self.request.user.profile)


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
