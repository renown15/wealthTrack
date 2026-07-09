import type { PortfolioItem } from '@models/WealthTrackDataModels';

/**
 * Cost + prediction helpers for the Outgoings budget: annualised cost per
 * renewal cadence, and predicted annual/monthly cost per outgoing using
 * Provision projections (average of historic actuals) while respecting the
 * Outgoing End Date (ended items drop out; items ending within the next
 * 12 months are prorated).
 */

// Number of payments per year for each renewal type. One-off is non-recurring
// (excluded from recurring totals); a missing type is treated as monthly for
// backward compatibility with outgoings recorded before renewal types existed.
const PAYMENTS_PER_YEAR: Record<string, number> = {
  Monthly: 12,
  Quarterly: 4,
  Termly: 3,
  Annually: 1,
  'One-off': 0,
};

export function paymentsPerYear(renewalType: string | null | undefined): number {
  if (!renewalType) return 12;
  return PAYMENTS_PER_YEAR[renewalType] ?? 12;
}

/** Annualised cost of an outgoing = cost per period × periods per year. */
export function annualCost(item: PortfolioItem): number {
  const cost = parseFloat(item.account.monthlyCost ?? '');
  if (isNaN(cost)) return 0;
  return cost * paymentsPerYear(item.account.renewalType);
}

/** Parse a DD/MM/YYYY date (the API's attribute date format). */
export function parseUkDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Per-period cost used for prediction: projection for Provision items, else the fixed cost. */
export function predictedPeriodCost(item: PortfolioItem, projectedCost?: string): number {
  if (item.account.costingMethod === 'Provision' && projectedCost !== undefined) {
    const projected = parseFloat(projectedCost);
    if (!isNaN(projected)) return projected;
  }
  const fixed = parseFloat(item.account.monthlyCost ?? '');
  return isNaN(fixed) ? 0 : fixed;
}

/**
 * Predicted cost of an outgoing over the next 12 months.
 * Returns 0 once the end date has passed; prorates when it ends mid-year.
 */
export function predictedAnnualCost(item: PortfolioItem, projectedCost?: string): number {
  const annual = predictedPeriodCost(item, projectedCost)
    * paymentsPerYear(item.account.renewalType);
  const endDate = parseUkDate(item.account.outgoingEndDate);
  if (!endDate) return annual;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilEnd = (endDate.getTime() - Date.now()) / msPerDay;
  if (daysUntilEnd <= 0) return 0;
  if (daysUntilEnd >= 365) return annual;
  return annual * (daysUntilEnd / 365);
}

/** Sum predicted annual cost over a set of outgoings; projections keyed by account id. */
export function computePredictedAnnualTotal(
  items: PortfolioItem[],
  projections: Record<number, string>,
): number {
  return items.reduce(
    (total, item) => total + predictedAnnualCost(item, projections[item.account.id]),
    0,
  );
}
