# Passkey + Password Authentication

## Overview
This project is a side-by-side demonstration of two authentication methods served by a single Node.js + Express backend:

- **Passkeys (WebAuthn)** powered by `@simplewebauthn/server`
- **Passwords** implemented entirely in the browser with zxcvbn-based strength

A landing screen (`/auth-choice.html`) lets users pick which flow to try. Every interaction (for both flows) is instrumented via `public/logger.js`, which logs events to `/api/log` and persists them as NDJSON in `./logs`.

<!-- ## Key Features
- Passkey registration/login with WebAuthn attestations, automatic RP ID/origin detection, and a delete-user endpoint.
- Password registration/login mirroring familiar UI patterns (strength meter, inline warnings, visibility toggles, delete confirmation).
- Research logger capturing detailed user events across both flows (focus, paste, navigation, success/failure) written to disk.
- Tailwind-styled UIs for all pages, served directly from the Express `public` directory.
- Success/account pages for both auth types, including sign-out and delete actions (`/success.html` calls the backend, `/password/delete.html` clears localStorage).
- Helmet configuration that disables CSP so CDN assets (Tailwind, SimpleWebAuthnBrowser, Font Awesome, zxcvbn) can load without extra headers. -->

## Technologies
- **Backend:** Node.js, Express 4, Helmet, NanoID, Crypto, `@simplewebauthn/server`.
- **Frontend:** Plain JavaScript, Tailwind CSS via CDN, `@simplewebauthn/browser`, Font Awesome (password UI), `zxcvbn` (password strength metering).
<!-- - **Persistence:** In-memory object for passkeys (demo only); browser `localStorage` for password accounts.
- **Analytics:** Custom logger posting to `/api/log`; server writes NDJSON entries to `./logs`. -->

<!-- ## Project Structure
```
.
├── server.js                 # Express app, WebAuthn routes, telemetry logging endpoint
├── package.json / package-lock.json
├── public/
│   ├── auth-choice.html / auth-choice.js          # Entry page to choose password vs passkey
│   ├── logger.js                                  # Shared telemetry helper
│   ├── login.html / login-page.js                 # Passkey login UI + logic
│   ├── register.html / register-page.js           # Passkey registration UI + logic
│   ├── success.html / success.js                  # Passkey account page (sign out/delete)
│   ├── password/
│   │   ├── login.html / login.js                  # Password login flow
│   │   ├── register.html / register.js            # Password registration (zxcvbn meter)
│   │   ├── account.html / account.js              # Password account screen
│   │   └── delete.html                            # Password delete confirmation (front-end only)
│   ├── register.js / login.js                     # Legacy passkey scripts (kept for reference)
│   └── index.html                                 # Redirects to auth-choice
├── logs/                                          # NDJSON logs written by /api/log
└── node_modules/
``` -->

## Installation & Local Development
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the server**
   ```bash
   npm start
   ```
3. **Browse**
   - Visit `http://localhost:3000/` → redirect to `/auth-choice.html`.
   - Choose **Continue with Password** or **Continue with Passkey** to launch the respective flows.

The server listens on **port 3000**. Static files are served from `/public`, and API endpoints (`/webauthn/*`, `/api/log`) share the same origin.

<!-- ## Authentication Workflows

### Passkey (WebAuthn)
1. **Registration (`/register.html`)**
   - Email input is a native HTML5 field (`type="email"`, `required`), so malformed addresses trigger the browser’s tooltip. JS adds a domain whitelist (`.com`, `.net`, `.org`, `.edu`, `.co`, `.io`, `.gov`, `.pk`) and inline message.
   - Clicking **Create Account** posts to `/webauthn/generate-registration-options`. The server:
     - Computes RP ID/origin from the current request (supports localhost and HTTPS deployments).
     - Assigns a random 32-byte binary `userID` (as required by SimpleWebAuthn v10+).
     - Excludes any existing credentials for that username.
   - The browser runs `SimpleWebAuthnBrowser.startRegistration(options)`, then sends the attestation response to `/webauthn/verify-registration`. On success, the credential (ID, public key, counter, transports) is stored in the in-memory `users` map, and the user is redirected to the passkey login page.

