from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Rotas de API
    path('api/auth/', include('apps.accounts.urls')),
    path('api/matching/', include('apps.matching.urls')),
    path('api/discover/', include('apps.discovery.urls')),
    # path('api/chat/', include('apps.chat.urls')),
]
