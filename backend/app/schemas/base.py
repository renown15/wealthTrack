"""
Base schema with automatic camelCase serialization for all API responses.
All schemas should inherit from this to automatically convert snake_case to camelCase.
"""
from pydantic import BaseModel, ConfigDict


def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase."""
    components = snake_str.split('_')
    # Keep the first component as is, capitalize the rest
    return components[0] + ''.join(x.title() for x in components[1:])


class BaseSchema(BaseModel):
    """
    Base schema that automatically converts all snake_case field names to camelCase
    in the JSON output, while keeping the Python model with snake_case internally.
    """
    model_config = ConfigDict(
        alias_generator=to_camel_case,
        populate_by_name=True,  # Accept both snake_case and camelCase in requests
    )

    def model_dump_json(self, **kwargs) -> str:  # type: ignore
        """Override to always use aliases in JSON output."""
        kwargs.setdefault('by_alias', True)
        return super().model_dump_json(**kwargs)
