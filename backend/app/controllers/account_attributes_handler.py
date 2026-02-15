"""Handler for account attribute save/update operations."""
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate

# Attribute names to load/save
ATTRIBUTE_FIELDS = [
    "account_number",
    "sort_code",
    "roll_ref_number",
    "interest_rate",
    "fixed_bonus_rate",
    "fixed_bonus_rate_end_date",
    "release_date",
    "number_of_shares",
    "underlying",
    "price",
    "purchase_price",
]


async def load_account_attributes(
    attr_repo: AccountAttributeRepository,
    account_id: int,
    user_id: int,
    response: AccountResponse,
) -> None:
    """Load all account attributes and populate response."""
    print(f"[DEBUG] load_account_attributes called for account {account_id}")
    for field in ATTRIBUTE_FIELDS:
        value = await attr_repo.get_attribute_by_name(account_id, user_id, field)
        print(f"[DEBUG]   LOADED: {field} = {value}")
        setattr(response, field, value)


async def save_account_attributes(
    attr_repo: AccountAttributeRepository,
    account_id: int,
    user_id: int,
    attribute_data: AccountCreate | AccountUpdate,
) -> None:
    """Save or update account attributes (banking details, rates, dates)."""
    for field in ATTRIBUTE_FIELDS:
        if hasattr(attribute_data, field):
            value = getattr(attribute_data, field, None)
            if value:
                await attr_repo.set_attribute_by_name(
                    account_id, user_id, field, value
                )


async def update_account_attributes(
    attr_repo: AccountAttributeRepository,
    account_id: int,
    user_id: int,
    attribute_data: AccountUpdate,
) -> None:
    """Update account attributes with None checks for update operations."""
    print(f"[DEBUG] update_account_attributes called for account {account_id}")
    print(f"[DEBUG] attribute_data: {attribute_data}")
    print(f"[DEBUG] attribute_data dict: {attribute_data.dict()}")

    for field in ATTRIBUTE_FIELDS:
        if hasattr(attribute_data, field):
            value = getattr(attribute_data, field, None)
            print(f"[DEBUG]   field={field}, value={value}, value_type={type(value)}")
            if value is not None and value != "":
                print(f"[DEBUG]   SAVING: {field} = {value}")
                result = await attr_repo.set_attribute_by_name(
                    account_id, user_id, field, value
                )
                print(f"[DEBUG]   SAVED result: {result}")
            elif value is None or value == "":
                print(f"[DEBUG]   DELETING: {field}")
                await attr_repo.delete_attribute_by_name(
                    account_id, user_id, field
                )
