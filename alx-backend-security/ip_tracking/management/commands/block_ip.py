# ip_tracking/management/commands/block_ip.py
import ipaddress

from django.core.management.base import BaseCommand, CommandError

from ip_tracking.models import BlockedIP


class Command(BaseCommand):
    help = "Block an IP address by adding it to the blacklist"

    def add_arguments(self, parser):
        parser.add_argument("ip_address", type=str, help="IP address to block")
        parser.add_argument("--reason", type=str, help="Reason for blocking this IP")

    def handle(self, *args, **options):
        ip_address = options["ip_address"]
        reason = options.get("reason", "No reason provided")

        try:
            # Validate IP address
            ipaddress.ip_address(ip_address)

            # Create or update blocked IP
            blocked_ip, created = BlockedIP.objects.update_or_create(
                ip_address=ip_address, defaults={"reason": reason}
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"Successfully blocked IP: {ip_address}")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"IP {ip_address} was already blocked. Updated the reason."
                    )
                )

        except ValueError:
            raise CommandError(f"Invalid IP address: {ip_address}")
        except Exception as e:
            raise CommandError(f"Error blocking IP: {str(e)}")
