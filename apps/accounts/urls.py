from django.urls import path
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .serializers import CustomTokenObtainPairSerializer
from .views import (
    RegisterView, ProfileView, ProfilePhotoUploadView, ProfilePhotoUpdateDeleteView, MeView,
    ChangePasswordView, DeleteAccountView, ProfilePromptListCreateView, ProfilePromptDetailView
)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'


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
    path('profile/photos/<int:pk>/', ProfilePhotoUpdateDeleteView.as_view(), name='profile_photo_update_delete'),
    
    # Prompts
    path('profile/prompts/', ProfilePromptListCreateView.as_view(), name='profile_prompts'),
    path('profile/prompts/<int:pk>/', ProfilePromptDetailView.as_view(), name='profile_prompt_detail'),
    
    # Segurança
    path('profile/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('profile/delete-account/', DeleteAccountView.as_view(), name='delete_account'),
]
