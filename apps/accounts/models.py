from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class CustomUser(AbstractUser):
    """Usuário customizado com campos extras para o OneMatch"""
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    last_birth_date_change = models.DateTimeField(null=True, blank=True)
    is_premium = models.BooleanField(default=False)
    
    # Define o email como campo de login principal
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email

class Profile(models.Model):
    """Perfil público do usuário"""
    GENDER_CHOICES = [
        ('M', 'Masculino'), 
        ('F', 'Feminino'),
    ]
    LOOKING_FOR_CHOICES = [
        ('M', 'Homens'), 
        ('F', 'Mulheres'), 
        ('A', 'Todos')
    ]
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=50, blank=True, default='')
    bio = models.TextField(max_length=500, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, default='', db_index=True)
    looking_for = models.CharField(max_length=1, choices=LOOKING_FOR_CHOICES, blank=True, default='', db_index=True)
    
    # Localização (MVP com Cidade/Estado, preparado para PostGIS no futuro)
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=50, blank=True, default='')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Preferências de Descoberta
    max_distance_km = models.IntegerField(default=50)
    min_age_preference = models.IntegerField(default=18)
    max_age_preference = models.IntegerField(default=99)
    
    # Status do match (Chave do conceito)
    has_active_match = models.BooleanField(default=False, db_index=True)
    
    # === Atributos Pessoais (Vitals) ===
    height_cm = models.PositiveSmallIntegerField(null=True, blank=True)
    education = models.CharField(max_length=30, blank=True, default='')
    university = models.CharField(max_length=100, blank=True, default='')
    job_title = models.CharField(max_length=100, blank=True, default='')
    company = models.CharField(max_length=100, blank=True, default='')
    religion = models.CharField(max_length=30, blank=True, default='')
    politics = models.CharField(max_length=30, blank=True, default='')
    children = models.CharField(max_length=30, blank=True, default='')
    
    # === Filtros de Busca Avançados ===
    filter_min_height = models.PositiveSmallIntegerField(null=True, blank=True)
    filter_max_height = models.PositiveSmallIntegerField(null=True, blank=True)
    filter_education = models.JSONField(default=list, blank=True)
    filter_religion = models.JSONField(default=list, blank=True)
    filter_politics = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return f"{self.display_name} ({self.user.email})"

class ProfilePhoto(models.Model):
    """Fotos do perfil (até 6)"""
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='profiles/%Y/%m/')
    caption = models.CharField(max_length=150, blank=True, default='')
    is_primary = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        
    def __str__(self):
        return f"Foto de {self.profile.display_name}"

class ProfilePrompt(models.Model):
    """Cards de Perguntas/Respostas do perfil (estilo Hinge)"""
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='prompts')
    question = models.CharField(max_length=200)
    answer = models.TextField(max_length=500)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Prompt de {self.profile.display_name}: {self.question[:40]}"

