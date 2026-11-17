# Matrice de Parité Web → Mobile (`DepanceAPP`)

Ce document recense chaque écran, composant, store, hook et contrat API présent dans `/client` et son équivalent exact dans `/mobile`.

## 1. Écrans et Navigation

| Fonctionnalité / Écran Web (`/client`) | Équivalent Mobile (`/mobile`) | Statut | Notes techniques d'adaptation |
| --- | --- | --- | --- |
| `pages/auth/Login.tsx` (`/login`) | `app/(auth)/login.tsx` | Migré 100 % | `KeyboardAvoidingView`, toggle `Eye`/`EyeOff`, `POST /auth/login` |
| `pages/auth/Register.tsx` (`/register`) | `app/(auth)/register.tsx` | Migré 100 % | Validation confirmation mot de passe, `POST /auth/register` |
| `components/auth/ProtectedRoute.tsx` | `app/_layout.tsx` + `app/(app)/_layout.tsx` | Migré 100 % | Hydratation SecureStore au démarrage + `GET /auth/profile` + redirection auto |
| `components/layout/MobileLayout.tsx` | `app/(app)/_layout.tsx` | Migré 100 % | Safe areas (`react-native-safe-area-context`) + fond OLED + halo subtil |
| `components/layout/BottomNav.tsx` | `src/components/layout/BottomNav.tsx` | Migré 100 % | Dock flottant (`Home`, `Transact`, `Accounts`, `Templates`, `More`), masquage labels `<380px` |
| `components/layout/MoreMenuDrawer.tsx` | `src/components/layout/MoreMenuDrawer.tsx` | Migré 100 % | Bottom sheet natif vers `Settings`, `Goals`, `Recurring` |
| `pages/Dashboard.tsx` (`/`) | `app/(app)/index.tsx` | Migré 100 % | Pull-to-refresh, `CapitalCard`, `RecentTransactions`, états loading/erreur |
| `pages/Transactions.tsx` (`/transactions`) | `app/(app)/transactions/index.tsx` | Migré 100 % | Pagination infinie (`limit=50`), groupement par date, recherche, filtre catégorie, FAB `+` |
| `pages/TransactionDetails.tsx` (`/transactions/:id`) | `app/(app)/transactions/[id].tsx` | Migré 100 % | Détails complets, `Repeat Transaction`, suppression avec confirmation |
| `pages/Accounts.tsx` (`/accounts`) | `app/(app)/accounts.tsx` | Migré 100 % | `Total Net Worth` converti, liste comptes, boutons Transfer & Add |
| `pages/Templates.tsx` (`/templates`) | `app/(app)/templates.tsx` | Migré 100 % | Mode édition, exécution 1-tap, validation compte par défaut, création/édition/suppression |
| `pages/RecurringTransactions.tsx` (`/recurring`) | `app/(app)/recurring.tsx` | Migré 100 % | Liste récurrences, date prochaine exécution (`date-fns`), suppression tactile accessible |
| `pages/Goals.tsx` (`/goals`) | `app/(app)/goals.tsx` | Migré 100 % | Grille d'objectifs, état vide + CTA, création/édition/suppression/ajout de fonds |
| `pages/Settings.tsx` (`/settings`) | `app/(app)/settings/index.tsx` | Migré 100 % | Carte profil, section Tools, Dark Mode, Langue EN/FR, Devise, Notifications, Account, Logout, Version |
| `pages/settings/ProfileInfo.tsx` (`/settings/profile`) | `app/(app)/settings/profile.tsx` | Migré 100 % | Avatar + fallback initiales hors ligne, username/email Read Only, devise éditable |
| `pages/settings/SecurityPrivacy.tsx` (`/settings/security`) | `app/(app)/settings/security.tsx` | Migré 100 % | Changement de mot de passe (`>=8` car.), historique des connexions (`formatDistanceToNow`) |

---

## 2. Composants UI et Modales

