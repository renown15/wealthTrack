"""
Migration script to clean up reference data entries with colons in class_key.
- Creates missing credential_type entries
- Remaps foreign key references
- Deletes colon entries
"""
import asyncio

from sqlalchemy import select, update

from app.database import async_session_maker
from app.models.account import Account
from app.models.account_attribute import AccountAttribute
from app.models.account_event import AccountEvent
from app.models.institution_security_credentials import InstitutionSecurityCredentials
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile


async def main() -> None:
    async with async_session_maker() as session:
        # Get all reference data
        result = await session.execute(select(ReferenceData))
        all_entries = {e.id: e for e in result.scalars().all()}

        # Separate colon and non-colon entries
        colon_entries = {e.id: e for e in all_entries.values() if ':' in e.class_key}
        clean_entries = {e.id: e for e in all_entries.values() if ':' not in e.class_key}

        print(f"Found {len(colon_entries)} entries with colons")
        print(f"Found {len(clean_entries)} clean entries")

        # Build mapping from colon entry ID to clean entry ID
        id_mapping: dict[int, int] = {}
        entries_to_create: list[tuple[str, str, int]] = []

        for colon_id, colon_entry in colon_entries.items():
            # Extract the base class_key (before the colon)
            base_class = colon_entry.class_key.split(':')[0]
            ref_value = colon_entry.reference_value

            # Find matching clean entry
            match = None
            for clean_entry in clean_entries.values():
                if clean_entry.class_key == base_class and clean_entry.reference_value == ref_value:
                    match = clean_entry
                    break

            if match:
                id_mapping[colon_id] = match.id
                print(f"  {colon_id} ({colon_entry.class_key}:{ref_value}) -> {match.id}")
            else:
                # Need to create this entry
                entries_to_create.append((base_class, ref_value, colon_id))
                print(f"  {colon_id} ({colon_entry.class_key}:{ref_value}) -> NEEDS CREATION")

        # Create missing entries
        for base_class, ref_value, old_id in entries_to_create:
            new_entry = ReferenceData(
                class_key=base_class,
                reference_value=ref_value,
                sort_index=0,
            )
            session.add(new_entry)
            await session.flush()
            id_mapping[old_id] = new_entry.id
            print(f"  Created {new_entry.id} ({base_class}:{ref_value})")

        print(f"\nID mapping: {id_mapping}")

        # Update all foreign key references
        tables_to_update = [
            (Account, 'type_id', 'accounts (type)'),
            (Account, 'status_id', 'accounts (status)'),
            (AccountEvent, 'type_id', 'account_events'),
            (AccountAttribute, 'type_id', 'account_attributes'),
            (InstitutionSecurityCredentials, 'type_id', 'credentials'),
            (UserProfile, 'type_id', 'user_profiles'),
        ]

        for old_id, new_id in id_mapping.items():
            for model, column, desc in tables_to_update:
                col = getattr(model, column)
                result = await session.execute(
                    update(model).where(col == old_id).values({column: new_id})
                )
                if result.rowcount > 0:
                    print(f"  Updated {result.rowcount} {desc}: {old_id} -> {new_id}")

        # Delete colon entries
        print("\nDeleting colon entries...")
        for colon_id in colon_entries.keys():
            entry = await session.get(ReferenceData, colon_id)
            if entry:
                await session.delete(entry)
                print(f"  Deleted {colon_id} ({entry.class_key})")

        # Commit all changes
        await session.commit()
        print("\nDone! All changes committed.")


if __name__ == "__main__":
    asyncio.run(main())
