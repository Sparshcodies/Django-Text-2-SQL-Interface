from django.contrib import admin
from django.contrib.auth.models import User, Group
from .models import UploadedDatabase

# Register UploadedDatabase model in admin panel
@admin.register(UploadedDatabase)
class UploadedDatabaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'uploaded_at')

# Unregister default User & Group admin to customize them
admin.site.unregister(User)
admin.site.unregister(Group)

# Register Users with Custom Admin
@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_superuser')
    list_filter = ('is_staff', 'is_superuser')
    search_fields = ('username', 'email')

# Register Groups with Custom Admin
@admin.register(Group)
class CustomGroupAdmin(admin.ModelAdmin):
    list_display = ('name',)
