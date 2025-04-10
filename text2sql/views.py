import sqlite3
import os
import logging
import re
# import types
import pandas as pd
from django.shortcuts import render, redirect
from django.http import JsonResponse
from sqlalchemy import create_engine, text
from google import genai
from django.conf import settings
from django.contrib.auth.decorators import login_required, user_passes_test
from .models import UploadedDatabase, UserQuery
from .forms import DatabaseUploadForm
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.views import LogoutView

logger = logging.getLogger(__name__)

# Configure Gemini API

client = genai.Client(api_key=settings.GEMINI_API_KEY)
# configure(api_key=settings.GEMINI_API_KEY)
# gemini_model = GenerativeModel('gemini-pro')

def home(request):
    return render(request, 'home.html')

def is_admin(user):
    """Check if the user is a superuser"""
    return user.is_superuser

def login_admin_view(request):
    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if user.is_superuser:
                login(request, user)
                messages.success(request, "Admin login successful!")
                return redirect('admin_panel')  # ✅ redirect to admin panel
            else:
                messages.error(request, "You are not an admin.")
        else:
            messages.error(request, "Invalid username or password.")
            
    return render(request, 'login_admin.html')

def login_user_view(request):
    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if user is not None and not user.is_superuser:
            login(request, user)
            return redirect('user_panel')  # replace with your user dashboard URL name
        else:
            messages.error(request, "Invalid credentials or not a user account.")

    return render(request, 'login_user.html')

def register_view(request):
    if request.method == "POST":
        username = request.POST['username']
        email = request.POST['email']
        password1 = request.POST['password1']
        password2 = request.POST['password2']

        if password1 != password2:
            messages.error(request, "Passwords do not match.")
        elif User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
        elif User.objects.filter(email=email).exists():
            messages.error(request, "Email already in use.")
        else:
            user = User.objects.create_user(username=username, email=email, password=password1)
            messages.success(request, "Registration successful! You can now log in.")
            return redirect('login_user')

    return render(request, 'registration.html')

@login_required
@user_passes_test(lambda u: u.is_superuser)
def admin_panel(request):
    databases = UploadedDatabase.objects.all().order_by('-uploaded_at')
    recent_queries = UserQuery.objects.select_related('user').order_by('-timestamp')[:5]
    result = None
    query = ""
    selected_db = None

    if request.method == 'POST':
        db_id = request.POST.get('database')
        query = request.POST.get('query')
        selected_db = UploadedDatabase.objects.get(id=db_id)

        db_path = selected_db.file.path
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()

            cursor.execute(query)
            if query.strip().lower().startswith("select"):
                rows = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                result = {
                    'columns': columns,
                    'rows': rows
                }
            else:
                conn.commit()
                messages.success(request, "Query executed successfully.")
                result = {
                    'columns': ['Status'],
                    'rows': [["Query executed successfully."]]
                }

            # Optional: Save the query to UserQuery table for tracking (as admin query)
            if request.user.is_authenticated:
                UserQuery.objects.create(user=request.user, text=query)

        except Exception as e:
            messages.error(request, f"Error executing query: {e}")
        finally:
            conn.close()

    return render(request, 'admin_panel.html', {
        'databases': databases,
        'recent_queries': recent_queries,
        'result': result,
        'query': query,
        'selected_db': selected_db
    })

@login_required
def user_panel(request):
    """Displays the user interface for selecting a database and entering queries"""
    databases = UploadedDatabase.objects.all()
    return render(request, 'user_panel.html', {'databases': databases})

@login_required
@user_passes_test(is_admin)

def upload_database(request):
    if request.method == 'POST':
        uploaded_file = request.FILES.get('database_file')
        if uploaded_file:
            UploadedDatabase.objects.create(
                name=uploaded_file.name,
                file=uploaded_file,
                uploaded_by=request.user
            )
            messages.success(request, 'Database uploaded successfully!')
        else:
            messages.error(request, 'No file selected.')

        return redirect('admin_panel')  # Change to match your url name

    return redirect('admin_panel')
def get_schema(database_path):
    """Extracts schema information from an SQLite database using SQLAlchemy"""
    engine = create_engine(f'sqlite:///{database_path}')
    with engine.connect() as conn:
        tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';")).fetchall()
    
    schema = {}
    for table in tables:
        table_name = table[0]
        with engine.connect() as conn:
            columns = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
        schema[table_name] = [col[1] for col in columns]

    return schema

