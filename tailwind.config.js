/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./stores/**/*.{js,ts,jsx,tsx}",
        "./views/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['Space Mono', 'monospace'],
                display: ['Orbitron', 'sans-serif'],
            },
            colors: {
                matrix: {
                    green: '#22d3ee',
                    cyan: '#00F0FF',
                    lime: '#CCFF00',
                    dark: '#0D2B12',
                    black: '#000000'
                }
            },
            animation: {
                'flicker': 'flicker 0.15s infinite',
                'spin-slow': 'spin 10s linear infinite',
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                flicker: {
                    '0%': { opacity: '0.97' },
                    '100%': { opacity: '1' }
                }
            }
        },
    },
    plugins: [],
}
