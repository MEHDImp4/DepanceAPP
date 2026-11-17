# DepanceAPP Mobile (`/mobile`)

Application mobile native Android et iOS pour **DepanceAPP**, construite avec **Expo**, **React Native**, **TypeScript strict**, **Expo Router**, **TanStack React Query**, **Zustand** et **Axios**.

Elle reproduit fidèlement les écrans, comportements métier, calculs, traductions (FR/EN), thèmes (Dark OLED / Light) et contrats API de l'application web (`/client`), en communiquant directement avec le backend Express (`/server`) existant.

---

## Prérequis

- Node.js 20+ et npm
- Backend DepanceAPP (`/server`) démarré et accessible sur le réseau
- [Expo Go](https://expo.dev/go) ou un émulateur Android / simulateur iOS (ou [EAS CLI](https://docs.expo.dev/eas/) pour les builds natifs)

---

## Installation

```bash
cd mobile
npm install
cp .env.example .env
```

---

## Configuration API (`EXPO_PUBLIC_API_URL`)

Le mobile ne doit pas utiliser `/api` en URL relative ni supposer que `localhost` pointe vers le poste hôte sur Android ou appareil physique.

Éditer `/mobile/.env` selon votre environnement :

| Environnement | Valeur de `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Émulateur Android (backend sur le même PC) | `http://10.0.2.2:3000/api` |
| Simulateur iOS (backend sur le même Mac) | `http://localhost:3000/api` |
| Appareil physique (même réseau Wi-Fi) | `http://<IP_LOCALE_PC>:3000/api` |
| Production (HTTPS obligatoire) | `https://votre-domaine.com/api` |

> **Note CORS** : Sur `/server`, les requêtes natives iOS/Android sans en-tête `Origin` sont autorisées par la configuration CORS actuelle (`if (!origin) return callback(null, true);`). Aucun secret serveur n'est embarqué dans le bundle mobile.

---

## Lancement en développement

Depuis la racine du dépôt :

```bash
npm run mobile
```

Ou depuis `/mobile` :

```bash
npm start          # Ouvre Expo DevTools (QR code Expo Go)
npm run android    # Lance sur émulateur / appareil Android
npm run ios        # Lance sur simulateur / appareil iOS (macOS)
npm run web        # Aperçu web Expo Router
```

---

## Authentification et persistance de session

Le backend `/server` émet des JWT signés dans des cookies `HttpOnly` (`token` et `refreshToken`) avec rotation atomique sur `/api/auth/refresh`.

Sur mobile (`mobile/src/lib/token-storage.ts` et `mobile/src/lib/axios.ts`) :
- Les cookies de session (`token`, `refreshToken`) reçus via `Set-Cookie` sont persistés de façon chiffrée dans **Expo SecureStore** (Android Keystore / iOS Keychain), jamais dans `AsyncStorage`.
- À chaque requête sortante, les jetons sont hydratés et injectés en `Authorization: Bearer <token>` (supporté par `server/src/middleware/authMiddleware.ts`) et `Cookie` (supporté par `/api/auth/refresh` et `/api/auth/logout`), tout en conservant `withCredentials: true`.
- En cas d'erreur `401` (`AUTH_TOKEN_MISSING`, `ACCESS_TOKEN_EXPIRED`, `ACCESS_TOKEN_INVALID`), l'intercepteur Axios met les requêtes concurrentes en file d'attente, exécute un unique `POST /auth/refresh`, sauvegarde la paire rotative et rejoue les appels.
- À la déconnexion (`POST /auth/logout`) ou en cas d'échec du refresh, SecureStore et le cache React Query sont intégralement purgés.

---

## Vérifications et Tests

```bash
cd mobile
npm run typecheck   # Vérification TypeScript stricte (tsc --noEmit)
npm test            # Suite Jest (conversions, stores, refresh concurrent, composants UI)
```

---

## Builds Android et iOS (EAS Build)

La configuration des profils (`development`, `preview`, `production`) se trouve dans `mobile/eas.json`.

```bash
npm install -g eas-cli
eas login

# APK Android installable directement (profil preview)
cd mobile
EXPO_PUBLIC_API_URL=https://votre-domaine.com/api eas build -p android --profile preview

# Build iOS (simulateur ou App Store / TestFlight)
EXPO_PUBLIC_API_URL=https://votre-domaine.com/api eas build -p ios --profile production

# Build Android App Bundle (.aab) pour Google Play
EXPO_PUBLIC_API_URL=https://votre-domaine.com/api eas build -p android --profile production
```
