"""Cross-cutting constants shared across services and repositories."""

# ReferenceData class keys. Outgoing account/institution types live under their
# own class keys so the Outgoings Hub vs wealth-view split is derived from the
# DB (a new outgoing type is a seed-only change) rather than hardcoded lists.
ACCOUNT_TYPE_CLASS = "account_type"
INSTITUTION_TYPE_CLASS = "institution_type"
OUTGOING_ACCOUNT_TYPE_CLASS = "outgoing_account_type"
OUTGOING_INSTITUTION_TYPE_CLASS = "outgoing_institution_type"
