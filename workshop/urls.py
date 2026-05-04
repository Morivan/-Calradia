from django.urls import path

from .views import AuthView, BootstrapView, LogoutView, MeView, ProductDetailView, ProductListCreateView, ReviewCreateView, TelegramWebhookView, VkCallbackView

urlpatterns = [
    path("bootstrap/", BootstrapView.as_view(), name="bootstrap"),
    path("catalog/products/", ProductListCreateView.as_view(), name="product-list-create"),
    path("catalog/products/<int:product_id>/", ProductDetailView.as_view(), name="product-detail"),
    path("catalog/products/<int:product_id>/reviews/", ReviewCreateView.as_view(), name="product-review-create"),
    path("auth/login/", AuthView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("integrations/telegram/webhook/", TelegramWebhookView.as_view(), name="telegram-webhook"),
    path("integrations/vk/callback/", VkCallbackView.as_view(), name="vk-callback"),
]
