from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
# Create your views here.
from django.contrib.auth import get_user_model

User = get_user_model()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_list(request):

    current_user = request.user
    current_role = current_user.role

    users = User.objects.filter(
        is_active=True
    ).exclude(
        role=current_role
    ).exclude(
        id=current_user.id
    ).values(
        "id",
        "username",
        "email",
        "role"
    )

    return Response(list(users))