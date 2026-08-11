@echo off

cd /d D:\PPC\carton-activity-main\carton-activity-main\backend

call ..\venv\Scripts\activate.bat

waitress-serve --host=127.0.0.1 --port=8000 backend.wsgi:application