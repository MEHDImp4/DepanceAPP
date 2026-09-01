# DepanceAPP Mobile

Application React Native basée sur Expo SDK 57 et Expo Router.

## Démarrage

1. Copier `.env.example` vers `.env` et renseigner l’URL HTTPS publique du serveur, ou l’adresse LAN pendant le développement.
2. Installer avec `npm install`.
3. Vérifier avec `npm run doctor` et `npm run typecheck`.
4. Lancer avec `npm run android` ou `npm run ios`.

Les refresh tokens sont stockés exclusivement dans SecureStore. Ne jamais les déplacer vers AsyncStorage, les logs ou un outil analytics.
