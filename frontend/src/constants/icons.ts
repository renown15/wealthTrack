/**
 * Centralized icon definitions.
 * Import these instead of hardcoding symbols in templates.
 */
export const Icons = {
  edit: '✎',
  delete: '✕',
  save: '✓',
  cancel: '✕',
  sortAsc: '▲',
  sortDesc: '▼',
} as const;

export type IconName = keyof typeof Icons;
