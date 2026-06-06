/**
 * Family wealth management data models.
 * Types sourced from generated API spec — run 'make generate-api-types' after backend schema changes.
 */
import type { components } from '@/types/api.gen';

export type FamilyMember = components['schemas']['FamilyMemberResponse'];
export type Family = components['schemas']['FamilyResponse'];
export type UserSummary = components['schemas']['UserSummaryResponse'];
