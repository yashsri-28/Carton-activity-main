from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.saml_login),
    path("acs/", views.saml_acs),
    path("metadata/", views.saml_metadata),
]


