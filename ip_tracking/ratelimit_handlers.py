# ip_tracking/ratelimit_handlers.py


def login_handler(request, group, key, rate, method, **kwargs):
    """
    Custom rate limit handler for login attempts
    - 10 requests/minute for authenticated users
    - 5 requests/minute for anonymous users
    """
    if request.user.is_authenticated:
        return "10/m"
    return "5/m"


def geo_test_handler(request, group, key, rate, method, **kwargs):
    """
    Custom rate limit handler for geo test endpoint
    - 10 requests/minute for authenticated users
    - 5 requests/minute for anonymous users
    """
    if request.user.is_authenticated:
        return "10/m"
    return "5/m"
