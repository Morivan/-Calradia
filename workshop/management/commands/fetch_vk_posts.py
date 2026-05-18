import datetime
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.timezone import make_aware
from workshop.models import VKPost

VK_API = "https://api.vk.com/method/wall.get"
VK_GROUP_ID = 238824374


class Command(BaseCommand):
    help = "Import recent posts from VK group wall into DB"

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=20)

    def handle(self, *args, **options):
        token = getattr(settings, "VK_SERVICE_TOKEN", "")
        if not token:
            self.stderr.write("VK_SERVICE_TOKEN not set in .env / settings")
            return

        resp = requests.get(VK_API, params={
            "owner_id": f"-{VK_GROUP_ID}",
            "count": options["count"],
            "access_token": token,
            "v": "5.131",
        }, timeout=10)
        data = resp.json()

        if "error" in data:
            self.stderr.write(f"VK API error: {data['error']}")
            return

        items = data.get("response", {}).get("items", [])
        created = 0
        for post in items:
            if post.get("from_id", 0) > 0:
                continue  # skip reposts from users
            photo_url = ""
            for att in post.get("attachments", []):
                if att.get("type") == "photo":
                    sizes = att["photo"].get("sizes", [])
                    if sizes:
                        best = max(sizes, key=lambda s: s.get("width", 0))
                        photo_url = best.get("url", "")
                    break
            posted_at = make_aware(datetime.datetime.fromtimestamp(post["date"]))
            _, was_created = VKPost.objects.get_or_create(
                post_id=post["id"],
                defaults={
                    "owner_id": post.get("owner_id", -VK_GROUP_ID),
                    "text": post.get("text", "")[:2000],
                    "photo_url": photo_url,
                    "posted_at": posted_at,
                },
            )
            if was_created:
                created += 1

        self.stdout.write(f"Done: {created} new posts saved, {len(items) - created} already existed.")
