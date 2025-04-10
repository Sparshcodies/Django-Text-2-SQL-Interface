from django.db import models
from django.contrib.auth.models import User



class UserQuery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    database = models.ForeignKey('UploadedDatabase', on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.text[:30]}..."

class UploadedDatabase(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='databases/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
