from .models import ActivityLog


def create_log(
    module_name,
    record_id,
    action,
    message,
    user=None,
    old_value=None,
    new_value=None
):

    ActivityLog.objects.create(
        module_name=module_name,
        record_id=str(record_id),
        action=action,
        message=message,

        performed_by=user,
        performed_by_name=user.username if user else None,
        performed_by_role=user.role if user else None,

        old_value=old_value,
        new_value=new_value
    )
