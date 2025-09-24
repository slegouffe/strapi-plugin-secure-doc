# Strapi Plugin Secure Doc

Un plugin Strapi personnalisé qui permet de sécuriser l'accès aux documents (PDF, images, etc.) en vérifiant la validité des liens et en générant des codes OTP (One-Time Password) par email lorsque les liens ont expiré.

## 🚀 Fonctionnalités

- **Vérification de liens sécurisés** : Validation de la validité des liens vers des ressources
- **Chiffrement AES-256-GCM** : Protection des données sensibles avec chiffrement robuste
- **Gestion des expirations** : Détection automatique des liens expirés
- **OTP par email** : Génération et vérification de codes à usage unique
- **Stockage Redis** : Utilisation de Redis pour le stockage temporaire des OTP
- **API REST** : Endpoints sécurisés pour la vérification et l'authentification

## 📋 Prérequis

- Strapi v5.x
- Redis (pour le stockage des OTP)
- Node.js 18+

## 🛠️ Installation

1. **Installer le plugin** :
```bash
npm install strapi-plugin-secure-doc
```

2. **Configuration Redis** :
Assurez-vous que Redis est configuré dans votre Strapi :
```javascript
// config/database.js
module.exports = {
  redis: {
    enabled: true,
    config: {
      connections: {
        default: {
          connection: {
            host: '127.0.0.1',
            port: 6379,
            db: 0,
          },
        },
      },
    },
  },
};
```

3. **Variables d'environnement** :
Ajoutez ces variables à votre fichier `.env` :
```env
# Clé de chiffrement (32 bytes en base64 ou hex)
OBFUSCATION_KEY=your-32-byte-encryption-key-here

# Secret JWT (optionnel)
JWT_SECRET=your-jwt-secret-here
```

## 🔧 Configuration

### Génération de la clé de chiffrement

Pour générer une clé de chiffrement sécurisée :

```bash
# Méthode 1 : Base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Méthode 2 : Hex
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📡 API Endpoints

### 1. Vérification de lien sécurisé

**GET** `/api/secure-doc/check/:email/:docId`

Vérifie la validité d'un lien sécurisé vers une ressource.

#### Paramètres
- `email` (string) : Email chiffré de l'utilisateur
- `docId` (string) : ID du document chiffré

#### Réponses

**200 OK** - Lien valide :
```json
{
  "url": "https://example.com/private/document.pdf"
}
```

**400 Bad Request** - Email invalide :
```json
{
  "error": "email"
}
```

**400 Bad Request** - Document expiré :
```json
{
  "error": "docId",
  "newToken": "encrypted-token-for-otp-verification"
}
```

### 2. Vérification OTP

**POST** `/api/secure-doc/verify-otp`

Vérifie le code OTP reçu par email.

#### Body
```json
{
  "email": "encrypted-email-token",
  "otp": "123456"
}
```

#### Réponses

**200 OK** - OTP valide :
```json
{
  "message": "OTP verified"
}
```

**400 Bad Request** - OTP invalide :
```json
{
  "error": "otp"
}
```

## 🔐 Sécurité

### Chiffrement
- **Algorithme** : AES-256-GCM
- **IV** : 96-bit aléatoire pour chaque chiffrement
- **Authentification** : Tag d'authentification intégré
- **Encodage** : Base64URL pour la transmission

### Gestion des expirations
- **TTL par défaut** : 1 heure
- **Stockage OTP** : Redis avec expiration automatique
- **Nettoyage** : Suppression automatique après utilisation

## 💡 Utilisation

### 1. Génération d'un lien sécurisé

```javascript
// Dans votre contrôleur Strapi
const cryptoService = strapi.plugin('secure-doc').services.cryptoService;

// Chiffrer l'email
const encryptedEmail = cryptoService.encrypt('user@example.com', {
  ttlSeconds: 3600 // 1 heure
});

// Chiffrer l'ID du document
const encryptedDocId = cryptoService.encrypt('document-123', {
  ttlSeconds: 3600
});

// Générer le lien
const secureLink = `/api/secure-doc/check/${encryptedEmail}/${encryptedDocId}`;
```

### 2. Vérification côté client

```javascript
// Vérifier le lien
const response = await fetch(`/api/secure-doc/check/${email}/${docId}`);

if (response.ok) {
  const data = await response.json();
  // Rediriger vers l'URL du document
  window.location.href = data.url;
} else {
  const error = await response.json();
  if (error.newToken) {
    // Demander l'OTP à l'utilisateur
    const otp = prompt('Entrez le code reçu par email');
    
    // Vérifier l'OTP
    const otpResponse = await fetch('/api/secure-doc/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        otp: otp
      })
    });
    
    if (otpResponse.ok) {
      // Retry la vérification du lien
      // ...
    }
  }
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  Secure Doc API  │───▶│     Redis       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Crypto Service │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │    OTP Service   │
                       └──────────────────┘
```

## 🧪 Tests

```bash
# Tests TypeScript
npm run test:ts:back

# Build du plugin
npm run build

# Mode développement
npm run watch
```

## 📝 Logs

Le plugin génère des logs pour :
- Tentatives de déchiffrement échouées
- Génération d'OTP
- Vérifications d'OTP
- Erreurs de configuration

## ⚠️ Notes importantes

1. **Clé de chiffrement** : Gardez votre `OBFUSCATION_KEY` secrète et sauvegardez-la
2. **Redis** : Assurez-vous que Redis est accessible et configuré correctement
3. **TTL** : Ajustez les durées d'expiration selon vos besoins de sécurité
4. **HTTPS** : Utilisez toujours HTTPS en production

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**Stéphane LEGOUFFE** - [slegouffe@gmail.com](mailto:slegouffe@gmail.com)

---

*Plugin développé pour l'ANCT - L'annuaire des Collectivités [https://collectivites.fr](https://collectivites.fr)*