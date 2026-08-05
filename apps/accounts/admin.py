from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Profile, ProfilePhoto

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Adicionais', {'fields': ('phone', 'is_verified', 'date_of_birth', 'is_premium')}),
    )
    list_display = ['email', 'username', 'is_premium', 'is_verified', 'is_staff']

class ProfilePhotoInline(admin.TabularInline):
    model = ProfilePhoto
    extra = 1
    max_num = 6

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'user', 'city', 'state', 'has_active_match']
    list_filter = ['has_active_match', 'gender', 'looking_for']
    search_fields = ['display_name', 'user__email', 'city']
    inlines = [ProfilePhotoInline]
