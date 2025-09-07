from django.contrib import admin
from django.utils.html import format_html

from ip_tracking.models import BlockedIP, RequestLog


@admin.register(BlockedIP)
class BlockedIPAdmin(admin.ModelAdmin):
    list_display = ("ip_address", "created_at", "reason_short", "is_active")
    list_filter = ("created_at",)
    search_fields = ("ip_address", "reason")
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"
    list_per_page = 20
    actions = ["unblock_ips"]
    fieldsets = (
        ("IP Information", {"fields": ("ip_address", "is_active")}),
        (
            "Details",
            {
                "fields": ("created_at", "reason"),
                "classes": ("collapse",),
            },
        ),
    )

    def reason_short(self, obj):
        """Display a shortened version of the reason"""
        if obj.reason:
            return obj.reason[:50] + "..." if len(obj.reason) > 50 else obj.reason
        return "-"

    reason_short.short_description = "Reason"

    def is_active(self, obj):
        """Display a colored circle indicating if the block is active"""
        color = "green" if not obj.is_active else "red"
        return format_html(
            '<span style="color: {};">●</span> {}',
            color,
            "Active" if obj.is_active else "Inactive",
        )

    is_active.boolean = True
    is_active.short_description = "Status"

    def unblock_ips(self, request, queryset):
        """Action to unblock selected IPs"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Successfully unblocked {updated} IP address(es).")

    unblock_ips.short_description = "Unblock selected IPs"


@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    list_display = ("ip_address", "path", "method", "timestamp", "user_agent_short")
    list_filter = ("method", "timestamp")
    search_fields = ("ip_address", "path", "user_agent")
    readonly_fields = ("ip_address", "path", "method", "timestamp", "user_agent")
    date_hierarchy = "timestamp"
    list_per_page = 50

    def user_agent_short(self, obj):
        """Display a shortened version of the user agent"""
        if obj.user_agent:
            return (
                obj.user_agent[:50] + "..."
                if len(obj.user_agent) > 50
                else obj.user_agent
            )
        return "-"

    user_agent_short.short_description = "User Agent"

    def has_add_permission(self, request):
        """Prevent manual addition of log entries"""
        return False

    def has_change_permission(self, request, obj=None):
        """Prevent modification of log entries"""
        return False
