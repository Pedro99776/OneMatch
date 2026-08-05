from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .serializers import CustomTokenObtainPairSerializer
from .views import RegisterView, ProfileView, ProfilePhotoUploadView, ProfilePhotoDeleteView, MeView


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


urlpatterns = [
    # Autenticação (JWT)
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Usuário logado
    path('me/', MeView.as_view(), name='auth_me'),
    
    # Perfil
    path('profile/me/', ProfileView.as_view(), name='profile_me'),
    path('profile/photos/', ProfilePhotoUploadView.as_view(), name='profile_photos'),
    path('profile/photos/<int:pk>/', ProfilePhotoDeleteView.as_view(), name='profile_photo_delete'),
]
