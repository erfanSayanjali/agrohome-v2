// tailwind.config.ts
const config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        bgSec: 'var(--color-bgSec)',
        boxPr: 'var(--color-boxPr)',
        boxSec: 'var(--color-boxSec)',
        textPr: 'var(--color-textPr)',
        textSec: 'var(--color-textSec)',
        border: 'var(--color-border)',
        borderSec: 'var(--color-borderSec)',
        bgBox : 'var(--color-bgBox)'
      },
 
    },
  },
}

export default config