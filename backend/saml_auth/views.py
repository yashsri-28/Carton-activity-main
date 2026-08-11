from django.http import HttpResponseRedirect, HttpResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.metadata import OneLogin_Saml2_Metadata
from .saml_settings import SAML_SETTINGS
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken


import logging

# Set up a dedicated logger for unregistered SAML login attempts
unregistered_logger = logging.getLogger('saml_unregistered_users')
unregistered_logger.setLevel(logging.INFO)
handler = logging.FileHandler('saml_unregistered_users.log')
formatter = logging.Formatter('%(asctime)s - %(message)s')
handler.setFormatter(formatter)
unregistered_logger.addHandler(handler)

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

def prepare_django_request(request):
    return {
        'https': 'on',  # since SSL is enabled
        'http_host': request.get_host(),
        'script_name': request.path,
        'get_data': request.GET.copy(),
        'post_data': request.POST.copy(),
        'query_string': request.META.get('QUERY_STRING', ''),
    }


def init_saml_auth(request):
    req = prepare_django_request(request)
    return OneLogin_Saml2_Auth(req, old_settings=SAML_SETTINGS)


# -------- LOGIN --------
def saml_login(request):
    auth = init_saml_auth(request)
    return HttpResponseRedirect(auth.login())


# -------- ACS (IMPORTANT) --------
from django.contrib.auth import login
# @csrf_exempt
# def saml_acs(request):
#     auth = init_saml_auth(request)
#     auth.process_response()
#     errors = auth.get_errors()

#     if not errors:
#         attributes = auth.get_attributes()

#         email = attributes.get(
#             'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
#         )[0]

#         user = User.objects.get(username=email)

#         # 🔥 Generate token
#         token = get_tokens_for_user(user)

#         # 🔥 Redirect with role + token
#         return HttpResponseRedirect(
#             f"https://wll-welpulse.welspun.com/login-success?role={user.role}&token={token}"
#         )

#     return HttpResponse("SAML Failed")


@csrf_exempt
def saml_acs(request):
    auth = init_saml_auth(request)
    auth.process_response()
    errors = auth.get_errors()

    if not errors:
        attributes = auth.get_attributes()
        email = attributes.get(
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        )[0]

        try:
            user = User.objects.get(username=email)
        except User.DoesNotExist:
            unregistered_logger.info(f"Unregistered login attempt: {email}")
            return HttpResponse(
                f"Access denied: No account found for {email}. "
                f"Please contact the administrator to get access.",
                status=403
            )

        # 🔥 Generate token
        token = get_tokens_for_user(user)

        # 🔥 Redirect with role + token
        return HttpResponseRedirect(
            f"https://wll-welpulse.welspun.com/login-success?role={user.role}&token={token}"
        )

    return HttpResponse("SAML Failed")

    
# -------- METADATA --------
def saml_metadata(request):
    metadata = OneLogin_Saml2_Metadata.builder(SAML_SETTINGS)
    return HttpResponse(metadata, content_type='text/xml')








# # saml_auth/views.py

# from django.http import HttpResponseRedirect, HttpResponse
# from django.contrib.auth.models import User
# from onelogin.saml2.auth import OneLogin_Saml2_Auth
# from onelogin.saml2.metadata import OneLogin_Saml2_Metadata
# from .saml_settings import SAML_SETTINGS
# import requests


# print("SP Entity ID:", SAML_SETTINGS["sp"]["entityId"])
# # print("Request Host:", request.get_host())
# # print("Full URL:", request.build_absolute_uri())


# def prepare_django_request(request):
#     """
#     python3-saml needs a plain dict — it cannot read a Django HttpRequest directly.
#     This is the standard adapter used in all python3-saml Django examples.
#     """
#     result = {
#         'https':        'on' if request.is_secure() else 'off',
#         'http_host':    request.META.get('HTTP_HOST', 'localhost'),
#         'script_name':  request.META.get('PATH_INFO', ''),
#         'get_data':     request.GET.copy(),
#         'post_data':    request.POST.copy(),
#         # Body is needed for the ACS POST binding
#         'query_string': request.META.get('QUERY_STRING', ''),
#     }
#     return result


# # def init_saml_auth(request):
# #     req = prepare_django_request(request)          # ← was: passing raw `request`
# #     return OneLogin_Saml2_Auth(req, old_settings=SAML_SETTINGS)

# def init_saml_auth(request):

#     req = {
#         'http_host': '192.168.162.222',
#         'server_port': '80',
#         'script_name': request.path,
#         'get_data': request.GET.copy(),
#         'post_data': request.POST.copy(),
#         'https': 'off'
#     }

#     return OneLogin_Saml2_Auth(req, old_settings=SAML_SETTINGS)

# def saml_login(request):
#     auth = init_saml_auth(request)
#     return HttpResponseRedirect(auth.login())

# @csrf_exempt
# def saml_acs(request):
#     auth = init_saml_auth(request)
#     auth.process_response()
#     errors = auth.get_errors()

#     if not errors:
#         attributes = auth.get_attributes()
#         email = attributes.get(
#             'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
#         )[0]
#         user, created = User.objects.get_or_create(username=email, defaults={'email': email})
#         # your JWT minting + redirect logic here ...
#         return HttpResponseRedirect('/')

#     return HttpResponse(f"SAML Authentication Failed: {', '.join(errors)}")


# def saml_metadata(request):
#     metadata = OneLogin_Saml2_Metadata.builder(SAML_SETTINGS)
#     return HttpResponse(metadata, content_type='text/xml')


# # from django.http import HttpResponseRedirect, HttpResponse
# # from django.contrib.auth import login
# # from django.contrib.auth.models import User

# # from onelogin.saml2.auth import OneLogin_Saml2_Auth
# # from onelogin.saml2.metadata import OneLogin_Saml2_Metadata

# # from .saml_settings import SAML_SETTINGS


# # def init_saml_auth(request):
# #     return OneLogin_Saml2_Auth(request, old_settings=SAML_SETTINGS)


# # def saml_login(request):

# #     auth = init_saml_auth(request)

# #     return HttpResponseRedirect(auth.login())


# # def saml_acs(request):

# #     auth = init_saml_auth(request)

# #     auth.process_response()

# #     errors = auth.get_errors()

# #     if not errors:

# #         attributes = auth.get_attributes()

# #         email = attributes.get(
# #             "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
# #         )[0]

# #         user, created = User.objects.get_or_create(username=email)

# #         login(request, user)

# #         return HttpResponseRedirect("/")

# #     return HttpResponse("SAML Authentication Failed")


# # def saml_metadata(request):

# #     metadata = OneLogin_Saml2_Metadata.builder(SAML_SETTINGS)

# #     return HttpResponse(metadata, content_type="text/xml")