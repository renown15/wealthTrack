"""Cross-cutting constants shared across services and repositories."""

# Account types that belong to the Outgoings Hub only. They are excluded from
# the wealth views — Account Hub, Tax Hub and Analytics. Mirrors the frontend
# OUTGOING_TYPES in portfolioCalculations.ts.
OUTGOING_ACCOUNT_TYPES = frozenset(
    {
        "Utility - Gas",
        "Utility - Electric",
        "Utility - Water",
        "Utility - Broadband",
        "Insurance - Home",
        "Insurance - Car",
        "Insurance - Life",
        "Insurance - Health",
        "Insurance - Income Protection",
        "Subscription",
        "Household",
        "Membership",
        "Tax",
    }
)
