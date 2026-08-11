# SAML_SETTINGS = {
#     "strict": True,
#     "debug": True,

#     # ──── ADD THIS LINE ────
#     "baseurl": "http://127.0.0.1:8888",   # ← your exact access URL (no trailing slash)

#     "sp": {
#         "entityId": "http://127.0.0.1:8888/saml/metadata",

#         "assertionConsumerService": {
#             "url": "http://127.0.0.1:8888/saml/acs",
#             "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
#         },

#         # Optional but recommended: add this block too (helps with more URL building)
#         "singleLogoutService": {
#             "url": "http://127.0.0.1:8888/saml/sls",  # if you implement SLO later; otherwise omit
#             "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
#         },
#     },

#     "idp": {
#         "entityId": "https://sts.windows.net/5b4308bc-4f16-4e8d-aab0-26cc3b6f4bec/",

#         "singleSignOnService": {
#             "url": "https://login.microsoftonline.com/5b4308bc-4f16-4e8d-aab0-26cc3b6f4bec/saml2",
#             "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
#         },

#         "singleLogoutService": {
#             "url": "https://login.microsoftonline.com/5b4308bc-4f16-4e8d-aab0-26cc3b6f4bec/saml2",
#             "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
#         },

#         "x509cert": "MIIC8DCCAdigAwIBAgIQIGsSGLe5maBMq3GNQ6Yy7DANBgkqhkiG9w0BAQsFADA0MTIwMAYDVQQDEylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGVkIFNTTyBDZXJ0aWZpY2F0ZTAeFw0yNjAzMTEwODEwMjhaFw0yOTAzMTEwODEwMjhaMDQxMjAwBgNVBAMTKU1pY3Jvc29mdCBBenVyZSBGZWRlcmF0ZWQgU1NPIENlcnRpZmljYXRlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyXt4SSyTxpHERjlQpdrzS3e2WcLeugVsPv5yE8NVAOfj2xH0f4rmF8FqC27iA019JUP3HRtyAqJojPfEeDFWMy0j4UC5QNW6OoV1JEtL6fTcR4icLSPwLds8YUTY9e/BLx5rteMgjRW9QoNbna8OBBeLf2aoRROLKoI8RCYMySGKsvneAQLaWZwCdo7q11VyRx0Qm6Y28E0Gvs1UisFDnfa1KW0VCC6LmXjgQhBlEVGRl67LbsUzWe3NkQ/ThJG+7k3imkWdWhgh2dinP++m3LxqZQCgLGhEVU/g5MKuzNq0tzNkuS7KzXmYor/P/hLO4yBfTstpOwKV2KMldV6nZQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBIzhWUeXxI0P1CGo6oVWRW5EC27e2kQWp5nKw6CMCt7omBQMcMMlClvRcrBHswOCb5091A2iUuZoFK8IrpvahWRfv8xrEv8gkardtp+q+FhKsCUYDMkJotqR+yttcjTrLeXkwnNjP8FHIyr6oXS1QwvzH5T6gKgkDsHzJ5nT7nzZo82HmQvwTOOsWS7Yt9GIWw7s3Mzv+8dyfte3PtAwU7K3VxEAoWrVnt0lnvrI92FQltws4lW5DRQ4iFDYo5eJxvMZ0U64qXAU5mGiDyM5eMpAZwxWLwFyAZD7nAd2IFt119nOuY8T3zku/Misrj9AAEOkcelgIZoR6l948s0Fxh"
#     }
# }


SAML_SETTINGS = {
    "strict": True,
    "debug": True,

    "sp": {
        "entityId": "https://wll-welpulse.welspun.com/api/saml/metadata/",

        "assertionConsumerService": {
            "url": "https://wll-welpulse.welspun.com/api/saml/acs/",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        },
    },

    "idp": {
        "entityId": "https://sts.windows.net/5b4308bc-4f16-4e8d-aab0-26cc3b6f4bec/",

        "singleSignOnService": {
            "url": "https://login.microsoftonline.com/5b4308bc-4f16-4e8d-aab0-26cc3b6f4bec/saml2",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },

        "singleLogoutService": {
            "url": "https://login.microsoftonline.com/5b4308bc-4f16-4e8d-aab0-26cc3b6f4bec/saml2",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },

        "x509cert": "MIIC8DCCAdigAwIBAgIQIGsSGLe5maBMq3GNQ6Yy7DANBgkqhkiG9w0BAQsFADA0MTIwMAYDVQQDEylNaWNyb3NvZnQgQXp1cmUgRmVkZXJhdGVkIFNTTyBDZXJ0aWZpY2F0ZTAeFw0yNjAzMTEwODEwMjhaFw0yOTAzMTEwODEwMjhaMDQxMjAwBgNVBAMTKU1pY3Jvc29mdCBBenVyZSBGZWRlcmF0ZWQgU1NPIENlcnRpZmljYXRlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyXt4SSyTxpHERjlQpdrzS3e2WcLeugVsPv5yE8NVAOfj2xH0f4rmF8FqC27iA019JUP3HRtyAqJojPfEeDFWMy0j4UC5QNW6OoV1JEtL6fTcR4icLSPwLds8YUTY9e/BLx5rteMgjRW9QoNbna8OBBeLf2aoRROLKoI8RCYMySGKsvneAQLaWZwCdo7q11VyRx0Qm6Y28E0Gvs1UisFDnfa1KW0VCC6LmXjgQhBlEVGRl67LbsUzWe3NkQ/ThJG+7k3imkWdWhgh2dinP++m3LxqZQCgLGhEVU/g5MKuzNq0tzNkuS7KzXmYor/P/hLO4yBfTstpOwKV2KMldV6nZQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBIzhWUeXxI0P1CGo6oVWRW5EC27e2kQWp5nKw6CMCt7omBQMcMMlClvRcrBHswOCb5091A2iUuZoFK8IrpvahWRfv8xrEv8gkardtp+q+FhKsCUYDMkJotqR+yttcjTrLeXkwnNjP8FHIyr6oXS1QwvzH5T6gKgkDsHzJ5nT7nzZo82HmQvwTOOsWS7Yt9GIWw7s3Mzv+8dyfte3PtAwU7K3VxEAoWrVnt0lnvrI92FQltws4lW5DRQ4iFDYo5eJxvMZ0U64qXAU5mGiDyM5eMpAZwxWLwFyAZD7nAd2IFt119nOuY8T3zku/Misrj9AAEOkcelgIZoR6l948s0Fxh"
    }
}