# Security Policy

## Before publishing or deploying

1. Deploy the committed Firestore and Storage rules:
   ```powershell
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
2. In Firebase Authentication, enable only the sign-in providers the app uses and configure authorised domains.
3. Restrict the Firebase Web API key to your production HTTP referrers and only the Firebase APIs required by this app.
4. Enable multi-factor authentication for every administrator account.
5. Enable Firebase App Check for Firestore, Authentication, and Storage before production enforcement.
6. Confirm that `config.js`, `config.json`, `.env*`, and Firebase debug logs are not staged for commit.

## Repository safeguards

- GitHub CodeQL runs on pull requests, pushes to `main`, and weekly.
- Local configuration files are ignored. Use `config.js.example` as the template.
- Firebase client configuration is not a password; the protection for Firestore data is Firebase Authentication, Security Rules, App Check, and API-key restrictions.
- Never place service-account keys, private keys, passwords, or access tokens in this repository.

## Reporting a vulnerability

Send security reports privately to the project administrator. Do not include sensitive details in public issues.
