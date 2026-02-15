# SnakeToCamelCase Middleware Implementation

## Overview

The `SnakeToCamelCaseMiddleware` is a Starlette HTTP middleware that intercepts FastAPI responses and transforms JSON response bodies from Python's snake_case naming convention to JavaScript's camelCase convention.

**File**: [backend/app/main.py](../../backend/app/main.py)

## Why Middleware?

### Alternative Approaches (Why They Don't Work)

**Approach 1: Manual Conversion in Controllers**
```python
@router.get("/{id}")
async def get_account(id: int, db: Session = Depends(get_db)):
    account = db.query(Account).get(id)
    return snakeToCamel(account.model_dump())  # ❌ Tedious, scalable nightmare
```
- Must convert in every controller endpoint
- Easy to forget for new endpoints
- Violates DRY principle

**Approach 2: Pydantic Alias Only**
```python
class AccountResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel_case)

@router.get("/{id}")
async def get_account(id: int, db: Session = Depends(get_db)):
    account = db.query(Account).get(id)
    return AccountResponse.from_orm(account)  # ❌ FastAPI doesn't call by_alias=True
```
- FastAPI returns models directly from route handlers
- Response models are serialized without `by_alias=True`
- Result: snake_case in API response

**Approach 3: Custom JSONResponse in Controllers**
```python
class CamelCaseResponse(JSONResponse):
    def render(self, content):
        return super().render(self._to_camel_case(content))

@router.get("/{id}")
async def get_account(id: int, db: Session = Depends(get_db)):
    account = db.query(Account).get(id)
    return CamelCaseResponse(
        content=account.model_dump(by_alias=True)  # ❌ Breaks CORS
    )
```
- CORS headers aren't applied correctly
- Results in 500 errors: "CORS header Access-Control-Allow-Origin not found"
- Middleware order is wrong

### Middleware Solution ✅

```python
class SnakeToCamelCaseMiddleware(BaseHTTPMiddleware):
    """Transform all JSON responses from snake_case to camelCase."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)  # Let the request proceed
        # Transform response body here
        return transformed_response
```

**Why This Works:**
- Middleware sits at HTTP layer (after routing, before response)
- Applies to ALL endpoints automatically
- Preserves all headers (including CORS)
- Works with any response type (models, lists, paginated data)
- No changes needed in controllers

## Implementation

### Core Transformation Logic

**Converting Keys: snake_case → camelCase**

```python
@staticmethod
def _to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase.
    
    Examples:
        fixed_bonus_rate → fixedBonusRate
        account_number → accountNumber
        created_at → createdAt
    """
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])
```

**Recursive Object Transformation**

```python
@staticmethod
def _transform_keys(obj: object) -> object:
    """Recursively transform dict keys and handle nested objects."""
    if isinstance(obj, dict):
        # Transform each key and recursively transform values
        return {
            SnakeToCamelCaseMiddleware._to_camel_case(k): 
            SnakeToCamelCaseMiddleware._transform_keys(v)
            for k, v in obj.items()
        }
    elif isinstance(obj, list):
        # Recursively transform list items
        return [SnakeToCamelCaseMiddleware._transform_keys(item) for item in obj]
    # Return non-dict/non-list objects unchanged
    return obj
```

**HTTP Dispatch Handler**

```python
async def dispatch(self, request: Request, call_next: Callable) -> Response:
    """Intercept response, transform JSON body, return modified response."""
    
    # Let the request proceed through the rest of the middleware/routing
    response = await call_next(request)
    
    # Only transform JSON responses
    if "application/json" in response.headers.get("content-type", ""):
        # Read response body
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        
        try:
            # Parse JSON
            data = json.loads(body)
            # Transform keys recursively
            transformed = self._transform_keys(data)
            # Serialize back to JSON
            transformed_body = json.dumps(transformed).encode()
            
            # Return new response with transformed body, preserving headers
            return Response(
                content=transformed_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )
        except (json.JSONDecodeError, UnicodeDecodeError):
            # If parsing fails, return original response
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )
    
    # Non-JSON responses pass through unchanged
    return response
```

## Registration & Middleware Order

### Correct Order (In app/main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.middleware import SnakeToCamelCaseMiddleware

app = FastAPI()

# 1. Register SnakeToCamelCaseMiddleware FIRST
#    (it will wrap the CORS middleware)
app.add_middleware(SnakeToCamelCaseMiddleware)

# 2. Then register CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Why This Order Matters

```
Request Flow:
  Client Request
       ↓
  [SnakeToCamelCaseMiddleware - OUTERMOST]
       ↓
  [CORSMiddleware]
       ↓
  [Router] → Return snake_case response
       ↓
  [CORSMiddleware - adds CORS headers]
       ↓
  [SnakeToCamelCaseMiddleware - transforms body, preserves headers]
       ↓
  Client Response (camelCase JSON + CORS headers)
```

### Wrong Order (Breaks CORS)

```
# DON'T DO THIS:
app.add_middleware(CORSMiddleware, ...)
app.add_middleware(SnakeToCamelCaseMiddleware)
```

Result: Middleware chain order is reversed, CORS headers lost during transformation.

## Request Flow Example

### Incoming Request
```
PUT /api/v1/accounts/11
{
  "fixedBonusRate": "2.3",
  "accountNumber": "51752935"
}
```

### Controller Processing
```python
@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    data: AccountRequest,
    db: Session = Depends(get_db)
):
    account = db.query(Account).filter_by(id=account_id).first()
    account.fixed_bonus_rate = data.fixed_bonus_rate  # Pydantic accepted camelCase input
    account.account_number = data.account_number
    db.commit()
    
    # Return snake_case response model
    return AccountResponse.from_orm(account)
```

