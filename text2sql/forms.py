from django import forms
from .models import UploadedDatabase

class DatabaseUploadForm(forms.ModelForm):
    class Meta:
        model = UploadedDatabase
        fields = ['name', 'file']
