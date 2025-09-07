# ip_tracking/tasks.py
from datetime import timedelta

from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.db.models import Count
from django.utils import timezone

from ip_tracking.models import RequestLog, SuspiciousIP

logger = get_task_logger(__name__)


@shared_task(name="detect_suspicious_activity")
def detect_suspicious_activity():
    """
    Celery task to detect and log suspicious IP activity.
    Runs hourly to check for anomalies.
    """
    try:
        # Get the threshold from settings or use default (100 requests/hour)
        request_threshold = getattr(settings, "SUSPICIOUS_REQUEST_THRESHOLD", 100)
        sensitive_paths = getattr(settings, "SENSITIVE_PATHS", ["/admin/", "/login/"])

        # Calculate time window (last hour)
        one_hour_ago = timezone.now() - timedelta(hours=1)

        # Detect high volume requests
        high_volume_ips = (
            RequestLog.objects.filter(timestamp__gte=one_hour_ago)
            .values("ip_address")
            .annotate(request_count=Count("id"))
            .filter(request_count__gt=request_threshold)
            .values_list("ip_address", flat=True)
        )

        # Log high volume IPs
        for ip in high_volume_ips:
            SuspiciousIP.objects.update_or_create(
                ip_address=ip,
                defaults={
                    "reason": "high_volume",
                    "details": {
                        "request_count": RequestLog.objects.filter(
                            ip_address=ip, timestamp__gte=one_hour_ago
                        ).count(),
                        "threshold": request_threshold,
                        "detected_at": timezone.now().isoformat(),
                    },
                    "is_active": True,
                },
            )

        # Detect access to sensitive paths
        suspicious_path_ips = (
            RequestLog.objects.filter(
                timestamp__gte=one_hour_ago, path__in=sensitive_paths
            )
            .values_list("ip_address", flat=True)
            .distinct()
        )

        # Log suspicious path access
        for ip in suspicious_path_ips:
            paths_accessed = list(
                RequestLog.objects.filter(
                    ip_address=ip, timestamp__gte=one_hour_ago, path__in=sensitive_paths
                )
                .values_list("path", flat=True)
                .distinct()
            )

            SuspiciousIP.objects.update_or_create(
                ip_address=ip,
                defaults={
                    "reason": "sensitive_path",
                    "details": {
                        "paths_accessed": paths_accessed,
                        "detected_at": timezone.now().isoformat(),
                    },
                    "is_active": True,
                },
            )

        # Get count of active suspicious IPs
        suspicious_count = SuspiciousIP.objects.filter(is_active=True).count()
        logger.info(f"Detected {suspicious_count} suspicious IPs")
        return suspicious_count

    except Exception as e:
        logger.error(f"Error in detect_suspicious_activity: {str(e)}", exc_info=True)
        raise
