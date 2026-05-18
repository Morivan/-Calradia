import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_env_file(BASE_DIR / ".env")

# ── Core ──────────────────────────────────────────────────────────────────────

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"] if "DJANGO_SECRET_KEY" in os.environ else (
    "django-insecure-u9xy3zwhg0=57$!y%4s*v01@me!!$ck+(8_h!de)#dj_nb#(-i"
)

DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"

_default_hosts = "127.0.0.1,localhost" if DEBUG else ""
ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", _default_hosts).split(",") if h.strip()]
if DEBUG and "testserver" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append("testserver")

# ── Apps ──────────────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "workshop",
]

# ── Middleware ─────────────────────────────────────────────────────────────────

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# ── Database ──────────────────────────────────────────────────────────────────

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ── Auth ──────────────────────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── i18n ──────────────────────────────────────────────────────────────────────

LANGUAGE_CODE = "ru-ru"
TIME_ZONE = "Europe/Moscow"
USE_I18N = True
USE_TZ = True

# ── Static files ──────────────────────────────────────────────────────────────

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Include built frontend when dist/ exists (after `npm run build`)
STATICFILES_DIRS = [BASE_DIR / "dist"] if (BASE_DIR / "dist").exists() else []

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# ── CORS ──────────────────────────────────────────────────────────────────────

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        o.strip()
        for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
        if o.strip()
    ]

# ── CSRF ──────────────────────────────────────────────────────────────────────

CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if o.strip()
]
if DEBUG:
    CSRF_TRUSTED_ORIGINS += ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"]

# ── Security (production only) ────────────────────────────────────────────────

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    # Включить, если Django напрямую принимает HTTPS (без nginx-прокси).
    # За nginx-прокси оставить false — редирект делает сам прокси.
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "false").lower() == "true"

# ── DRF ───────────────────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
}

# ── Integrations ──────────────────────────────────────────────────────────────

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_MANAGER_CHAT_ID = os.getenv("TELEGRAM_MANAGER_CHAT_ID", "")
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "")
TELEGRAM_PUBLIC_URL = os.getenv("TELEGRAM_PUBLIC_URL", "https://web.telegram.org/k/#@kalradiaWarBand")

VK_COMMUNITY_URL = os.getenv("VK_COMMUNITY_URL", "https://vk.com/calradia_band")
VK_MESSAGES_URL = os.getenv(
    "VK_MESSAGES_URL",
    "https://vk.com/im/convo/-234061306?entrypoint=community_page&tab=all",
)
VK_CALLBACK_SECRET = os.getenv("VK_CALLBACK_SECRET", "")
VK_CONFIRMATION_TOKEN = os.getenv("VK_CONFIRMATION_TOKEN", "")
VK_SERVICE_TOKEN = os.getenv("VK_SERVICE_TOKEN", "")

WEBHOOK_TOKEN = os.getenv("WEBHOOK_TOKEN", "")

YANDEX_DISK_TOKEN = os.getenv("YANDEX_DISK_TOKEN", "")
YANDEX_ORDERS_TABLE_PATH = os.getenv("YANDEX_ORDERS_TABLE_PATH", "")
YANDEX_CLIENTS_TABLE_PATH = os.getenv("YANDEX_CLIENTS_TABLE_PATH", "")
YANDEX_MATERIALS_TABLE_PATH = os.getenv("YANDEX_MATERIALS_TABLE_PATH", "")
YANDEX_COLLEAGUES_TABLE_PATH = os.getenv("YANDEX_COLLEAGUES_TABLE_PATH", "")

# ── Logging ───────────────────────────────────────────────────────────────────

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "workshop": {
            "handlers": ["console"],
            "level": "INFO" if DEBUG else "WARNING",
            "propagate": False,
        },
    },
}

# ── Misc ──────────────────────────────────────────────────────────────────────

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
