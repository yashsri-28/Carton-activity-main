from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.

    Adds:
    - Role-based access control
    - Employee code
    - Company name
    - Allowed page permissions
    """

    # --------------------------------------------------
    # Role Constants
    # --------------------------------------------------

    ADMIN = "ADMIN"
    MARKETING = "MARKETING"
    TTQM = "TTQM"
    PURCHASE = "PURCHASE"
    SUPER_ADMIN = "SUPER_ADMIN"
    EMPLOYEE = "EMPLOYEE"
    PPC = "PPC"
    WAREHOUSE = "WAREHOUSE"
    TOP = "TOP"
    TESTING = "TESTING"
    LAB = "LAB"
    VENDOR = "VENDOR"
    PROCUREMENT = "PROCUREMENT"

    # --------------------------------------------------
    # Role Choices
    # --------------------------------------------------

    ROLE_CHOICES = [
        (ADMIN, "Admin"),
        (MARKETING, "Marketing"),
        (TTQM, "TTQM"),
        (PURCHASE, "PURCHASE"),
        (SUPER_ADMIN, "Super Admin"),
        (EMPLOYEE, "Employee"),
        (PPC, "PPC"),
        (WAREHOUSE, "Warehouse"),
        (TOP, "Top"),
        (TESTING, "Testing"),
        (LAB, "LAB"),
        (VENDOR, "Vendor"),
        (PROCUREMENT, "Procurement"),


    ]

    # --------------------------------------------------
    # Custom Fields
    # --------------------------------------------------

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=EMPLOYEE,
        db_index=True
    )

    emp_code = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        unique=True,
        db_index=True
    )

    company_name = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        db_index=True
    )

    allowed_pages = models.JSONField(
        default=list,
        blank=True,
        help_text="List of frontend page identifiers user can access"
    )

    # --------------------------------------------------
    # Override related_name to avoid clashes
    # --------------------------------------------------

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_groups",
        blank=True
    )

    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_permissions",
        blank=True
    )

    # --------------------------------------------------
    # Database Meta
    # --------------------------------------------------

    class Meta:
        db_table = "user"
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["emp_code"]),
            models.Index(fields=["company_name"]),
        ]

    # --------------------------------------------------
    # Helper Methods (Clean Usage in Code)
    # --------------------------------------------------

    def is_admin(self):
        return self.role == self.ADMIN

    def is_super_admin(self):
        return self.role == self.SUPER_ADMIN

    def is_employee(self):
        return self.role == self.EMPLOYEE

    # --------------------------------------------------
    # String Representation
    # --------------------------------------------------

    def __str__(self):
        return f"{self.username} ({self.role})"
