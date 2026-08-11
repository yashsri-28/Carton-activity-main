from .azure_email import AzureEmailSender
from django.conf import settings


class NotificationService:

    def __init__(self):
        self.email_client = AzureEmailSender()
        email_config = settings.EMAILS
        self.marketing_email = email_config["MARKETING"]
        self.tqm_email = email_config["TQM"]
        self.purchase_email = email_config["PURCHASE"]
        self.warehouse_email = email_config["WAREHOUSE"]
        

    # 1️⃣ Marketing - Request Created
    def send_request_created(self, request_obj):

        subject = f"PPC Request Created – ID {request_obj.id}"

        body = f"""
                    Dear marketing1,

                    Your PPC request has been successfully created in the system.

                    Request Details:
                    --------------------------------------------------
                    Request ID      : {request_obj.id}
                    Customer Name   : {request_obj.customer_name}
                    Program Name    : {request_obj.program_name}
                    --------------------------------------------------

                    The request has been forwarded to the TQM team for review.

                    Regards,
                    PPC Workflow System
                    """

        self.email_client.send_email(
            subject=subject,
            body_text=body,
            to_list=[self.marketing_email],
        )

    # 2️⃣ TQM - Technical Validation
    def send_tqm_notification(self, request_obj):

        subject = f"Technical Validation Required – ID {request_obj.id}"

        body = f"""
                    Dear tqm1,

                    A PPC request is pending your technical validation.

                    Request Details:
                    --------------------------------------------------
                    Request ID      : {request_obj.id}
                    Customer Name   : {request_obj.customer_name}
                    Program Name    : {request_obj.program_name}
                    --------------------------------------------------

                    Kindly login the ppc portal, review the request and take necessary action.

                    Regards,
                    PPC Workflow System
                    """

        self.email_client.send_email(
            subject=subject,
            body_text=body,
            to_list=[self.tqm_email],
        )

    # 3️⃣ Purchase Notification
    def send_purchase_notification(self, request_obj):

        subject = f"Procurement Review Required – ID {request_obj.id}"

        body = f"""
                    Dear purchase1,

                    The below PPC request has been approved and is pending your review.

                    Request Details:
                    --------------------------------------------------
                    Request ID      : {request_obj.id}
                    Customer Name   : {request_obj.customer_name}
                    Program Name    : {request_obj.program_name}
                    --------------------------------------------------

                    Please verify and update the status.

                    Regards,
                    PPC Workflow System
                    """

        self.email_client.send_email(
            subject=subject,
            body_text=body,
            to_list=[self.purchase_email],
        )

    # 4️⃣ Warehouse Notification
    def send_warehouse_notification(self, request_obj):

        subject = f"Warehouse Action Required – ID {request_obj.id}"

        body = f"""
                    Dear warehouse1,

                    The following PPC request is ready for processing.

                    Request Details:
                    --------------------------------------------------
                    Request ID      : {request_obj.id}
                    Customer Name   : {request_obj.customer_name}
                    Program Name    : {request_obj.program_name}
                    --------------------------------------------------

                    Kindly proceed with necessary processing.

                    Regards,
                    PPC Workflow System
                    """

        self.email_client.send_email(
            subject=subject,
            body_text=body,
            to_list=[self.warehouse_email],
        )
        
        
    def send_rejection_notification(self, program, reason):

        subject = f"PPC Request Rejected – ID {program.id}"

        body = f"""
                    Dear marketing1,

                    Your PPC request (ID: {program.id}) has been rejected.

                    Reason: {reason}

                    Regards,
                    PPC Workflow System
                    """

        self.email_client.send_email(
            subject=subject,
            body_text=body,
            to_list=[self.marketing_email]
        )

