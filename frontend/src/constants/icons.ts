/**
 * Centralized icon definitions.
 * Import these instead of hardcoding symbols in templates.
 */
export const Icons = {
  edit: '✎',
  settings: '⚙︎', // gear, forced text presentation (avoids emoji rendering)
  delete: '✕',
  save: '✓',
  cancel: '✕',
  sortAsc: '▲',
  sortDesc: '▼',
  eye: '👁',
  info: 'ⓘ',
  upload: '⬆',
  download: '⬇',
  chevronDown: '▼',
  chevronRight: '▶',
  outOfScope: '⊘',
  restore: '↩︎', // return arrow, forced text presentation
} as const;

export type IconName = keyof typeof Icons;
