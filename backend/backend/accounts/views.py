"""
Authentication APIs:
- Login using email & password
- Logout by blacklisting refresh token

Uses:
- Django authentication
- SimpleJWT for token handling
- Swagger for API documentation
"""

# ----------------------------
# Django & DRF Imports
# ----------------------------

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth import authenticate

# ----------------------------
# Third-party JWT Imports
# ----------------------------

from rest_framework_simplejwt.tokens import RefreshToken

# ----------------------------
# Project Imports
# ----------------------------

from userManagement.models import User

# ----------------------------
# Swagger Imports
# ----------------------------

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

# ----------------------------
# Python Standard Libraries
# ----------------------------

import traceback


# ======================================================
# LOGIN API SCHEMA
# ======================================================

login_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["email", "password"],
    properties={
        "email": openapi.Schema(
            type=openapi.TYPE_STRING,
            example="marketing1@welspun.com"
        ),
        "password": openapi.Schema(
            type=openapi.TYPE_STRING,
            example="Welcome@904"
        ),
    },
)


# ======================================================
# LOGIN API
# ======================================================

@swagger_auto_schema(
    method="post",
    request_body=login_schema,
    responses={
        200: openapi.Response(
            "Success",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "access": openapi.Schema(type=openapi.TYPE_STRING),
                    "refresh": openapi.Schema(type=openapi.TYPE_STRING),
                }
            )
        ),
        400: "User not found",
        401: "Invalid credentials",
        403: "Account deactivated"
    },
    operation_summary="User login"
)
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate user using email & password.

    Flow:
    1. Fetch user by email
    2. Check active status
    3. Authenticate credentials
    4. Generate JWT tokens
    5. Return user profile
    """

    # ----------------------------
    # Extract input data
    # ----------------------------

    email = request.data.get("email")
    password = request.data.get("password")

    # ----------------------------
    # Validate user existence
    # ----------------------------

    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ----------------------------
    # Check if account active
    # ----------------------------

    if not user_obj.is_active:
        return Response(
            {"detail": "User account is deactivated."},
            status=status.HTTP_403_FORBIDDEN
        )

    # ----------------------------
    # Authenticate credentials
    # ----------------------------

    authenticated_user = authenticate(
        request,
        username=user_obj.username,
        password=password
    )

    if authenticated_user is None:
        return Response(
            {"detail": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # ----------------------------
    # Generate JWT tokens
    # ----------------------------

    refresh_token = RefreshToken.for_user(authenticated_user)

    # Add custom claims
    refresh_token["username"] = authenticated_user.username
    refresh_token["role"] = authenticated_user.role

    access_token = refresh_token.access_token

    # ----------------------------
    # Prepare response
    # ----------------------------

    return Response({
        "access": str(access_token),
        "refresh": str(refresh_token),
        "user": {
            "id": authenticated_user.id,
            "username": authenticated_user.username,
            "email": authenticated_user.email,
            "role": authenticated_user.role,
            "company": authenticated_user.company_name,   # from User table
        },
        "message": "Login successful."
    })


# ======================================================
# LOGOUT API SCHEMA
# ======================================================

logout_schema = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["refresh"],
    properties={
        "refresh": openapi.Schema(
            type=openapi.TYPE_STRING,
            example="your_refresh_token_here"
        ),
    },
)


# ======================================================
# LOGOUT API
# ======================================================

@swagger_auto_schema(
    method="post",
    request_body=logout_schema,
    responses={
        200: openapi.Response(description="Successfully logged out"),
        400: openapi.Response(description="Invalid refresh token"),
    },
    operation_summary="User logout"
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout user by blacklisting refresh token.
    """

    try:
        refresh_token = request.data.get("refresh")

        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response(
            {"detail": "Successfully logged out"},
            status=status.HTTP_200_OK
        )

    except Exception:
        traceback.print_exc()
        return Response(
            {"detail": "Invalid refresh token"},
            status=status.HTTP_400_BAD_REQUEST
        )
