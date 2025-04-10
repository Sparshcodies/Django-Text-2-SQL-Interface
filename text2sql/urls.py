from django.urls import path
from . import views  # Import only your views, NOT the project-level urls.py
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('admin-login/', views.login_admin_view, name='login_admin'),
    path('admin-panel/', views.admin_panel, name='admin_panel'),
    path('login-user/', views.login_user_view, name='login_user'),
    path('register/', views.register_view, name='register'),
    path('user-panel/', views.user_panel, name='user_panel'),
    path('fetch_schema/', views.fetch_schema, name='fetch_schema'),
    path('process_query/', views.process_query, name='process_query'),
    path('execute_query/', views.execute_query, name='execute_query'),
    path('upload-database/', views.upload_database, name='upload_database'),
]
