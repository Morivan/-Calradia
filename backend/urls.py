from django.contrib import admin
from django.conf import settings
from django.http import FileResponse, HttpResponse, JsonResponse
from django.urls import include, path, re_path
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({"ok": True})


def spa_view(request):
    index = settings.BASE_DIR / "dist" / "index.html"
    if index.exists():
        return FileResponse(open(index, "rb"), content_type="text/html")
    return HttpResponse(
        "<p>Фронтенд не собран. Выполните <code>npm run build</code>.</p>",
        status=503,
        content_type="text/html",
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/csrf/", csrf_view, name="csrf"),
    path("api/", include("workshop.urls")),
    # SPA catch-all: все маршруты кроме /api/ и /static/ отдают index.html
    re_path(r"^(?!api/|static/|admin/).*$", spa_view, name="spa"),
]
