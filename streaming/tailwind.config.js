/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    extend: {
      width: {
        
      },
      height: {
        '500' : '500px',
        '1500' : '1500px',
        '3000' : '3000px',
        '1/7' : '13%',
        'vh' : '100vh',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundColor: {
        'kakao': '#FEE500',
        'Naver': '#2DB400',
      },
    },
  },
  plugins: [],
};