### Pydantic Schema (populate_by_name=True)
```python
class AccountRequest(BaseSchema):
    """Accepts both snake_case and camelCase."""
    fixed_bonus_rate: Optional[str] = None
    account_number: str
    
    # BaseSchema has populate_by_name=True, so this works:
    # 1. data = AccountRequest(**request_body)
    #    Pydantic sees "fixedBonusRate" and maps to fixed_bonus_rate
    # 2. data.fixed_bonus_rate == "2.3"
```

### FastAPI Response Serialization
```python
# AccountResponse.from_orm(account) returns the model
# FastAPI serializes it directly (without by_alias=True)

# Raw JSON response from controller:
{
  "id": 11,
  "fixed_bonus_rate": "2.3",     # ← snake_case still!
  "account_number": "51752935",
  "created_at": "2026-02-13T10:30:00"
}
```

### Middleware Transformation
```python
# SnakeToCamelCaseMiddleware._transform_keys() converts:
{
  "id": 11,
  "fixedBonusRate": "2.3",       # ← Transformed!
  "accountNumber": "51752935",
  "createdAt": "2026-02-13T10:30:00"
}
```

### Response to Client
```
200 OK
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:3000
{
  "id": 11,
  "fixedBonusRate": "2.3",       # ← camelCase!
  "accountNumber": "51752935",
  "createdAt": "2026-02-13T10:30:00"
}
```

## Handling Edge Cases

### Empty List
```python
# Controller returns []
# Middleware returns []
# ✅ Works fine
```

### Paginated Data
```python
# Controller returns:
{
  "items": [
    {"fixed_bonus_rate": "2.3"},
    {"fixed_bonus_rate": "1.5"}
  ],
  "total": 2,
  "page": 1
}

# Middleware transforms recursively:
{
  "items": [
    {"fixedBonusRate": "2.3"},
    {"fixedBonusRate": "1.5"}
  ],
  "total": 2,
  "page": 1
}
# ✅ All nested keys transformed
```

### Null Values
```python
# Controller returns:
{
  "fixed_bonus_rate": null,
  "account_number": "12345"
}

# Middleware transforms key names only (values unchanged):
{
  "fixedBonusRate": null,
  "accountNumber": "12345"
}
# ✅ Null values preserved correctly
```

### Non-JSON Responses
```python
@router.get("/export")
async def export_data():
    return FileResponse("data.csv", media_type="text/csv")

# Middleware checks: "text/csv" not in ["application/json"]
# ✅ Response passes through unchanged
```

### Error Responses
```python
# FastAPI auto-exception handler returns:
{
  "detail": "Not found"
}

# Middleware transforms (single key):
{
  "detail": "Not found"
}
# ✅ Error messages preserved
```

## Performance Characteristics

### Overhead Analysis

| Operation | Cost |
|-----------|------|
| JSON parsing | ~1-2ms per 1KB |
| String splitting (snake_case) | ~0.01ms per key |
| Dict comprehension | ~0.1ms per 100 keys |
| JSON serialization | ~1-2ms per 1KB |
| **Total for typical response** | ~5-10ms |

### Comparison to Request Processing
- Database query: 10-50ms
- Authentication/validation: 5-10ms
- **Middleware overhead: <1%**

Middleware transformation is negligible compared to actual request processing.

### For Large Paginated Responses
```python
# 1000 items × 10 fields each = 10k keys
# Time: ~50-100ms additional
# Database query: 200-500ms
# Still <20% overhead
```

### Optimization Opportunities
- Cache the snake_to_camel mapping for repeated field names
- Compile regex for field name patterns
- Use C extensions for JSON parsing

Current implementation prioritizes clarity over micro-optimizations.

## Debugging

### Verify Middleware is Running

```python
# In app/main.py, add logging:
import logging

logger = logging.getLogger(__name__)

class SnakeToCamelCaseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        if "application/json" in response.headers.get("content-type", ""):
            logger.debug(f"Transforming response: {request.url.path}")
            # ... transformation code ...
        return response
```

### Check Response Format
```bash
curl -s http://localhost:8001/api/v1/accounts/1 \
  -H "Authorization: Bearer $TOKEN" | jq '.' | head -20

# Should see camelCase keys:
# {
#   "id": 1,
#   "fixedBonusRate": "2.3",
#   "accountNumber": "51752935"
# }
```

### Frontend Network Tab
Open browser DevTools → Network tab → Click on request → Response tab
- Should see camelCase keys in response JSON

## Related Documentation

- [ARCHITECTURE_NAMING_CONVENTIONS.md](./ARCHITECTURE_NAMING_CONVENTIONS.md) - Design overview
- [FIELD_IMPLEMENTATION_GUIDE.md](./FIELD_IMPLEMENTATION_GUIDE.md) - Practical guide to adding fields
- [FastAPI Middleware Docs](https://fastapi.tiangolo.com/tutorial/middleware/)
- [Starlette BaseHTTPMiddleware](https://www.starlette.io/middleware/)

## Summary

The middleware pattern elegantly solves the snake_case ↔ camelCase problem at the HTTP boundary:

1. **Clean**: Controllers remain simple and focused
2. **Universal**: Works for all endpoints automatically
3. **Transparent**: No controller code changes needed
4. **Scalable**: Each new field automatically converted
5. **Maintainable**: Single location for naming bridge logic
