import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
  presets: [presetUno()],
  safelist: [
    'btn-icon-edit',
    'btn-icon-delete',
    'btn-pill-primary',
    'max-w-md',
    'min-h-screen',
    'flex',
    'items-center',
    'justify-center',
  ],
  theme: {
    colors: {
      primary: '#0f4cfc',
      'primary-dark': '#0b3cdd',
      accent: '#38bdf8',
      surface: '#f5f7fb',
      card: '#ffffff',
      border: '#e5ecff',
      muted: '#64748b',
      'text-dark': '#111827',
    },
    fontFamily: {
      sans: 'Space Grotesk, Inter, system-ui, sans-serif',
      display: 'Space Grotesk, Inter, system-ui, sans-serif',
    },
    boxShadow: {
      card: '0 28px 60px rgba(15, 23, 42, 0.15)',
      'card-hover': '0 20px 45px rgba(15, 23, 42, 0.08)',
    },
  },
  shortcuts: {
    // App shell (index.html)
    'app-shell': 'min-h-screen flex flex-col font-sans',
    'blue-banner': 'bg-gradient-to-r from-primary to-primary-dark py-4 px-6',
    'banner-container': 'max-w-[1200px] mx-auto flex justify-between items-center',
    'brand-stack': 'flex flex-col',
    'logo': 'm-0 text-white text-xl font-bold tracking-wide',
    'tagline': 'm-0 text-white/70 text-xs tracking-[0.25em] uppercase',
    'nav': 'flex items-center gap-3',
    'nav-link': 'px-4 py-2 rounded-md text-white/90 no-underline text-xs font-semibold tracking-wider uppercase hover:bg-white/10 transition-all',
    'main': 'flex-1',
    'main-inner': 'max-w-[1200px] mx-auto py-6 px-4',
    'footer-inner': 'max-w-[1200px] mx-auto py-4 px-6 text-center text-muted text-sm',

    // Buttons
    'btn': 'inline-flex items-center justify-center gap-2 rounded-md border-1.5 border-white/50 px-5 py-2.5 text-xs font-semibold tracking-widest uppercase cursor-pointer transition-opacity hover:opacity-90',
    'btn-primary': 'btn bg-primary text-white',
    'btn-secondary': 'btn bg-transparent text-white',
    'btn-modal-secondary': 'inline-flex items-center justify-center gap-2 rounded-md border-1.5 border-gray-300 px-5 py-2.5 text-xs font-semibold tracking-widest uppercase cursor-pointer transition-opacity hover:opacity-90 bg-gray-100 text-text-dark hover:bg-gray-200',
    'btn-danger': 'btn bg-red-500/90 text-white border-red-400 hover:bg-red-500',
    'btn-add': 'btn bg-primary text-white border-primary shadow-[0_12px_30px_rgba(15,76,252,0.4)] hover:translate-y-[-1px]',
    'btn-link': 'border-none bg-transparent text-primary font-semibold cursor-pointer',
    'btn-icon-edit': 'inline-flex items-center justify-center w-9 h-9 text-lg rounded-lg border-none cursor-pointer transition-all hover:scale-105 bg-blue-100 text-blue-600 hover:bg-blue-200',
    'btn-icon-delete': 'inline-flex items-center justify-center w-9 h-9 text-lg rounded-lg border-none cursor-pointer transition-all hover:scale-105 bg-red-100 text-red-600 hover:bg-red-200',
    'btn-pill-primary': 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border-none cursor-pointer transition-all hover:scale-105 bg-blue-100 text-blue-600 hover:bg-blue-200',
    'btn-close': 'bg-transparent border-none text-2xl cursor-pointer text-muted hover:text-text-dark',

    // Layout
    'page-view': 'min-h-screen bg-surface px-6 py-4 pb-16 flex flex-col items-center gap-6',
    'hub-header-card': 'w-[1600px] rounded-[24px] overflow-hidden shadow-card',
    'hub-content-card': 'w-[1600px] bg-card rounded-[24px] overflow-visible shadow-card',

    // Header panel (blue gradient header)
    'header-panel': 'bg-gradient-to-br from-primary to-primary-dark p-10 flex flex-col gap-8',
    'header-top': 'flex justify-between items-center flex-wrap gap-4',
    'header-title': 'm-0 text-white text-3xl font-bold',
    'header-subtitle': 'mt-1 text-white/90 text-base',
    'header-actions': 'flex gap-3',

    // Stats grid
    'stats-grid': 'flex gap-5',
    'stat-card': 'flex-1 bg-blue-500/35 rounded-xl p-6 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]',
    'stat-label': 'm-0 text-[0.7rem] tracking-[0.35em] uppercase text-white/80 font-medium',
    'stat-value': 'mt-2 text-2xl font-bold',

    // Table
    'table-wrap': 'rounded-xl border border-border',
    'data-table': 'border-collapse bg-card table-auto w-full',
    'table-header': 'text-sm tracking-[0.3em] uppercase text-muted whitespace-nowrap',
    'table-cell': 'p-4 border-b border-border text-text-dark whitespace-nowrap',
    'table-row-hover': 'hover:bg-blue-50',
    'actions-col': 'flex justify-end gap-2',

    // Institutions list
    'institutions-section': 'mt-8',
    'section-title': 'm-0 mb-4 text-muted tracking-[0.25em] uppercase text-sm font-semibold',
    'list-container': 'rounded-2xl border border-border overflow-hidden',
    'list-item': 'p-4 flex justify-between items-center border-b border-border last:border-b-0',
    'list-item-name': 'font-semibold text-text-dark',

    // Modal
    'modal-overlay': 'fixed inset-0 grid place-items-center bg-slate-900/45 backdrop-blur-sm z-1000',
    'modal-content': 'w-[min(640px,90vw)] max-h-[90vh] bg-white rounded-[14px] shadow-[0_30px_90px_rgba(15,23,42,0.25)] flex flex-col overflow-hidden outline-none',
    'modal-content--small': 'w-[min(420px,90vw)]',
    'modal-content--medium': 'w-[min(640px,90vw)]',
    'modal-content--large': 'w-[min(900px,95vw)]',
    'modal-header': 'p-4 px-5 border-b border-slate-200/70 flex justify-between items-center',
    'modal-title': 'm-0 text-xl font-semibold text-text-dark',
    'modal-body': 'p-5 overflow-y-auto',
    'modal-footer': 'p-4 px-5 border-t border-slate-200/70 flex gap-3 justify-end flex-wrap',

    // Form
    'form-group': 'mb-4',
    'form-label': 'block mb-2 font-medium text-text-dark text-sm',
    'form-input': 'w-full p-3 border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
    'form-select': 'form-input appearance-none bg-white',

    // States
    'error-banner': 'bg-red-100 border-l-4 border-red-400 rounded-xl p-4 text-red-800 mb-4 flex justify-between items-center',
    'loading-state': 'bg-card rounded-2xl p-12 text-center shadow-card-hover mb-4',
    'empty-state': 'bg-card rounded-2xl p-12 text-center shadow-card-hover mb-4',
    'empty-icon': 'text-5xl mb-4',
    'empty-title': 'm-0 mb-1 text-text-dark',
    'empty-text': 'm-0 text-muted',
    'spinner': 'w-12 h-12 rounded-full border-5 border-blue-200 border-l-primary animate-spin',
  },
});
