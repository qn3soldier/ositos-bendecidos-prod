/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.25rem',
          lg: '2rem',
          xl: '2.5rem',
        },
      },
      colors: {
        /* LUXURY COLOR SYSTEM - Creative Director Approved */
        
        /* Core Brand Palette - Deepest luxury */
        'glossy-black': '#0a0a0a',
        'obsidian': '#1a1a1a',
        'carbon-fiber': '#2a2a2a',
        'midnight': '#050505',
        
        /* Golden Accents - Precious metal inspiration */
        'pure-gold': '#FFD700',
        'champagne-gold': '#F7E7CE',
        'rose-gold': '#E8B4B8',
        'antique-gold': '#D4AF37',
        
        /* Supporting Neutrals - Museum quality */
        'platinum': '#E5E4E2',
        'pearl-white': '#F8F6F0',
        'gunmetal': '#2C3539',
        'onyx': '#36454F',
        
        /* Legacy colors for backward compatibility */
        gold: {
          primary: '#FFD700',
          secondary: '#F5DEB3',
          neon: '#F9D13A',
        },
        blue: {
          heaven: '#87CEEB',
          light: '#ADD8E6',
        },
        green: {
          hope: '#90EE90',
        },
        cyber: {
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          electric: '#3b82f6',
          magenta: '#d946ef',
        },
        night: '#0b0b0f',
        ink: '#0f172a',
        muted: '#6b7280',
      },
      fontFamily: {
        /* PREMIUM FONT STACK - Creative Director Curated */
        primary: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        accent: ['Playfair Display', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Monaco', 'monospace'],
        
        /* Legacy fonts */
        serif: ['Playfair Display', 'Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        /* PREMIUM GRADIENTS - Mathematically perfect curves */
        'luxury-gradient': 'linear-gradient(135deg, #FFD700 0%, #1a1a1a 50%, #0a0a0a 100%)',
        'neon-glow': 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
        'glass-reflection': 'linear-gradient(145deg, rgba(255,215,0,0.1) 0%, rgba(26,26,26,0.9) 50%, rgba(10,10,10,1) 100%)',
        'golden-shimmer': 'linear-gradient(45deg, transparent 30%, rgba(255,215,0,0.3) 50%, transparent 70%)',
        'depth-shadow': 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
        
        /* Legacy gradients */
        radial: 'radial-gradient(var(--tw-gradient-stops))',
        conic: 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        auroraGold: 'radial-gradient(60% 60% at 20% 10%, rgba(255,215,0,0.18) 0%, rgba(0,0,0,0) 60%), radial-gradient(40% 40% at 70% 20%, rgba(255,215,0,0.12) 0%, rgba(0,0,0,0) 60%), radial-gradient(30% 30% at 50% 90%, rgba(255,215,0,0.10) 0%, rgba(0,0,0,0) 60%)',
      },
      animation: {
        /* CINEMA-QUALITY ANIMATIONS - Motion Specialist Crafted */
        'neon-pulse': 'neonPulse 2s ease-in-out infinite alternate',
        'logo-glow': 'logoGlow 3s ease-in-out infinite alternate',
        'float-up': 'floatUp 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'glass-ripple': 'glassRipple 0.6s ease-out',
        'neon-breathe': 'neonBreathe 2s ease-in-out infinite',
        'page-enter': 'pageEnter 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'page-exit': 'pageExit 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        
        /* Legacy animations */
        'wave': 'wave 3s ease-in-out infinite',
        'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        scanline: 'scanline 8s linear infinite',
        'float-slow': 'float-slow 10s ease-in-out infinite',
        aurora: 'aurora 12s ease-in-out infinite',
      },
      keyframes: {
        /* PREMIUM KEYFRAMES - 60fps Guaranteed */
        neonPulse: {
          'from': { 
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6)',
            filter: 'brightness(1)'
          },
          'to': { 
            boxShadow: '0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.8)',
            filter: 'brightness(1.2)'
          }
        },
        logoGlow: {
          '0%': { filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' },
          '50%': { filter: 'drop-shadow(0 0 40px rgba(255, 215, 0, 1)) brightness(1.1)' },
          '100%': { filter: 'drop-shadow(0 0 60px rgba(255, 215, 0, 0.6)) brightness(0.9)' }
        },
        floatUp: {
          'from': { 
            transform: 'translateY(0px) scale(1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          },
          'to': { 
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
          }
        },
        shimmer: {
          '0%': { 
            backgroundPosition: '-200% center',
            opacity: '0'
          },
          '50%': { opacity: '1' },
          '100%': { 
            backgroundPosition: '200% center',
            opacity: '0'
          }
        },
        glassRipple: {
          '0%': { 
            transform: 'scale(1)',
            opacity: '1',
            backgroundColor: 'rgba(255, 215, 0, 0.3)'
          },
          '100%': { 
            transform: 'scale(1.5)',
            opacity: '0',
            backgroundColor: 'rgba(255, 215, 0, 0)'
          }
        },
        neonBreathe: {
          '0%, 100%': { 
            opacity: '1',
            filter: 'brightness(1)'
          },
          '50%': { 
            opacity: '0.7',
            filter: 'brightness(1.2)'
          }
        },
        pageEnter: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95) translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1) translateY(0px)'
          }
        },
        pageExit: {
          '0%': {
            opacity: '1',
            transform: 'scale(1)'
          },
          '100%': {
            opacity: '0',
            transform: 'scale(1.05)'
          }
        },
        
        /* Legacy keyframes */
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)' },
        },
        scanline: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        aurora: {
          '0%': { opacity: '0.3', transform: 'translateX(-10%)' },
          '50%': { opacity: '0.6', transform: 'translateX(10%)' },
          '100%': { opacity: '0.3', transform: 'translateX(-10%)' },
        },
      },
      dropShadow: {
        /* PREMIUM SHADOWS - Museum Quality */
        'luxury-glow': '0 0 30px rgba(255, 215, 0, 0.5)',
        'neon-gold': '0 0 40px rgba(255, 215, 0, 0.6)',
        'depth': '0 8px 32px rgba(0, 0, 0, 0.6)',
        
        /* Legacy shadows */
        glow: '0 0 20px rgba(255, 215, 0, 0.35)',
      },
      boxShadow: {
        /* LUXURY BOX SHADOWS - Performance Optimized */
        'glass-primary': '0 32px 64px rgba(0, 0, 0, 0.9), 0 0 120px rgba(255, 215, 0, 0.15), inset 0 2px 4px rgba(255, 215, 0, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.6)',
        'glass-secondary': '0 16px 32px rgba(0, 0, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.1), inset 0 1px 2px rgba(255, 215, 0, 0.3)',
        'neon-gold': '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4)',
        'luxury-depth': '0 25px 50px rgba(0, 0, 0, 0.9), 0 0 100px rgba(255, 215, 0, 0.2)',
        
        /* Legacy shadows */
        'xl-glass': '0 10px 40px rgba(31, 38, 135, 0.15)',
        'neon': '0 0 30px rgba(124, 58, 237, 0.25), 0 0 50px rgba(249, 209, 58, 0.25)',
      },
    },
  },
}