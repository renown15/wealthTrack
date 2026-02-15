# Naming Conventions & API Response Transformation

## Overview

WealthTrack uses a **convention bridge pattern** to reconcile Python's snake_case naming with JavaScript's camelCase naming. This document explains the architecture and implications.

## Problem Statement

- **Backend (Python/FastAPI)**: Uses PEP 8 snake_case conventions
  - Database columns: `fixed_bonus_rate`, `account_number`, `status_id`
  - Python classes: `AccountAttribute`, `user_id`, `created_at`

- **Frontend (TypeScript/Vue)**: Uses camelCase conventions
  - Model properties: `fixedBonusRate`, `accountNumber`, `statusId`
  - Variables: `isLoading`, `accountData`, `createdAt`

Direct mismatch would require manual conversion at every API boundary.

## Solution: Response Transformation Middleware

### Architecture

A **Starlette middleware** (`SnakeToCamelCaseMiddleware`) automatically transforms all JSON responses from snake_case to camelCase before reaching the client.

**File**: [backend/app/main.py](../backend/app/main.py)

```python
class SnakeToCamelCaseMiddleware(BaseHTTPMiddleware):
    """Transforms all JSON response bodies from snake_case to camelCase."""
    
    @staticmethod
    def _to_camel_case(snake_str: str) -> str:
        """Convert snake_case to camelCase."""
        components = snake_str.split("_")
        return components[0] + "".join(x.title() for x in components[1:])
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Intercept and transform JSON responses."""
```

### Request/Response Flow

```
1. Frontend sends request (uses camelCase due to Pydantic's populate_by_name=True)
   PUT /api/v1/accounts/11
   {"fixedBonusRate": "2.3", "accountNumber": "51752935"}

2. Pydantic schema accepts both snake_case and camelCase (populate_by_name=True)
   Account.fixed_bonus_rate = "2.3"
   Account.account_number = "51752935"

3. Controller returns Python model with snake_case
   return AccountResponse.from_orm(account)

4. Middleware intercepts JSON response
   {"fixed_bonus_rate": "2.3", "account_number": "51752935", ...}

5. Middleware transforms to camelCase
   {"fixedBonusRate": "2.3", "accountNumber": "51752935", ...}

6. Frontend receives transformed response
   Response data matches TypeScript interface exactly
```

## Implementation Details

### Middleware Order

```python
# In app/main.py
app.add_middleware(SnakeToCamelCaseMiddleware)  # Added BEFORE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    ...
)
```

**Important**: Middleware is added BEFORE CORS so that:
- Response body transformation happens first
- CORS headers are preserved (not overwritten)
- Response status codes remain correct

### Pydantic Schema Configuration

All schemas inherit from `BaseSchema` which configures:

```python
# schema/base.py
class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel_case,      # Output aliases are camelCase
        populate_by_name=True,               # Accept both snake_case and camelCase in input
    )
```

**Why `populate_by_name=True`?**
- Allows controllers to use Python conventions internally
- Lets Pydantic accept requests with either naming convention
- Middleware handles the output transformation

## Adding New Fields

### Scenario: Add a new field `interest_rate_tier`

**1. Database/Model (Python - use snake_case)**
```python
class Account(Base):
    __tablename__ = "Account"
    
    interest_rate_tier: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
```

**2. Pydantic Schema (Python - use snake_case)**
```python
class AccountResponse(BaseSchema):
    interest_rate_tier: Optional[str] = None
    # No alias_generator config needed - BaseSchema handles it
```

**3. Controller (Python - use snake_case)**
```python
@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: int, ...):
    response = AccountResponse.from_orm(account)
    return response  # Middleware transforms to camelCase automatically
```

**4. Frontend (TypeScript - use camelCase)**
```typescript
interface Account {
    interestRateTier?: string | null;  // Receives this from API
}

// Use it naturally
const tier = account.interestRateTier;
```

**That's it.** No manual conversion layer needed.

## Transformation Examples

| Backend (DB/Python) | API Response (Middleware output) | Frontend (TypeScript) |
|---|---|---|
| `fixed_bonus_rate` | → | `fixedBonusRate` |
| `account_number` | → | `accountNumber` |
| `status_id` | → | `statusId` |
| `created_at` | → | `createdAt` |
| `user_id` | → | `userId` |
| `type_id` | → | `typeId` |
| `institution_group` | → | `institutionGroup` |

## Benefits

1. **Zero Friction for New Fields**: Add field to backend, it automatically appears in correct case on frontend
2. **Clean Code**: Python code uses Python conventions, JavaScript code uses JavaScript conventions
3. **No Boilerplate**: No manual serialization/deserialization in controllers
4. **Consistent**: Works for all endpoints automatically
5. **Maintainable**: Single transformation logic, applies globally

## Performance Considerations

- **Overhead**: Minimal - JSON parsing/transformation only on response path
- **Caching**: Unaffected - middleware works on HTTP responses, not models
- **Nested Objects**: Recursively transforms all levels (arrays, nested objects)

## Future Extensibility

The middleware pattern is extensible for other transformations:
- Field filtering based on user permissions
- Response envelope standardization
- API versioning transformations
- Nullable field handling

## Related Documentation

- [Pydantic Alias Configuration](https://docs.pydantic.dev/latest/concepts/json_schema/#schema-from-property-names)
- [FastAPI Middleware](https://fastapi.tiangolo.com/tutorial/middleware/)
- [Starlette Middleware](https://www.starlette.io/middleware/)

## Troubleshooting

### Frontend receives snake_case fields
- Likely cause: Middleware not registered in `app/main.py`
- Solution: Verify `app.add_middleware(SnakeToCamelCaseMiddleware)` is called

### CORS errors on responses
- Likely cause: Middleware added AFTER CORS middleware
- Solution: Ensure SnakeToCamelCaseMiddleware is added BEFORE CORS

### Some fields not transforming
- Likely cause: Non-JSON response (e.g., file download)
- Expected behavior: Middleware skips non-JSON responses (checks content-type header)

## Summary

This architecture solves the naming convention problem at the API boundary layer, allowing both backend and frontend to use their respective language idioms without friction. It's a one-time investment that scales with your growing codebase.
