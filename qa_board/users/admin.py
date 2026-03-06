from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

from django import forms

class CustomUserChangeListForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.pk:
            if 'first_name' in self.fields:
                self.fields['first_name'].widget.attrs['placeholder'] = self.instance.first_name or 'Пусто'
            if 'last_name' in self.fields:
                self.fields['last_name'].widget.attrs['placeholder'] = self.instance.last_name or 'Пусто'

    def clean_is_active(self):
        is_active = self.cleaned_data.get('is_active')
        if self.instance.pk and self.instance.is_superuser and not is_active:
            raise forms.ValidationError("🚨 Неможливо деактивувати суперадміністратора зі списку!")
        return is_active

    def clean_is_staff(self):
        is_staff = self.cleaned_data.get('is_staff')
        if self.instance.pk and self.instance.is_superuser and not is_staff:
            raise forms.ValidationError("🚨 Суперадміністратор завжди повинен мати статус персоналу!")
        return is_staff

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):

    change_list_template = "admin/change_list_auto_refresh.html"

    def get_changelist_form(self, request, **kwargs):
        return CustomUserChangeListForm

    list_per_page = 100
    list_display = ('email', 'username', 'first_name', 'last_name', 'gender', 'delete_after_days', 'is_staff', 'is_active')
    list_display_links = ('email',)
    list_filter = ('gender', 'is_staff', 'is_active', 'delete_after_days')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)

    list_editable = ('username', 'first_name', 'last_name', 'gender', 'delete_after_days', 'is_staff', 'is_active')

    actions = [
        'make_active', 'make_banned',
        'make_staff', 'remove_staff',
        'set_delete_policy_0', 'set_delete_policy_30', 'set_delete_policy_60', 'set_delete_policy_90'
    ]

    @admin.action(description='🟢 Активувати (is_active=True)')
    def make_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} акаунтів було активовано.")

    @admin.action(description='🔴 Заблокувати (is_active=False)')
    def make_banned(self, request, queryset):

        superusers = queryset.filter(is_superuser=True).count()
        if superusers > 0:
            self.message_user(request, f"Помилка: Серед вибраних є суперадміни ({superusers}), їх не можна блокувати масово!", level='error')
            return
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} акаунтів було заблоковано.")

    @admin.action(description='⭐ Надати статус персоналу (is_staff=True)')
    def make_staff(self, request, queryset):
        updated = queryset.update(is_staff=True)
        self.message_user(request, f"{updated} користувачам надано статус персоналу.")

    @admin.action(description='❌ Забрати статус персоналу (is_staff=False)')
    def remove_staff(self, request, queryset):
        superusers = queryset.filter(is_superuser=True).count()
        if superusers > 0:
            self.message_user(request, f"Помилка: Суперадміни завжди повинні бути персоналом!", level='error')
            return
        updated = queryset.update(is_staff=False)
        self.message_user(request, f"Статус персоналу забрано у {updated} користувачів.")

    @admin.action(description='🛡️ Не видаляти (Вимкнути автовидалення)')
    def set_delete_policy_0(self, request, queryset):
        updated = queryset.update(delete_after_days=0)
        self.message_user(request, f"Автовидалення вимкнено для {updated} користувачів.")

    @admin.action(description='🗑 Встановити автовидалення через 30 днів')
    def set_delete_policy_30(self, request, queryset):
        updated = queryset.update(delete_after_days=30)
        self.message_user(request, f"Політику автовидалення (30 днів) застосовано до {updated} користувачів.")

    @admin.action(description='🗑 Встановити автовидалення через 60 днів')
    def set_delete_policy_60(self, request, queryset):
        updated = queryset.update(delete_after_days=60)
        self.message_user(request, f"Політику автовидалення (60 днів) застосовано до {updated} користувачів.")

    @admin.action(description='🗑 Встановити автовидалення через 90 днів')
    def set_delete_policy_90(self, request, queryset):
        updated = queryset.update(delete_after_days=90)
        self.message_user(request, f"Політику автовидалення (90 днів) застосовано до {updated} користувачів.")

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Особисті дані', {'fields': ('first_name', 'last_name', 'email', 'gender', 'birth_date', 'bio', 'avatar')}),
        ('Політика видалення', {'fields': ('delete_after_days',)}),
        ('ПРАВА ДОСТУПУ ТА АДМІНІСТРУВАННЯ', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Важливі дати', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Додаткова інформація', {
            'fields': ('email', 'gender', 'birth_date')
        }),
    )
