from django.db import models
from django.conf import settings


class ActivityLog(models.Model):

    # Which module / screen
    module_name = models.CharField(
        max_length=200,
        help_text="Module or screen name e.g. Carton Program, Activity Status"
    )

    # Which record
    record_id = models.CharField(
        max_length=100,
        help_text="Primary key of related record"
    )

    # What happened
    action = models.CharField(
        max_length=100,
        help_text="Created / Updated / Assigned / Status Changed / Deleted"
    )

    # Simple story message
    message = models.TextField(
        help_text="Human readable description of action"
    )

    # Optional technical fields
    old_value = models.TextField(
        blank=True,
        null=True
    )

    new_value = models.TextField(
        blank=True,
        null=True
    )

    # Who did it   
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    performed_by_name = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    performed_by_role = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "activity_log"
        ordering = ["-created_on"]

    def __str__(self):
        return f"{self.module_name} - {self.action}"
