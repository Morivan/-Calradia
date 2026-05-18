from django.urls import path

from .views import AuthView, BootstrapView, ClientWebhookView, ClientWithOrderWebhookView, ColleagueWebhookView, LogoutView, MaterialWebhookView, MeView, NewsPostCreateView, NewsPostDeleteView, OrderWebhookView, ProductDetailView, ProductListCreateView, ReviewCreateView, TelegramWebhookView, VkCallbackView, VKPostsView

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
    path("webhook/client/", ClientWebhookView.as_view(), name="webhook-client"),
    path("webhook/client-order/", ClientWithOrderWebhookView.as_view(), name="webhook-client-order"),
    path("webhook/order/", OrderWebhookView.as_view(), name="webhook-order"),
    path("webhook/material/", MaterialWebhookView.as_view(), name="webhook-material"),
    path("webhook/colleague/", ColleagueWebhookView.as_view(), name="webhook-colleague"),
    path("vk-posts/", VKPostsView.as_view(), name="vk-posts"),
    path("news/", NewsPostCreateView.as_view(), name="news-create"),
    path("news/<int:post_id>/", NewsPostDeleteView.as_view(), name="news-delete"),
]
