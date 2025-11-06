// Handles the WebAuthn authentication (assertion) flow on the client.

(function () {
  const logEl = document.getElementById('log');
  const loginBtn = document.getElementById('loginBtn');
  const usernameEl = document.getElementById('username');

  function log(message) {
    if (!logEl) return;
    const ts = new Date().toISOString();
    logEl.textContent += `\n[${ts}] ${message}`;
  }

  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  }

  loginBtn?.addEventListener('click', async () => {
    const username = (usernameEl?.value || '').trim();
    if (!username) {
      log('Please enter a username');
      return;
    }
    try {
      log('Requesting authentication options...');
      const options = await postJSON('/webauthn/generate-authentication-options', { username });

      log('Starting WebAuthn authentication...');
      const assertionResponse = await SimpleWebAuthnBrowser.startAuthentication(options);

      log('Verifying authentication response...');
      const verification = await postJSON('/webauthn/verify-authentication', {
        username,
        assertionResponse,
      });

      if (verification?.verified) {
        log('Login successful!');
      } else {
        log('Login failed or not verified');
      }
    } catch (err) {
      log(`Authentication error: ${err?.message || err}`);
    }
  });
})();


