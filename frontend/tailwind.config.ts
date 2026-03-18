import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Exact Figma palette ───────────────────────────
        // Page / content background
        'page-bg': '#F2F2F7',
        // Sidebar
        'sidebar-bg': '#FFFFFF',
        'sidebar-border': '#E5E7EB',
        // Cards / panels
        'card-bg': '#FFFFFF',
        'card-border': '#E9ECEF',
        // Primary brand orange (VedaAI logo + active nav)
        'brand': '#E8531D',
        'brand-hover': '#D44417',
        'brand-light': '#FFF0EB',
        // CTA dark button (Create Assignment)
        'cta-bg': '#1A1A2E',
        'cta-hover': '#0D0D1F',
        // Navigation
        'nav-text': '#6B7280',
        'nav-text-active': '#E8531D',
        'nav-bg-active': '#F3F0FF',
        // Top header
        'header-bg': '#FFFFFF',
        'header-border': '#E9ECEF',
        // Text
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        // Inputs / forms
        'input-bg': '#FFFFFF',
        'input-border': '#D1D5DB',
        'input-focus': '#E8531D',
        // Badge – assignment count
        'badge-bg': '#E8531D',
        'badge-text': '#FFFFFF',
        // Status dots
        status: {
          pending: '#F59E0B',
          processing: '#3B82F6',
          completed: '#10B981',
          failed: '#EF4444',
        },
        // Difficulty
        difficulty: {
          'easy-bg': '#D1FAE5',
          'easy-text': '#065F46',
          'medium-bg': '#FEF3C7',
          'medium-text': '#92400E',
          'hard-bg': '#FEE2E2',
          'hard-text': '#991B1B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        dropdown: '0 4px 16px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
