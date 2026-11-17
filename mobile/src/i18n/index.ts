import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import fr from './locales/fr.json';

const LANGUAGE_STORAGE_KEY = 'depance_language';

function getDeviceLanguage(): 'en' | 'fr' {
    try {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en';
        const code = locale.split(/[-_]/)[0]?.toLowerCase();
        return code === 'fr' ? 'fr' : 'en';
    } catch {
        return 'en';
    }
}

const resources = {
    en: { translation: en },
    fr: { translation: fr },
};

if (!i18n.isInitialized) {
    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: getDeviceLanguage(),
            fallbackLng: 'en',
            supportedLngs: ['en', 'fr'],
            interpolation: {
                escapeValue: false,
            },
            compatibilityJSON: 'v4',
        });
}

export async function hydrateLanguage(): Promise<void> {
    try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'en' || saved === 'fr') {
            if (i18n.language !== saved) {
                await i18n.changeLanguage(saved);
            }
        }
    } catch {
        // Fallback silently to device locale
    }
}

export async function setAppLanguage(lng: string): Promise<void> {
    const normalized = lng.startsWith('fr') ? 'fr' : 'en';
    await i18n.changeLanguage(normalized);
    try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    } catch {
        // Ignore storage write errors
    }
}

export default i18n;
