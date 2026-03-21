import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

const fallbackResources = {
    en: {
        translation: {
            nav: {
                home: 'Home',
                transact: 'Transact',
                accounts: 'Accounts',
                templates: 'Templates',
                more: 'More',
                settings: 'Settings',
                goals: 'Goals',
                recurring: 'Recurring',
                more_options: 'More Options',
                dashboard: 'Dashboard'
            },
            dashboard: {
                total_capital: 'Total Capital',
                live_balance: 'Live Balance',
                recent_transactions: 'Recent Transactions'
            },
            common: {
                see_all: 'See All'
            },
            transactions: {
                uncategorized: 'Uncategorized'
            },
            settings: {
                currency_helper: 'This will update how values are displayed across the app.',
                change_password: 'Change Password',
                update_password: 'Update Password',
                login_history: 'Login History',
                security_notice: 'If you see suspicious activity, change your password immediately.'
            },
            auth: {
                current_password: 'Current Password',
                new_password: 'New Password'
            }
        }
    },
    fr: {
        translation: {
            nav: {
                home: 'Accueil',
                transact: 'Transaction',
                accounts: 'Comptes',
                templates: 'Modeles',
                more: 'Plus',
                settings: 'Parametres',
                goals: 'Objectifs',
                recurring: 'Recurrent',
                more_options: "Plus d'options",
                dashboard: 'Tableau de bord'
            },
            dashboard: {
                total_capital: 'Capital Total',
                live_balance: 'Solde en direct',
                recent_transactions: 'Transactions Recentes'
            },
            common: {
                see_all: 'Voir Tout'
            },
            transactions: {
                uncategorized: 'Aucune categorie'
            },
            settings: {
                currency_helper: "Cela mettra à jour la façon dont les valeurs sont affichées dans toute l'application.",
                change_password: 'Changer le mot de passe',
                update_password: 'Mettre à jour le mot de passe',
                login_history: 'Historique des connexions',
                security_notice: 'Si vous voyez une activité suspecte, changez immédiatement votre mot de passe.'
            },
            auth: {
                current_password: 'Mot de passe actuel',
                new_password: 'Nouveau mot de passe'
            }
        }
    }
};

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: fallbackResources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'fr'], // We can dynamically load this if needed, but defining here for now
        debug: true,
        detection: {
            order: ['navigator', 'localStorage', 'htmlTag'],
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        backend: {
            loadPath: '/locales/{{lng}}/translation.json?v=20260321',
            requestOptions: {
                cache: 'no-store',
            },
        }
    });

export default i18n;
