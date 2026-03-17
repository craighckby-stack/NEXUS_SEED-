web: gunicorn --workers=4 --bind=0.0.0.0:$$PORT your_app_module:app

*(Note: This assumes you replace the low-performance `http.server` with a production-ready WSGI server (Gunicorn) targeting a standard Python application entry point (`your_app_module:app`). Replace `your_app_module:app` with the actual path to your WSGI application instance.)*