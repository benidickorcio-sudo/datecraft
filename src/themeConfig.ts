export interface ThemeOption {
    id: string;
    name: string;
    bg: string;
    card: string;
    text: string;
    subText: string;
    border: string;
    accent: string;
    radius: string;
}

export const aestheticThemes: ThemeOption[] = [
    {
        id: 'sakura',
        name: 'Sakura Petal 🌸',
        bg: 'linear-gradient(135deg, #FFF0F3 0%, #FFE4E8 50%, #FFD1DC 100%)',
        card: 'rgba(255, 255, 255, 0.75)', // Soft frosted glass wellness look
        text: '#5B3742',
        subText: '#9A737D',
        border: 'rgba(255, 255, 255, 0.9)',
        accent: '#F43F5E',
        radius: '2rem'
    },
    {
        id: 'oceanic',
        name: 'Deep Oceanic 🌊',
        bg: '#0F172A',
        card: '#1E293B',
        text: '#F8FAFC',
        subText: '#94A3B8',
        border: '#334155',
        accent: '#38BDF8',
        radius: '1rem'
    },
    {
        id: 'forest',
        name: 'Forest Canopy 🌲',
        bg: '#F3F6F4',
        card: '#EAEDE9',
        text: '#1B2E23',
        subText: '#4A6B5D',
        border: '#D2DDD5',
        accent: '#315C42',
        radius: '0.875rem'
    },
    {
        id: 'space',
        name: 'Cosmic Space 🌌',
        bg: '#08080C',
        card: '#12131C',
        text: '#E2E8F0',
        subText: '#64748B',
        border: '#1E2030',
        accent: '#A855F7',
        radius: '0.75rem'
    }
];