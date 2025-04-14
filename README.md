# SQL Genie: Text-To-SQL Execution Interface 🧙‍♂️🗃️

SQL Genie is a Django-based web application that enables users to interact with databases using plain English. It integrates Google’s Gemini 2.0 Flash language model to convert natural language queries into SQL, supports real-time execution on live databases, and features a robust role-based access system.

## 🔧 Requirements

- Python 3.10+
- pip
- SQLite (default) or PostgreSQL (for production)
- Internet access (for Gemini API)

## 🚀 Installation & Setup

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/your-username/sql-genie.git
   cd sql-genie
   ```

2. **Create a Virtual Environment (Optional but Recommended)**  
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

3. **Install Dependencies**  
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply Migrations**  
   ```bash
   python manage.py migrate
   ```

5. **Create a Superuser**  
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the Development Server**  
   ```bash
   python manage.py runserver 8123
   ```

   You can use any other port by changing `8123` (e.g., `runserver 8000`).

7. **Open in Browser**  
   Visit `http://localhost:8123/` in your browser to access the app.

## 🔑 Admin Panel Features

- Upload & manage multiple databases (SQLite/PostgreSQL).
- Assign role-based permissions (read-only or read/write).
- Monitor recent queries executed by users.

## 👥 User Panel Features

- Select an assigned database.
- Type queries in natural language (e.g., "Show all students in grade A").
- View generated SQL and execution results in real time.
- Read-only users are restricted from modifying data.

## 🔒 Security

- Role-Based Access Control (RBAC)
- Superuser-only data modifications
- Gemini API key is stored securely in environment variables (`settings.py` uses `GEMINI_API_KEY`)

## 🧠 Powered By

- Django (Python)
- Gemini 2.0 Flash (Google AI)
- HTML + CSS + JS (Bootstrap, AOS)
- SQLite/PostgreSQL

---

> Developed by: Sparsh Sahu, Mahak Mirza, Eashan Tiwari  
> Under the guidance of Dr. Vasima Khan  
> SISTec, Department of CSE-AI&DS, Bhopal (M.P.), April 2025
