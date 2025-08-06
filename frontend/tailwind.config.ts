import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/presentation/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 토스 스타일의 초록색 메인 컬러 팔레트
        primary: {
          50: '#e6f7f1',
          100: '#ccefe3',
          200: '#99dfc7',
          300: '#66cfab',
          400: '#33bf8f',
          500: '#00B06B', // 메인 초록색 (토스 그린)
          600: '#008d56',
          700: '#006a41',
          800: '#00472b',
          900: '#002316',
          950: '#00120b',
        },
        // 그레이 스케일 (토스 스타일)
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d1d1d1',
          400: '#a6a6a6',
          500: '#737373',
          600: '#525252',
          700: '#3a3a3a',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // 시맨틱 컬러
        success: '#00B06B',
        warning: '#FFB800',
        error: '#FF5252',
        info: '#4B9EFF',
        // 배경색
        background: {
          DEFAULT: '#ffffff',
          secondary: '#f9fafb',
          tertiary: '#f3f4f6',
        },
        // 텍스트 색상
        text: {
          primary: '#191f28',
          secondary: '#4e5968',
          tertiary: '#8b95a1',
          disabled: '#b0b8c1',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-pretendard)',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'Helvetica Neue',
          'Segoe UI',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'Malgun Gothic',
          'sans-serif',
        ],
      },
      fontSize: {
        // 토스 타이포그래피 시스템
        'display-lg': ['3.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-md': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['2.5rem', { lineHeight: '1.3', fontWeight: '700' }],
        'heading-xl': ['2rem', { lineHeight: '1.4', fontWeight: '700' }],
        'heading-lg': ['1.75rem', { lineHeight: '1.4', fontWeight: '700' }],
        'heading-md': ['1.5rem', { lineHeight: '1.5', fontWeight: '700' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.5', fontWeight: '700' }],
        'heading-xs': ['1.125rem', { lineHeight: '1.5', fontWeight: '700' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      spacing: {
        // 토스 스페이싱 시스템 (4px 단위)
        '4.5': '1.125rem', // 18px
        '13': '3.25rem', // 52px
        '15': '3.75rem', // 60px
        '17': '4.25rem', // 68px
        '18': '4.5rem', // 72px
        '19': '4.75rem', // 76px
        '21': '5.25rem', // 84px
        '22': '5.5rem', // 88px
      },
      borderRadius: {
        // 토스 라운드 시스템
        'none': '0',
        'xs': '0.25rem', // 4px
        'sm': '0.375rem', // 6px
        'md': '0.5rem', // 8px
        'lg': '0.75rem', // 12px
        'xl': '1rem', // 16px
        '2xl': '1.25rem', // 20px
        '3xl': '1.5rem', // 24px
        'full': '9999px',
      },
      boxShadow: {
        // 토스 그림자 시스템
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'sm': '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 8px 0 rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 16px 0 rgba(0, 0, 0, 0.10)',
        'xl': '0 16px 32px 0 rgba(0, 0, 0, 0.12)',
        '2xl': '0 24px 48px 0 rgba(0, 0, 0, 0.14)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        // 토스 스타일 애니메이션
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'scale-up': 'scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-gentle': 'bounce-gentle 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'scale-up': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      transitionTimingFunction: {
        'toss': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      // 모바일 safe area 지원
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      margin: {
        'safe': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config