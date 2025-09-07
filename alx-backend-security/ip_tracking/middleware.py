# ip_tracking/middleware.py
from django.http import HttpResponseForbidden

from ip_tracking.models import BlockedIP, RequestLog


class IPLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if IP is blocked
        ip_address = self.get_client_ip(request)

        if BlockedIP.objects.filter(ip_address=ip_address).exists():
            return HttpResponseForbidden(
                "Access Denied: Your IP address has been blocked."
            )

        # Process request
        response = self.get_response(request)

        # Get geolocation data
        geo_data = {}
        if not ip_address.startswith(
            ("127.", "10.", "192.168.", "172.")
        ):  # Skip private IPs
            geo_data = RequestLog.get_geolocation_data(ip_address)

        # Log request details after response is processed
        ip_address = self.get_client_ip(request)

        # Log the request
        RequestLog.objects.create(
            ip_address=ip_address,
            path=request.path,
            method=request.method,
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            country=geo_data.get("country"),
            city=geo_data.get("city"),
            latitude=geo_data.get("latitude"),
            longitude=geo_data.get("longitude"),
        )

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip
