"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from django.conf.urls.static import static




api_info = openapi.Info(
    title="Carton Workflow System",
    default_version='v1',
    description="API documentation for Carton Workflow",
    # terms_of_service="https://www.example.com/terms/",
    # contact=openapi.Contact(email="contact@example.com"),
    # license=openapi.License(name="BSD License"),
)

schema_view = get_schema_view(
    api_info,
    public=True,
    permission_classes=(permissions.AllowAny,),
)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include('accounts.urls')),
    path("api/", include("programs.urls")),
    path("api/", include("userManagement.urls")),
    path("api/pp-sample/", include("pp_sample.urls")),
    path("api/labdip/", include("labdip.urls")),
    path("api/artwork/", include("artwork.urls")),
    
    path("api/saml/", include("saml_auth.urls")),



    # path("api/v1/users/", include('userManagement.urls')),
    
    
    
    # ----------------------------
    # Swagger Docs Urls
    # ----------------------------

    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

