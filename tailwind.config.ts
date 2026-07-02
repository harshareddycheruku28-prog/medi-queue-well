import type { Config } from 'tailwindcss';

export default <Config>{
  content: ['./src/**/*.{tsx,ts,jsx,js}', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A', // deep medical blue
        secondary: '#10B981', // teal for accents
        accent: '#F59E0B', // warm amber for highlights
        background: '#F3F4F6', // light gray background
        card: '#FFFFFF', // white cards (glassmorphism base)
        "card-glass": 'rgba(255,255,255,0.6)',
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
