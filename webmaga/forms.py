"""
Formularios para el sistema MAGA
"""
from django import forms
from django.contrib.auth import authenticate
from .models import (
    TipoActividad, Comunidad, Usuario, 
    Beneficiario, TipoBeneficiario
)


class LoginForm(forms.Form):
    """
    Formulario de login que valida contra la tabla usuarios
    """
    username = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Usuario o Email',
            'id': 'username',
            'autocomplete': 'username'
        }),
        label='Usuario o Email'
    )
    
    password = forms.CharField(
        required=True,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Contraseña',
            'id': 'password',
            'autocomplete': 'current-password'
        }),
        label='Contraseña'
    )
    
    remember_me = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input',
            'id': 'remember-me'
        }),
        label='Recordar usuario'
    )
    
    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)
    
    def clean(self):
        """
        Valida las credenciales del usuario
        """
        cleaned_data = super().clean()
        username = cleaned_data.get('username')
        password = cleaned_data.get('password')
        
        if username and password:
            # Intentar autenticar con el backend personalizado
            self.user_cache = authenticate(
                request=self.request,
                username=username,
                password=password
            )
            
            if self.user_cache is None:
                raise forms.ValidationError(
                    "Usuario o contraseña incorrectos."
                )
            
            if not self.user_cache.is_active:
                raise forms.ValidationError(
                    "Esta cuenta está inactiva. Contacta al administrador."
                )
        
        return cleaned_data
    
    def get_user(self):
        """
        Retorna el usuario autenticado
        """
        return getattr(self, 'user_cache', None)


class RecuperarPasswordForm(forms.Form):
    """
    Formulario para recuperación de contraseña
    """
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingresa tu email',
            'id': 'email',
            'autocomplete': 'email'
        }),
        label='Email'
    )
    
    def clean_email(self):
        """
        Valida que el email exista en la base de datos
        """
        email = self.cleaned_data.get('email')
        
        from .models import Usuario
        if not Usuario.objects.filter(email=email, activo=True).exists():
            raise forms.ValidationError(
                "No se encontró ninguna cuenta con este email."
            )
        
        return email


class ActividadForm(forms.Form):
    """
    Formulario para crear/editar actividades/eventos
    """
    nombre = forms.CharField(
        max_length=200,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-input',
            'placeholder': 'Ingrese el nombre del evento'
        }),
        label='Nombre del Evento'
    )
    
    tipo_actividad_id = forms.ChoiceField(
        required=True,
        widget=forms.Select(attrs={
            'class': 'form-select'
        }),
        label='Tipo de Evento'
    )
    
    comunidad_id = forms.ChoiceField(
        required=True,
        widget=forms.Select(attrs={
            'class': 'form-select'
        }),
        label='Comunidad'
    )
    
    fecha = forms.DateField(
        required=True,
        widget=forms.DateInput(attrs={
            'class': 'form-input',
            'type': 'date'
        }),
        label='Fecha del Evento'
    )
    
    descripcion = forms.CharField(
        required=True,
        widget=forms.Textarea(attrs={
            'class': 'form-textarea',
            'rows': '5',
            'placeholder': 'Describa los detalles del evento...'
        }),
        label='Descripción'
    )
    
    estado = forms.ChoiceField(
        required=True,
        choices=[
            ('planificado', 'Planificado'),
            ('en_progreso', 'En Progreso'),
            ('completado', 'Completado'),
        ],
        initial='planificado',
        widget=forms.Select(attrs={
            'class': 'form-select'
        }),
        label='Estado'
    )
    
    latitud = forms.DecimalField(
        required=False,
        max_digits=10,
        decimal_places=8,
        widget=forms.NumberInput(attrs={
            'class': 'form-input',
            'placeholder': 'Ej: 15.1234567',
            'step': '0.00000001'
        }),
        label='Latitud (Opcional)'
    )
    
    longitud = forms.DecimalField(
        required=False,
        max_digits=11,
        decimal_places=8,
        widget=forms.NumberInput(attrs={
            'class': 'form-input',
            'placeholder': 'Ej: -90.1234567',
            'step': '0.00000001'
        }),
        label='Longitud (Opcional)'
    )
    
    # Campos de relación (se manejarán aparte)
    personal_ids = forms.CharField(
        required=False,
        widget=forms.HiddenInput(),
        label='Personal Asignado'
    )
    
    beneficiarios_ids = forms.CharField(
        required=False,
        widget=forms.HiddenInput(),
        label='Beneficiarios'
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Cargar opciones de tipo de actividad
        self.fields['tipo_actividad_id'].choices = [('', 'Seleccione un tipo')] + [
            (str(tipo.id), tipo.nombre) 
            for tipo in TipoActividad.objects.filter(activo=True)
        ]
        
        # Cargar opciones de comunidades
        self.fields['comunidad_id'].choices = [('', 'Seleccione una comunidad')] + [
            (str(com.id), f"{com.nombre} ({com.region.nombre if com.region else 'Sin región'})") 
            for com in Comunidad.objects.filter(activo=True).select_related('region')
        ]

