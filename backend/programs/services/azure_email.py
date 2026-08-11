import requests
from datetime import datetime, timedelta
from msal import ConfidentialClientApplication
from django.conf import settings


class AzureEmailSender:

    def __init__(self):
        config = settings.AZURE_EMAIL
        self.tenant_id = config["TENANT_ID"]
        self.client_id = config["CLIENT_ID"]
        self.client_secret = config["CLIENT_SECRET"]
        self.email_account = config["EMAIL_ACCOUNT"]

        self.access_token = None
        self.token_expiry = None

    def get_access_token(self):

        # Reuse token if valid
        if self.access_token and self.token_expiry:
            if datetime.utcnow() < self.token_expiry - timedelta(minutes=5):
                return self.access_token

        authority = f"https://login.microsoftonline.com/{self.tenant_id}"

        app = ConfidentialClientApplication(
            self.client_id,
            authority=authority,
            client_credential=self.client_secret,
        )

        result = app.acquire_token_for_client(
            scopes=["https://graph.microsoft.com/.default"]
        )

        if "access_token" not in result:
            raise Exception(f"Token Error: {result}")

        self.access_token = result["access_token"]
        self.token_expiry = datetime.utcnow() + timedelta(
            seconds=result.get("expires_in", 3600)
        )

        return self.access_token

    def send_email(self, subject, body_text, to_list):

        token = self.get_access_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        def format_recipients(email_list):
            return [{"emailAddress": {"address": e}} for e in email_list]

        message = {
            "subject": subject,
            "body": {
                "contentType": "Text",
                "content": body_text,
            },
            "toRecipients": format_recipients(to_list),
        }

        payload = {
            "message": message,
            "saveToSentItems": True,
        }

        url = f"https://graph.microsoft.com/v1.0/users/{self.email_account}/sendMail"

        response = requests.post(url, headers=headers, json=payload)

        if response.status_code != 202:
            raise Exception(response.text)

        return True
