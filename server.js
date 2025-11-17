// Minimal Passkey (WebAuthn) demo using Node.js + Express.
// Backend uses @simplewebauthn/server to generate/verify options and responses.
// Frontend (served from /public) uses @simplewebauthn/browser via CDN.

const express = require('express');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const crypto = require('crypto');

// SimpleWebAuthn server helpers
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

// Relying Party (RP) details
const rpName = 'Passkey Demo';
// rpID and origin will be computed from the incoming request so this app
// works both on http://localhost:3000 and on production domains (e.g. Render)

// In-memory store for demo purposes (not for production!)
// Structure:
// users = {
//   [username]: {
//     id: string, // human-readable id (not used for WebAuthn anymore)
//     userID: Buffer, // stable binary user id required by SimpleWebAuthn v10+
//     username: string,
//     credentials: [
//       {
//         credentialID: Buffer,
//         credentialPublicKey: Buffer,
//         counter: number,
//         transports?: string[],
//       }
//     ],
//     currentChallenge?: string,
//   }
// }
const users = Object.create(null);

const app = express();
// So req.protocol reflects the upstream protocol (https on Render)
app.set('trust proxy', 1);

// Helmet with CSP disabled so CDN scripts can load easily in this demo
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Compute RP ID and Origin from the request
function getRPContext(req) {
  const hostHeader = req.headers.host || 'localhost:3000';
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  const hostname = host.split(':')[0];
  const protocol = req.protocol || 'http';
  // Keep port if present when on localhost; browsers accept http on localhost
  const computedOrigin = `${protocol}://${host}`;
  return { rpID: hostname, origin: computedOrigin };
}

// Helper: get or create a user record in memory
function getOrCreateUser(username) {
  if (!users[username]) {
    users[username] = {
      id: nanoid(),
      // Stable binary user id (32 random bytes) per user as required by SWA v10+
      userID: crypto.randomBytes(32),
      username,
      credentials: [],
    };
  }
  return users[username];
}

// Registration: Generate options
app.post('/webauthn/generate-registration-options', async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    const user = getOrCreateUser(username);
    const { rpID, origin } = getRPContext(req);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      // SimpleWebAuthn v10+ requires a BufferSource/Uint8Array, not a string
      userID: user.userID,
      userName: user.username,
      attestationType: 'none',
      // Encourage discoverable credentials (aka passkeys), but do not require
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      // Prevent registering duplicate credentials for this user
      excludeCredentials: user.credentials.map((cred) => ({
        id: cred.credentialID,
        type: 'public-key',
        transports: cred.transports,
      })),
    });

    user.currentChallenge = options.challenge;

    return res.json(options);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error generating registration options', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Failed to generate registration options', message: err && err.message ? err.message : String(err) });
  }
});

// Registration: Verify response
app.post('/webauthn/verify-registration', async (req, res) => {
  try {
    const { username, attestationResponse } = req.body || {};
    if (!username || !attestationResponse) {
      return res.status(400).json({ error: 'username and attestationResponse are required' });
    }
    const user = users[username];
    const { rpID, origin } = getRPContext(req);
    if (!user || !user.currentChallenge) {
      return res.status(400).json({ error: 'No registration in progress for this user' });
    }

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    const { verified, registrationInfo } = verification;
    if (verified && registrationInfo) {
      const {
        credentialPublicKey,
        credentialID,
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports,
      } = registrationInfo;

      // Normalize to Buffers (SWA v10 may return base64url strings)
      const credentialIDBuf =
        typeof credentialID === 'string' ? Buffer.from(credentialID, 'base64url') : Buffer.from(credentialID);
      const credentialPublicKeyBuf =
        typeof credentialPublicKey === 'string'
          ? Buffer.from(credentialPublicKey, 'base64url')
          : Buffer.from(credentialPublicKey);

      // If credentialID already exists, skip adding
      const existing = user.credentials.find((c) => Buffer.compare(c.credentialID, credentialIDBuf) === 0);
      if (!existing) {
        user.credentials.push({
          credentialID: credentialIDBuf,
          credentialPublicKey: credentialPublicKeyBuf,
          counter,
          transports,
          // Not strictly needed here, but could be informative
          credentialDeviceType,
          credentialBackedUp,
        });
      }
      user.currentChallenge = undefined;
    }

    return res.json({ verified });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error verifying registration', err);
    return res.status(400).json({ error: 'Registration verification failed' });
  }
});

// Authentication: Generate options
app.post('/webauthn/generate-authentication-options', async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    const user = users[username];
    const { rpID } = getRPContext(req);
    if (!user || user.credentials.length === 0) {
      return res.status(400).json({ error: 'User not found or no credentials registered' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.credentials.map((cred) => ({
        // Library expects base64url string here
        id: Buffer.isBuffer(cred.credentialID)
          ? cred.credentialID.toString('base64url')
          : typeof cred.credentialID === 'string'
            ? cred.credentialID
            : Buffer.from(cred.credentialID).toString('base64url'),
        type: 'public-key',
        transports: cred.transports,
      })),
      userVerification: 'preferred',
    });

    user.currentChallenge = options.challenge;
    return res.json(options);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error generating authentication options', err);
    return res.status(500).json({ error: 'Failed to generate authentication options' });
  }
});

// Authentication: Verify response
app.post('/webauthn/verify-authentication', async (req, res) => {
  try {
    const { username, assertionResponse } = req.body || {};
    if (!username || !assertionResponse) {
      return res.status(400).json({ error: 'username and assertionResponse are required' });
    }
    const user = users[username];
    const { rpID, origin } = getRPContext(req);
    if (!user || !user.currentChallenge) {
      return res.status(400).json({ error: 'No authentication in progress for this user' });
    }

    // Locate the matching credential
    const dbAuthenticator = user.credentials.find((cred) => Buffer.compare(cred.credentialID, Buffer.from(assertionResponse.rawId, 'base64url')) === 0);

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: dbAuthenticator,
    });

    const { verified, authenticationInfo } = verification;
    if (verified && authenticationInfo && dbAuthenticator) {
      const { newCounter } = authenticationInfo;
      dbAuthenticator.counter = newCounter;
      user.currentChallenge = undefined;
    }

    return res.json({ verified });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error verifying authentication', err);
    return res.status(400).json({ error: 'Authentication verification failed' });
  }
});

// Delete a user and all associated credentials (demo-only utility)
app.post('/webauthn/delete-user', (req, res) => {
  const { username } = req.body || {};
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }

  delete users[username];
  return res.json({ deleted: true });
});

// Research logging endpoint
// Logs user interactions to files for research analysis
app.post('/api/log', (req, res) => {
  try {
    const { sessionId, task, event, timestamp, metadata } = req.body;

    // Validate required fields
    if (!sessionId || !task || !event || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, task, event, timestamp' });
    }

    // Ensure logs directory exists
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Sanitize sessionId for filename (only alphanumeric, dash, underscore)
    const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const logFile = path.join(logsDir, `${safeSessionId}.json`);

    // Create log entry
    const logEntry = {
      sessionId,
      task,
      event,
      timestamp,
      metadata,
    };

    // Append as newline-separated JSON (NDJSON format)
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine, 'utf8');

    return res.json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error logging event:', err);
    return res.status(500).json({ error: 'Failed to log event' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Passkey demo listening on http://localhost:${PORT}`);
});


