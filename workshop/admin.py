from django.contrib import admin
from django.utils.html import format_html

from .models import Client, Colleague, IntegrationLink, Material, Order, Product, Review, VKPost


# ── helpers ────────────────────────────────────────────────────────────────────

ORDER_STATUS_COLORS = {
    "Новый":    ("#1a6fc4", "#dbeafe"),
    "В работе": ("#854d0e", "#fef9c3"),
    "Выполнен": ("#166534", "#dcfce7"),
    "Отменён":  ("#991b1b", "#fee2e2"),
}

CLIENT_STATUS_COLORS = {
    "Потенциальный": ("#374151", "#f3f4f6"),
    "Действующий":   ("#1a6fc4", "#dbeafe"),
    "Завершён":      ("#166534", "#dcfce7"),
}


def _badge(text, colors):
    fg, bg = colors.get(text, ("#374151", "#f3f4f6"))
    return format_html(
        '<span style="background:{};color:{};padding:2px 10px;border-radius:12px;'
        'font-size:12px;font-weight:600;white-space:nowrap">{}</span>',
        bg, fg, text,
    )


# ── Product ────────────────────────────────────────────────────────────────────

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "era", "material", "status", "price_from", "created_by", "updated_by")
    search_fields = ("name", "subtitle", "category", "material")
    list_filter = ("status", "category", "material", "era")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")


# ── Review ─────────────────────────────────────────────────────────────────────

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "author", "rating", "review_date")
    search_fields = ("author", "text", "product__name")


# ── IntegrationLink ────────────────────────────────────────────────────────────

@admin.register(IntegrationLink)
class IntegrationLinkAdmin(admin.ModelAdmin):
    list_display = ("key", "label", "url")


# ── VKPost ─────────────────────────────────────────────────────────────────────

@admin.register(VKPost)
class VKPostAdmin(admin.ModelAdmin):
    list_display = ("post_id", "short_text", "posted_at", "photo_url")
    readonly_fields = ("post_id", "owner_id", "posted_at", "created_at")
    search_fields = ("text",)
    ordering = ("-posted_at",)

    @admin.display(description="Текст")
    def short_text(self, obj):
        return (obj.text[:80] + "…") if len(obj.text) > 80 else obj.text


# ── Client ─────────────────────────────────────────────────────────────────────

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "vk_link", "status_badge", "order_count", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "notes", "vk_url")
    readonly_fields = ("created_at", "updated_at")

    class OrderInline(admin.TabularInline):
        model = Order
        extra = 0
        fields = ("product_name", "status", "total", "advance", "deadline", "assigned_to")
        readonly_fields = ("product_name",)
        show_change_link = True

        def has_add_permission(self, request, obj=None):
            return True

    inlines = [OrderInline]

    @admin.display(description="Статус")
    def status_badge(self, obj):
        return _badge(obj.status, CLIENT_STATUS_COLORS)

    @admin.display(description="ВКонтакте")
    def vk_link(self, obj):
        if obj.vk_url:
            return format_html('<a href="{}" target="_blank">{}</a>', obj.vk_url, obj.vk_url)
        return "—"

    @admin.display(description="Заказов")
    def order_count(self, obj):
        return obj.orders.count()


# ── Order ──────────────────────────────────────────────────────────────────────

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "client_name", "product_name", "status_badge",
        "total_fmt", "advance_fmt", "balance_fmt",
        "deadline", "assigned_to", "created_at",
    )
    list_filter = ("status", "assigned_to", "deadline")
    search_fields = ("client_name", "product_name", "notes", "configuration")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "deadline"
    raw_id_fields = ("client", "product")
    autocomplete_fields = []

    fieldsets = (
        ("Клиент и изделие", {
            "fields": ("client", "client_name", "product", "product_name", "configuration"),
        }),
        ("Статус и сроки", {
            "fields": ("status", "deadline", "assigned_to"),
        }),
        ("Финансы", {
            "fields": ("total", "advance"),
        }),
        ("Примечания", {
            "fields": ("notes",),
        }),
        ("Служебное", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        # Все пользователи видят все заказы
        return super().get_queryset(request)

    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True  # доступ к списку есть у всех
        if request.user.is_superuser:
            return True
        return obj.assigned_to == request.user

    def has_delete_permission(self, request, obj=None):
        if obj is None:
            return False
        if request.user.is_superuser:
            return True
        return obj.assigned_to == request.user

    def save_model(self, request, obj, form, change):
        if not change and not obj.assigned_to:
            obj.assigned_to = request.user
        super().save_model(request, obj, form, change)

    @admin.display(description="Статус")
    def status_badge(self, obj):
        return _badge(obj.status, ORDER_STATUS_COLORS)

    @admin.display(description="Сумма")
    def total_fmt(self, obj):
        return f"{obj.total:,} ₽".replace(",", " ") if obj.total else "—"

    @admin.display(description="Аванс")
    def advance_fmt(self, obj):
        return f"{obj.advance:,} ₽".replace(",", " ") if obj.advance else "—"

    @admin.display(description="Остаток")
    def balance_fmt(self, obj):
        balance = (obj.total or 0) - (obj.advance or 0)
        color = "#166534" if balance == 0 else ("#991b1b" if balance > 0 else "#374151")
        return format_html(
            '<span style="color:{};font-weight:600">{} ₽</span>',
            color,
            f"{balance:,}".replace(",", " "),
        )


# ── Material ───────────────────────────────────────────────────────────────────

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "direction", "unit", "price", "stock_display", "min_stock", "supplier")
    list_filter = ("type", "direction")
    search_fields = ("name", "supplier", "notes")
    readonly_fields = ("created_at", "updated_at")

    @admin.display(description="Остаток")
    def stock_display(self, obj):
        color = "#991b1b" if obj.stock <= obj.min_stock else "#166534"
        return format_html('<span style="color:{};font-weight:600">{}</span>', color, obj.stock)


# ── Colleague ──────────────────────────────────────────────────────────────────

@admin.register(Colleague)
class ColleagueAdmin(admin.ModelAdmin):
    list_display = ("name", "direction", "specialization", "contact")
    list_filter = ("direction",)
    search_fields = ("name", "specialization", "contact")
    readonly_fields = ("created_at", "updated_at")
