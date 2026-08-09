/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#07324A',
                    50: '#EAF1F5',
                    100: '#D5E3EA',
                    200: '#ABC7D5',
                    300: '#78A2B7',
                    400: '#1D5372',
                    500: '#0B405C',
                    600: '#07324A',
                    700: '#062B40',
                    800: '#052233',
                    900: '#031822',
                },
                accent: {
                    DEFAULT: '#DDA822',
                    50: '#FCF5E3',
                    100: '#FAEBC5',
                    200: '#F5D98C',
                    300: '#F0C24C',
                    400: '#E7B52F',
                    500: '#DDA822',
                    600: '#CC9A19',
                    700: '#B68816',
                    800: '#8E6910',
                    900: '#654A0B',
                },
                warning: '#CC9A19',
                error: '#CA2B2B',
                success: '#2C9664',
                info: '#1C6D9C',
                background: '#F5F7FA',
                foreground: '#152128',
                border: '#D8E0E9',
                muted: '#F2F5F7',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
