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
                    DEFAULT: '#0B3D91',
                    50: '#E8EDF5',
                    100: '#C5D2E8',
                    200: '#9FB5D9',
                    300: '#7898CA',
                    400: '#527BBB',
                    500: '#0B3D91',
                    600: '#093174',
                    700: '#072557',
                    800: '#05193A',
                    900: '#020C1D',
                },
                accent: {
                    DEFAULT: '#0FA3A3',
                    50: '#E6F7F7',
                    100: '#CCEFEF',
                    200: '#99DFDF',
                    300: '#66CFCF',
                    400: '#33BFBF',
                    500: '#0FA3A3',
                    600: '#0C8282',
                    700: '#096262',
                    800: '#064141',
                    900: '#032121',
                },
                warning: '#FFB020',
                error: '#D92D20',
                success: '#12B76A',
                background: '#F8FAFC',
                foreground: '#0F1724',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
