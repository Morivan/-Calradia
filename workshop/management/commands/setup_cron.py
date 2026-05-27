"""
python manage.py setup_cron          — install daily 09:00 reminder job
python manage.py setup_cron --remove — uninstall the job
"""
import os
import sys
from pathlib import Path

from django.core.management.base import BaseCommand

CRON_FILE = Path("/etc/cron.d/calradia-reminders")
JOB_COMMENT = "# Calradia — daily deadline reminders (notify_urgent_orders)"
SCHEDULE = "0 9 * * *"


class Command(BaseCommand):
    help = "Install (or remove) the daily deadline-reminder cron job in /etc/cron.d/"

    def add_arguments(self, parser):
        parser.add_argument(
            "--remove",
            action="store_true",
            help="Remove the cron job instead of adding it",
        )

    def handle(self, *args, **options):
        if options["remove"]:
            if CRON_FILE.exists():
                CRON_FILE.unlink()
                self.stdout.write(f"Removed {CRON_FILE}")
            else:
                self.stdout.write("Cron file not found, nothing to remove.")
            return

        manage_py = Path(sys.argv[0]).resolve()
        python = Path(sys.executable).resolve()
        run_user = os.getenv("CRON_RUN_USER", "www-data")
        log = Path(manage_py).parent / "logs" / "cron_reminders.log"

        content = (
            f"{JOB_COMMENT}\n"
            f"SHELL=/bin/bash\n"
            f"PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin\n\n"
            f"{SCHEDULE}  {run_user}  "
            f"{python} {manage_py} notify_urgent_orders >> {log} 2>&1\n"
        )

        try:
            CRON_FILE.write_text(content)
            # /etc/cron.d/ files must not be world-writable
            CRON_FILE.chmod(0o644)
            self.stdout.write(
                self.style.SUCCESS(f"Cron job written to {CRON_FILE}")
            )
            self.stdout.write(f"Schedule : {SCHEDULE}  (daily at 09:00)")
            self.stdout.write(f"Run as   : {run_user}  (override with CRON_RUN_USER env var)")
            self.stdout.write(f"Log      : {log}")
            self.stdout.write("To remove: python manage.py setup_cron --remove")
        except PermissionError:
            self.stderr.write(
                self.style.ERROR(
                    f"Permission denied writing to {CRON_FILE}. "
                    "Run as root or with sudo."
                )
            )
            raise SystemExit(1)
