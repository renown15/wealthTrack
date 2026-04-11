# Share Sale — Fix Plan

**Status:** In progress  
**Started:** 2026-04-11  
**Branch:** master

---

## Background

First share sale transaction was recorded but had multiple issues. This document tracks
all fixes required and the design of the new EventGroup persistence layer.

---

## Issues Found (confirmed by DB query)

| # | Issue | Root cause |
|---|---|---|
| 1 | Share Sale event shows £6,038 | `formatValue()` applies GBP to all non-attribute events — value is shares count, not £ |
| 2 | No Balance Update on shares account | Service never wrote one — portfolio balance query only reads "Balance Update" events |
| 3 | Cash account balance unchanged | Deposit event written but portfolio only reads Balance Update events |
| 4 | Tax liability shows no balance | Liability event + encumbrance attr written, but no Balance Update event |
| 5 | No way to view sale summary later | Transaction detail not persisted — lost after API response |

---

## Design: AccountEventAttributeGroup

A generic ledger that maps any arbitrary set of events and attributes to a named group.
Reusable beyond share sales.

### New tables

**`AccountEventAttributeGroup`**
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → UserProfile | |
| type_id | FK → ReferenceData | classkey='event_group_type', e.g. 'Share Sale' |
| created_at | DateTime | |
| updated_at | DateTime | |

**`AccountEventAttributeGroupMember`**
| Column | Type | Notes |
|---|---|---|
| id | PK | |
| group_id | FK → AccountEventAttributeGroup | |
| account_event_id | nullable FK → AccountEvent | |
| account_attribute_id | nullable FK → AccountAttribute | |

### ReferenceData seed (migration 038)
- `classkey='event_group_type'`, `referencevalue='Share Sale'`

---

## What share_sale_service writes per transaction

| Step | Table | Notes |
|---|---|---|
| 1 | AccountEvent | Share Sale on shares account (shares count) |
| 2 | AccountAttribute | number_of_shares updated to remaining |
| 3 | AccountEvent | Balance Update on shares account (remaining value = 0.00 if all sold) |
| 4 | AccountEvent | Deposit on cash account (proceeds in £) |
| 5 | AccountEvent | Balance Update on cash account (old balance + proceeds) |
| 6 | AccountEvent | Liability on tax account (CGT in £) |
| 7 | AccountEvent | Balance Update on tax account (old balance + CGT) |
| 8 | AccountEventAttributeGroup | One group row linking all of the above |
| 8a | AccountEventAttributeGroupMember | member for event from step 1 |
| 8b | AccountEventAttributeGroupMember | member for attr from step 2 |
| 8c | AccountEventAttributeGroupMember | member for event from step 3 |
| 8d | AccountEventAttributeGroupMember | member for event from step 4 |
| 8e | AccountEventAttributeGroupMember | member for event from step 5 |
| 8f | AccountEventAttributeGroupMember | member for event from step 6 |
| 8g | AccountEventAttributeGroupMember | member for event from step 7 |

Remove: encumbrance attribute update (step 5 in old service) — replaced by Balance Update event.

---

## New API endpoint

```
GET /accounts/{account_id}/share-sales
```

Returns list of share sale groups for a given shares account, joining back through
`AccountEventAttributeGroupMember` → `AccountEvent` / `AccountAttribute` to reconstruct
the full transaction detail:

```json
[
  {
    "id": 1,
    "soldAt": "2026-04-11T10:09:29",
    "sharesSold": "6038",
    "salePricePerSharePence": "1345",
    "purchasePricePerSharePence": "925",
    "proceeds": "92381.40",
    "capitalGain": "...",
    "cgt": "7305.98",
    "remainingShares": "0",
    "cashAccountId": 33,
    "cashAccountName": "Premier Joint Account",
    "cashNewBalance": "...",
    "taxAccountId": 44,
    "taxAccountName": "Tax Liability - 2026/27",
    "taxNewBalance": "7305.98"
  }
]
```

---

## Frontend changes

### AccountEventsModal.vue
- `formatValue()`: skip GBP formatting for `eventType === 'Share Sale'` — display as plain number (shares count)

### AccountHub.vue
- `handleShareSold`: after `closeShareSaleModal()` + `loadPortfolio()`, call `openEventsModal(currentAccountId.value, accountName, 'Shares')` so events modal opens showing all new events

### ShareSaleModal.vue
- Add a "View Sales" section / tab (when `accountType === 'Shares'`) that calls the new endpoint and displays historical sales
- Each sale row expandable to show full breakdown

---

## Implementation order

- [x] Identify issues (DB queries confirmed)
- [ ] Migration 038: tables + ReferenceData seed
- [ ] Models: AccountEventAttributeGroup, AccountEventAttributeGroupMember
- [ ] Repository: EventGroupRepository (create_group, add_member, get_groups_for_account)
- [ ] AccountEventRepository: add `get_latest_balance_update(account_id, user_id)`
- [ ] Rewrite share_sale_service: Balance Updates on all 3 accounts, create group, members
- [ ] Schema: ShareSaleSummaryResponse
- [ ] Controller: GET /accounts/{id}/share-sales
- [ ] ApiService: add `getShareSaleHistory(accountId)`
- [ ] Frontend: fix formatValue for Share Sale events
- [ ] Frontend: fix handleShareSold to open events modal
- [ ] Frontend: ShareSaleModal view mode showing history
- [ ] make pr-check

---

## Notes

- Old encumbrance approach removed — tax liability account balance IS the CGT owed
- `get_latest_balance_update` needed to correctly calculate running balances for cash and tax accounts
- EventGroup is generic and reusable for future multi-account transactions
