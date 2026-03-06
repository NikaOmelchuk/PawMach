from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

class FrontendIndexView(TemplateView):
    template_name = 'index.html'

class FrontendDashboardView(TemplateView):
    template_name = 'dashboard.html'

class FrontendSurveyView(TemplateView):
    template_name = 'survey.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['survey_id'] = kwargs.get('pk', '')
        return ctx

class FrontendSessionView(TemplateView):
    template_name = 'session.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['session_id'] = kwargs.get('pk', '')
        return ctx

class FrontendResultsView(TemplateView):
    template_name = 'results.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['session_id'] = kwargs.get('pk', '')
        return ctx

class FrontendProfileView(LoginRequiredMixin, TemplateView):
    template_name = 'profile.html'
