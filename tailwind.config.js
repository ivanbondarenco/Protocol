/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'accent-neon': 'var(--accent-neon)',
                'bg-void': 'var(--bg-void)',
                'bg-carbon': 'var(--bg-carbon)',
                'accent-alert': 'var(--accent-alert)',
                'voidblack': 'var(--bg-void)', // Alias for existing code
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Stitch font
            },
            borderRadius: {
                'none': '0px', // Strict sharp corners as requested for "ProgressBar"
            }
        },
    },
    plugins: [],
}
