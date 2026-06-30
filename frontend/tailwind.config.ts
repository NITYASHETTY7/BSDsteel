import type { Config } from "tailwindcss";

const config: Config = {
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
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
