// Handles the WebAuthn registration (attestation) flow on the client.

(function () {
  const logEl = document.getElementById('log');
  const registerBtn = document.getElementById('registerBtn');
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

  registerBtn?.addEventListener('click', async () => {
    const username = (usernameEl?.value || '').trim();
    if (!username) {
      log('Please enter a username');
      return;
    }
    try {
      log('Requesting registration options...');
      const options = await postJSON('/webauthn/generate-registration-options', { username });

      log('Starting WebAuthn registration...');
      const attestationResponse = await SimpleWebAuthnBrowser.startRegistration(options);

      log('Verifying registration response...');
      const verification = await postJSON('/webauthn/verify-registration', {
        username,
        attestationResponse,
      });

      if (verification?.verified) {
        log('Registration successful!');
      } else {
        log('Registration failed or not verified');
      }
    } catch (err) {
      log(`Registration error: ${err?.message || err}`);
    }
  });
})();


