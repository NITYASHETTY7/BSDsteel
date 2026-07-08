import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:     'rgb(var(--color-background) / <alpha-value>)',
        panel:          'rgb(var(--color-panel) / <alpha-value>)',
        border:         'rgb(var(--color-border) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-muted':   'rgb(var(--color-text-muted) / <alpha-value>)',
        accent:         'rgb(var(--color-accent) / <alpha-value>)',
        secondary:      'rgb(var(--color-secondary) / <alpha-value>)',
        success:        'rgb(var(--color-success) / <alpha-value>)',
        warning:        'rgb(var(--color-warning) / <alpha-value>)',
        critical:       '#E11D48',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card:  'var(--shadow-card)',
        glow:  'var(--shadow-glow)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-in-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'slide-right':'slideInRight 0.25s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(208,41,54,0)' },
          '50%':      { boxShadow: '0 0 12px 3px rgba(208,41,54,0.25)' },
        },
      },
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        card:      'var(--shadow-card)',
        'card-lg': 'var(--shadow-card-hover)',
        glow:      'var(--shadow-glow)',
        'inner-sm':'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