2. **Login (`/login.html`)**
   - Same email validation pipeline as registration.
   - Requests options from `/webauthn/generate-authentication-options`, which restricts allowed credentials to those on file for the user.
   - The browser runs `startAuthentication(options)` and posts the assertion to `/webauthn/verify-authentication`. Verified logins store the username under `localStorage['demo.username']` and navigate to `/success.html`.

3. **Account (`/success.html`)**
   - Reads `demo.username` to display the signed-in user.
   - **Sign Out** clears the value and redirects to login.
   - **Delete Account** calls `/webauthn/delete-user`, which removes the user + credentials from the server’s memory and prompts the user to delete the passkey from their device. After deletion it redirects to registration.

### Password
1. **Registration (`/password/register.html`)**
   - Email uses the same domain whitelist as passkeys.
   - Password strength is measured with `zxcvbn`; UI shows a color bar and emoji feedback. Requirements:
     - ≥ 8 characters
     - zxcvbn score ≥ 3
     - Estimated guesses ≥ 10⁸
     - Not equal to the email
     - Must match the confirmation field
   - Credentials are stored in `localStorage` under `password.userEmail`, `password.userPassword`. A success message appears before redirecting to the password login page.

2. **Login (`/password/login.html`)**
   - Validates email/password presence and format, then checks against `localStorage`.
   - Successful login sets `password.isLoggedIn` and redirects to `/password/account.html`; otherwise displays inline errors.
   - Includes password visibility toggle buttons with Font Awesome icons.

3. **Account & Delete**
   - `/password/account.html` shows the stored email, with **Sign Out** and **Delete Account** actions.
   - Delete navigates to `/password/delete.html`, which clears all password-related localStorage entries and redirects to login. This flow is purely client-side.

## Telemetry Logging
- All key pages import `public/logger.js` and call `window.initLogger(...)` with task names (`register_passkey`, `login_password`, etc.).
- `logger.js`:
  - Generates/restores a session ID (`research.sessionId` in localStorage).
  - Logs events such as focus/blur, paste, password strength updates, button clicks, navigation, and task completion/failure.
  - Sends events to `/api/log` via `fetch` or `navigator.sendBeacon` (on unload). The server appends each JSON object as a line to `logs/<sessionId>.json`.
- The backend validates log payloads (requires `sessionId`, `task`, `event`, `timestamp`) and creates the `logs` directory if missing. -->

<!-- ## Environment & Browser Requirements
- **Node.js** capable of running Express 4, `@simplewebauthn/server`, and other listed dependencies.
- **Browser:** WebAuthn requires a modern browser with passkey support (Chrome/Safari/Edge on compatible OS). Passkeys work on `http://localhost:3000` and on HTTPS domains; ensure the hostname matches the RP ID derived from the request.
- **Storage:** Passkey credentials reside only in the server’s in-memory `users` object (cleared on restart). Password credentials live in the user’s browser `localStorage` until deleted.
- **CDN Access:** Helmet disables CSP so Tailwind, SimpleWebAuthnBrowser, Font Awesome, and zxcvbn can load from CDNs. If you deploy in a locked-down environment, self-host those assets or adjust CSP accordingly. -->

<!-- ## Deployment Notes
- Dynamic RP ID/origin computation means the same server can run locally or behind a production hostname (e.g., Render) without code changes. Just ensure the public URL matches what browsers use for WebAuthn.
- `/api/log` writes NDJSON to disk; provide persistent storage if you need logs across restarts or containers.
- The in-memory `users` store is for demos only. Replace it with a real database and session layer for production use. -->

<!-- ## Additional Notes -->
<!-- - `public/login.js` and `public/register.js` are older passkey scripts kept for reference; the new Tailwind pages (`login-page.js`, `register-page.js`) are the ones linked from HTML. -->
<!-- - Password account deletion is front-end only; it clears `localStorage` but does not touch the server because no password data is stored there.
- Logs may contain sensitive data (the password flow currently logs entered credentials). Use with caution and adjust `logger.js` before production use. -->
