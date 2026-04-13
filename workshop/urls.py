from django.urls import path

from .views import BootstrapView, ClientReplyView, FinanceGoogleSheetsSyncView, MarketingPublicationPublishView, OrderCreateView, ReviewCreateView, TelegramWebhookView

urlpatterns = [
    path("bootstrap/", BootstrapView.as_view(), name="bootstrap"),
    path("catalog/products/<int:product_id>/reviews/", ReviewCreateView.as_view(), name="product-review-create"),
    path("finance/sync-google-sheets/", FinanceGoogleSheetsSyncView.as_view(), name="finance-sync-google-sheets"),
    path("crm/clients/<int:client_id>/reply/", ClientReplyView.as_view(), name="crm-client-reply"),
    path("crm/orders/", OrderCreateView.as_view(), name="crm-order-create"),
    path("marketing/publications/<int:publication_id>/publish/", MarketingPublicationPublishView.as_view(), name="marketing-publication-publish"),
    path("integrations/telegram/webhook/", TelegramWebhookView.as_view(), name="telegram-webhook"),
]
