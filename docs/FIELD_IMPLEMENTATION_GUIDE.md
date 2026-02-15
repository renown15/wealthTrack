# Implementation Guide: Adding Nullable Fields

This guide walks through adding a new optional field to an Account (e.g., a phone number or account tier field).

## Overview

The process is straightforward because of the naming convention middleware:

1. **Database Migration** - Define the column
2. **Python Model** - Add to SQLAlchemy ORM
3. **Pydantic Schema** - Add to response model
4. **Frontend Model** - Add to TypeScript interface
5. **Frontend UI** - Add form field (if needed)

The naming convention transformation is automatic - no manual conversion needed.

## Step-by-Step Example: Adding `phone_number` field

### Step 1: Database Migration

Create an Alembic migration:

```bash
cd backend
alembic revision --autogenerate -m "add phone number to account"
```

Edit the generated migration in `alembic/versions/`:

```python
def upgrade() -> None:
    op.add_column(
        'Account',
        sa.Column('phone_number', sa.String(20), nullable=True)
    )

def downgrade() -> None:
    op.drop_column('Account', 'phone_number')
```

Run the migration:

```bash
alembic upgrade head
```

### Step 2: Update SQLAlchemy Model

**File**: [backend/app/models/account.py](../../backend/app/models/account.py)

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

class Account(Base):
    __tablename__ = "Account"
    
    # ... existing fields ...
    
    phone_number: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Customer phone number"
    )
```

**Naming Convention**: Use snake_case (Python standard)

### Step 3: Update Pydantic Schema

**File**: [backend/app/schemas/account.py](../../backend/app/schemas/account.py)

```python
from typing import Optional

class AccountResponse(BaseSchema):
    """Account response - inherits alias_generator from BaseSchema."""
    
    # ... existing fields ...
    
    phone_number: Optional[str] = None
    
    class Config:
        from_attributes = True
```

**Important**: You do NOT need to add explicit aliases. The `BaseSchema` parent class handles `alias_generator=to_camel_case` automatically.

### Step 4: Update Frontend Model

**File**: [frontend/src/types/models.ts](../../frontend/src/types/models.ts) (or wherever your types are defined)

```typescript
export interface Account {
    // ... existing fields ...
    
    phoneNumber?: string | null;  // Automatically in camelCase from API
}
```

**Naming Convention**: Use camelCase (JavaScript standard)

### Step 5: Add to Frontend Form (Optional)

If the field should be editable in the UI:

**File**: [frontend/src/components/AddAccountModal.vue](../../frontend/src/components/AddAccountModal.vue)

```vue
<template>
  <div class="form-group">
    <label for="phoneNumber">Phone Number</label>
    <input
      id="phoneNumber"
      v-model="formData.phoneNumber"
      type="tel"
      placeholder="Enter phone number"
    />
  </div>
</template>

<script setup lang="ts">
const formData = ref({
  // ... existing fields ...
  phoneNumber: "",
});
</script>
```

## Verification

### 1. Check Database
```bash
docker exec wealthtrack-db-dev psql -U postgres -d wealthtrack -c \
  "SELECT id, phone_number FROM Account LIMIT 1;"
```

### 2. Test API Response
```bash
curl http://localhost:8001/api/v1/accounts/1 \
  -H "Authorization: Bearer $TOKEN"
```

Should see:
```json
{
  "id": 1,
  "phoneNumber": null,  // ← Automatically camelCase
  "accountNumber": "...",
  ...
}
```

### 3. Frontend Debug
In Vue DevTools, inspect the Account object:
```
phoneNumber: null  // ← TypeScript will validate this matches interface
```

## Common Field Types

### Simple Types

```python
# String
email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

# Integer
age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

# Float/Decimal
balance: Mapped[Optional[Decimal]] = mapped_column(Numeric(19, 2), nullable=True)

# Boolean
is_active: Mapped[bool] = mapped_column(Boolean, default=True)

# Date/DateTime
last_accessed: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
```

### In Pydantic Schema

```python
email: Optional[str] = None
age: Optional[int] = None
balance: Optional[Decimal] = None
is_active: bool = True
last_accessed: Optional[datetime] = None
```

### In TypeScript

```typescript
email?: string | null;
age?: number | null;
balance?: number | null;  // JavaScript Decimal as number
isActive: boolean;
lastAccessed?: Date | null;
```

## Without Nullable Fields

If a field is required:

```python
# Database
required_field: Mapped[str] = mapped_column(String(255), nullable=False)

# Pydantic
required_field: str  # No Optional

# TypeScript
requiredField: string;  # Not optional
```

## Special Cases

### Foreign Keys

```python
# Database
institution_id: Mapped[int] = mapped_column(
    ForeignKey("Institution.id"),
    nullable=False
)

# Pydantic
institution_id: int

# TypeScript
institutionId: number;
```

### Enums

```python
# Database
from enum import Enum

class AccountStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

status: Mapped[AccountStatus] = mapped_column(
    Enum(AccountStatus),
    default=AccountStatus.ACTIVE
)

# Pydantic
status: AccountStatus = AccountStatus.ACTIVE

# TypeScript
status: "active" | "inactive";
```

### Complex Objects

The middleware recursively transforms nested objects:

```python
# Pydantic
metadata: Optional[dict] = None

# API Response
{
  "id": 1,
  "metadata": {
    "user_preference": "value",
    "last_viewed_page": "/accounts"
  }
}

# Transformed to
{
  "id": 1,
  "metadata": {
    "userPreference": "value",
    "lastViewedPage": "/accounts"
  }
}
```

## Testing Your Changes

### Backend Tests

```bash
# Run tests to verify field persistence
make test
```

Your field should appear in test responses automatically.

### Frontend Acceptance

```bash
# Build to catch TypeScript errors
npm run build

# Run tests
npm run test
```

## Rollback

If you need to remove a field:

1. **Frontend**: Remove from interface and components
2. **Pydantic**: Remove from schema
3. **SQLAlchemy**: Remove from model
4. **Database**: Create downgrade migration
   ```python
   op.drop_column('Account', 'field_name')
   ```

## FAQ

**Q: Do I need to restart the backend after adding a field?**
A: Yes, to apply database migrations and reload models.

**Q: Will the middleware slow down responses?**
A: Negligibly. It's one JSON parse → transform → serialize. Orders of magnitude less expensive than the DB query.

**Q: What if I forget to add the field to the frontend?**
A: It's fine - TypeScript will show an error if you try to access it. The backend will still send it.

**Q: Can I have both snake_case and camelCase in the same response?**
A: No, the middleware transforms ALL keys. This is by design - consistency matters.

**Q: Does this work with pagination?**
A: Yes. The middleware recursively transforms all objects in arrays and nested structures.

## Related Documentation

- [Architecture: Naming Conventions](./ARCHITECTURE_NAMING_CONVENTIONS.md)
- [Backend Models](../backend/app/models/)
- [Frontend Types](../frontend/src/types/)
