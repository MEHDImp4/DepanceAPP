# Rapport de Tests et Vérifications — `/mobile`

## 1. Vérifications Automatisées Exécutées

| Vérification | Commande | Périmètre | Résultat |
| --- | --- | --- | --- |
| TypeScript strict (`/mobile`) | `cd mobile && npx tsc --noEmit` | Tous les fichiers `.ts` et `.tsx` de `app/` et `src/` | **PASS** (0 erreur) |
| Suite Jest (`/mobile`) | `cd mobile && npm test -- --no-cache` | 4 suites, 15 tests unitaires & composants | **PASS** (`4 passed, 4 total`, `15 passed, 15 total`) |
| Bundle Metro Android | `cd mobile && CI=1 npx expo export --platform android --output-dir /tmp/depance-export-check` | Compilation complète Expo Router + Hermes `.hbc` Android (4948 modules, 41 assets) | **PASS** (`entry-*.hbc` 8.6MB) |
| Bundle Metro iOS | `cd mobile && CI=1 npx expo export --platform ios --output-dir /tmp/depance-export-ios` | Compilation complète Expo Router + Hermes `.hbc` iOS (4843 modules, 37 assets) | **PASS** (`entry-*.hbc` 8.4MB) |
| Non-régression Client Web | `cd client && npm run test:run && npm run lint && npm run build` | Vitest (2 fichiers, 4 tests), ESLint, TypeScript + Vite build | **PASS** |
| Non-régression Backend | `cd server && npm run build:check` | TypeScript check (`tsc --noEmit`) | **PASS** |
| Intégrité Web & Backend | `git diff --stat client server` | Vérification absence de modification dans `/client` et `/server` | **PASS** (0 fichier modifié) |

---

## 2. Détail des Tests Jest (`/mobile/src/__tests__/`)

1. **`currency.test.ts` (4 tests)**
   - Identité de conversion lorsque les devises sont identiques ou les taux absents/inconnus.
   - Conversions croisées précises via base USD (`EUR -> USD`, `USD -> MAD`, `EUR -> MAD`).
   - Formatage décimal, monétaire et résolution de symbole (`getCurrencySymbol`, `formatDecimal`, `formatCurrency`).
   - Résolution des classes couleurs Tailwind (`bg-blue-500`, `bg-emerald-500`) et calcul `hexWithOpacity`.

2. **`auth-store.test.ts` (2 tests)**
   - Cycle complet d'authentification (`setAuth`, `logout`, `isAuthenticated`, `isInitialized`).
   - Mode OLED sombre par défaut (`#09090B`) et bascule `dark` ↔ `light` (`#FAFAFA`).

3. **`axios-refresh.test.ts` (5 tests)**
   - Parsing `Set-Cookie` multi-cookies contenant des virgules dans les attributs `Expires=Thu, ...`.
   - Détection de révocation / suppression de cookies (`token=;`, `Max-Age=0`, `Expires=Thu, 01 Jan 1970...`).
   - Persistance chiffrée et réhydratation après redémarrage simulé via `expo-secure-store` (mocké).
   - File d'attente sur requêtes `401` concurrentes : un seul appel `POST /auth/refresh`, rotation des tokens et ré-injection du nouveau `Bearer` token dans les requêtes rejouées.
   - Nettoyage automatique de `SecureStore` et déconnexion Zustand si `/auth/refresh` échoue.

4. **`components.test.tsx` (4 tests)**
   - Rendu de `CapitalCard` avec montant formaté et badge devise.
   - Rendu de `AccountCard` et propagation du clic.
   - Rendu de `GoalCard` (pourcentage, barre de progression) et déclenchement `Add Funds`, `Edit goal`, `Delete goal`.
   - Rendu de l'état vide de `RecentTransactions` (avec React Query).

---

## 3. Limitations Connues / Vérifications Restantes hors Environnement Linux

- **Tests sur appareils physiques / émulateurs** : Cet environnement de travail Linux headless ne dispose pas d'émulateur Android lancé, de simulateur iOS (macOS/Xcode requis), ni d'appareils physiques iOS/Android connectés. Les parcours UI interactifs, le rendu visuel sur écran réel, les sélecteurs natifs `DateTimePicker`, la gestion du clavier virtuel et le bouton Retour matériel Android devront être validés sur simulateur iOS / émulateur Android / Expo Go ou via une build EAS (`preview`).
- **Tests réseau en direct contre MariaDB** : Les tests d'authentification et de rafraîchissement dans `axios-refresh.test.ts` utilisent un adaptateur Axios simulé et un mock `expo-secure-store`. La vérification bout-en-bout contre une instance `/server` + MariaDB démarrée (inscription, connexion, redémarrage à froid, expiration 15m du token d'accès, création/suppression de transactions et synchronisation croisée Web ↔ Mobile) doit être effectuée avec le serveur actif.
- **Note sur les hooks natifs d'API sans écran dédié sur Web** : Comme dans `/client`, les hooks `useSecurityAlerts`, `useSpendingTrends`, `useRecap` et le composant `StoryOverlay` ont été migrés à l'identique dans `/mobile/src/`, sans ajouter de nouveaux écrans/boutons absents de l'interface web d'origine.
