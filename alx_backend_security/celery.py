# alx_backend_security/celery.py

from __future__ import absolute_import, unicode_literals

import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "alx_backend_security.settings")

app = Celery("alx_backend_security")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Add periodic tasks
app.conf.beat_schedule = {
    "detect-suspicious-activity-hourly": {
        "task": "ip_tracking.tasks.detect_suspicious_activity",
        "schedule": 3600.0,  # Every hour
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