| Composant Web (`/client/src/components`) | Composant Mobile (`/mobile/src/components`) | Fidélité |
| --- | --- | --- |
| `dashboard/CapitalCard.tsx` | `dashboard/CapitalCard.tsx` | Échelle typographique dynamique (`24..46`), badge devise, point `Live Balance` |
| `dashboard/RecentTransactions.tsx` | `dashboard/RecentTransactions.tsx` | 5 dernières transactions, couleurs `#10B981`/`#EF4444`, navigation détail, état vide |
| `dashboard/StoryOverlay.tsx` | `dashboard/StoryOverlay.tsx` | Story plein écran 5 étapes branchée sur `useRecap()` |
| `accounts/AccountCard.tsx` | `accounts/AccountCard.tsx` | Icône selon type (`bank`/`credit`/`savings`/`cash`), couleur, solde, indicateur `Active` |
| `accounts/AddAccountModal.tsx` | `accounts/AddAccountModal.tsx` | Ajout, modification (solde verrouillé), 9 devises, 4 types, 18 couleurs, suppression par mot de passe |
| `accounts/TransferModal.tsx` | `accounts/TransferModal.tsx` | Sélecteurs source/destination, validation anti-doublon, montant, description |
| `transactions/AddTransactionModal.tsx` | `transactions/AddTransactionModal.tsx` | Toggle Expense/Income, symbole devise dynamique, création inline catégorie, `initialData` |
| `templates/AddTemplateModal.tsx` | `templates/AddTemplateModal.tsx` | Nom, montant, type, catégorie, compte par défaut, 18 icônes Lucide, 6 couleurs, suppression |
| `recurring/AddRecurringModal.tsx` | `recurring/AddRecurringModal.tsx` | Type, montant, intervalle, `DateTimePicker` natif (sérialisé ISO pour Zod), compte, catégorie |
| `goals/GoalCard.tsx` | `goals/GoalCard.tsx` | Progression %, barre animée Reanimated, calcul épargne mensuelle conseillée, `Add Funds` |
| `goals/CreateGoalDialog.tsx` | `goals/CreateGoalDialog.tsx` | Nom, objectif, progression actuelle, `DateTimePicker` deadline optionnelle, 6 couleurs, 12 emojis |
| `goals/AddMoneyDialog.tsx` | `goals/AddMoneyDialog.tsx` | Montant centré, boutons rapides `+10/+20/+50/+100`, sélection compte source |
| `ui/CategoryIcon.tsx` | `ui/CategoryIcon.tsx` | Résolution dynamique Lucide React Native + fallback emoji |
| `ui/PremiumSelect.tsx` | `ui/PremiumSelect.tsx` | Dropdown modal natif fidèle à `PremiumSelect` sans clipping Android/iOS |
| `ui/ProgressBar.tsx` | `ui/ProgressBar.tsx` | Barre animée `react-native-reanimated` |

---

## 3. Infrastructure, Logique Métier et API

| Module Web (`/client/src`) | Module Mobile (`/mobile/src`) | Notes |
| --- | --- | --- |
| `types/index.ts` | `types/index.ts` | Contrats TypeScript identiques + `LoginHistoryEntry`, `SpendingTrend` |
| `store/auth-store.ts` | `store/auth-store.ts` | Store Zustand identique (`user`, `isAuthenticated`, `isInitialized`, `setAuth`, `logout`) |
| `index.css` / `tailwind.config.js` | `constants/theme.ts` + `store/theme-store.ts` | Palette exacte Dark OLED (`#09090B`, `#18181B`, `#2563EB`) & Light (`#FAFAFA`, `#FFFFFF`), persistance AsyncStorage |
| `lib/axios.ts` | `lib/axios.ts` + `lib/token-storage.ts` | `EXPO_PUBLIC_API_URL`, `withCredentials: true`, stockage chiffré SecureStore, file d'attente 401 |
| `hooks/use-api.ts` + `hooks/api/useAccounts.ts` | `hooks/use-api.ts` | Tous les hooks React Query (`useSummary`, `useTransactions`, `useTransaction`, `useDeleteTransaction`, `useAccounts`, `useCreateAccount`, `useUpdateAccount`, `useDeleteAccount`, `useCreateTransfer`, `useTemplates`, `useCreateTemplate`, `useUpdateTemplate`, `useDeleteTemplate`, `useCategories`, `useCreateCategory`, `useRecurring`, `useCreateRecurring`, `useDeleteRecurring`, `useProcessRecurring`, `useGoals`, `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal`, `useUpdateProfile`, `useChangePassword`, `useLoginHistory`, `useSecurityAlerts`, `useRecap`, `useSpendingTrends`) |
| `hooks/use-currency.ts` | `hooks/use-currency.ts` | Taux `open.er-api.com`, `convertCurrency`, `formatCurrency`, `formatDecimal`, `getCurrencySymbol` |
| `i18n.ts` + `public/locales/{en,fr}` | `i18n/index.ts` + `i18n/locales/{en,fr}.json` | Traductions EN/FR complètes et détection/persistance langue |