@login_required
def fetch_schema(request):
    """Fetch schema & table preview"""
    database_id = request.GET.get('database_id')
    db_obj = UploadedDatabase.objects.get(id=database_id)
    schema = get_schema(db_obj.file.path)

    engine = create_engine(f'sqlite:///{db_obj.file.path}')
    table_previews = {}
    for table in schema.keys():
        with engine.connect() as conn:
            preview = pd.read_sql(f"SELECT * FROM {table} LIMIT 5", conn)
        table_previews[table] = preview.to_html(classes="table table-striped", index=False)

    return JsonResponse({'schema': schema, 'table_previews': table_previews})

@login_required
def process_query(request):
    """Processes natural language queries into SQL using Gemini API"""
    if request.method == 'POST':
        database_id = request.POST.get('database_id')
        user_query = request.POST.get('user_query')
        
        if not database_id or not user_query:
            return JsonResponse({'error': 'Missing database ID or query'}, status=400)

        try:
            db_obj = UploadedDatabase.objects.get(id=database_id)
        except UploadedDatabase.DoesNotExist:
            return JsonResponse({'error': 'Database not found'}, status=404)
        db_path = db_obj.file.path
        schema = get_schema(db_path)

        # Generate schema text for LLM prompt
        schema_text = "Database Schema:\n"
        for table, columns in schema.items():
            schema_text += f"\nTable: {table}\n"
            for col in columns:
                schema_text += f"- {col}\n"

        # System prompt ensuring safe and correct SQL generation
        system_prompt = (
            "You are a precise SQL query generator that converts natural language to SQL.\n"
            "Follow these rules strictly:\n"
            "1. Use exact column names from the schema.\n"
            "2. Include JOIN conditions only when the query requires data from more than one table and only if it's necessary.\n"
            "3. Use optimised SQL query for performance.\n"
            "4. Add appropriate WHERE clauses for filtering.\n"
            "5. Use appropriate aggregation functions when necessary.\n"
            "6. Always alias complex columns for readability.\n"
            "7. Return ONLY the SQL query without any explanation or markdown."
        )

        # Construct final prompt
        prompt = (
            f"{system_prompt}\n"
            f"Generate a SQL query for: \"{user_query}\"\n"
            f"Using this schema:\n{schema_text}\n"
            "Return ONLY the SQL query without any explanations or markdown."
        )

        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                
            )
            sql_query = response.text.strip()

            # Remove markdown formatting if present
            if "```sql" in sql_query:
                match = re.search(r"```sql\n(.*?)\n```", sql_query, re.DOTALL)
                if match:
                    sql_query = match.group(1).strip()

            return JsonResponse({'sql_query': sql_query})
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return JsonResponse({'error': f"Error processing query: {str(e)}"}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
def execute_query(request):
    """Executes an SQL query using SQLAlchemy"""
    if request.method == 'POST':
        database_id = request.POST.get('database_id')
        sql_query = request.POST.get('sql_query')
        
        if not database_id or not sql_query:
            return JsonResponse({'error': 'Missing database ID or SQL query'}, status=400)

        try:
            db_obj = UploadedDatabase.objects.get(id=database_id)
        except UploadedDatabase.DoesNotExist:
            return JsonResponse({'error': 'Database not found'}, status=404)

        db_path = db_obj.file.path
        engine = create_engine(f'sqlite:///{db_path}')

        try:
            with engine.connect() as conn:
                if sql_query.strip().upper().startswith("SELECT"):
                    result = pd.read_sql(sql_query, conn)
                    return JsonResponse({'results': result.to_html(classes="table table-bordered", index=False)})
                else:
                    if request.user.is_superuser:
                        with conn.begin():
                            conn.execute(text(sql_query))
                        return JsonResponse({'message': 'Query executed successfully!'})
                    else:
                        return JsonResponse({'error': 'Permission denied! Only admins can modify the database.'}, status=403)
        except Exception as e:
            return JsonResponse({'error': f"SQL execution error: {str(e)}"}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)

class LogoutViaGet(LogoutView):
    def get(self, request, *args, **kwargs):
        return self.post(request, *args, **kwargs)
