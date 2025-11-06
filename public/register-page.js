// Tailwind-styled register page logic using existing backend endpoints
(function () {
  const logEl = document.getElementById('log');
  const emailEl = document.getElementById('email');
  const registerBtn = document.getElementById('registerBtn');

  function showLog(msg) {
    if (!logEl) return;
    logEl.classList.remove('hidden');
    const ts = new Date().toISOString();
    logEl.textContent += `\n[${ts}] ${msg}`;
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
    const username = (emailEl?.value || '').trim();
    if (!username) {
      showLog('Please enter your email');
      return;
    }
    try {
      showLog('Requesting registration options...');
      const options = await postJSON('/webauthn/generate-registration-options', { username });

      showLog('Starting WebAuthn registration...');
      const attestationResponse = await SimpleWebAuthnBrowser.startRegistration(options);

      showLog('Verifying registration response...');
      const verification = await postJSON('/webauthn/verify-registration', {
        username,
        attestationResponse,
      });

      if (verification?.verified) {
        localStorage.setItem('demo.username', username);
        // Redirect to sign-in so user can authenticate next
        window.location.replace('/login.html');
      } else {
        showLog('Registration failed or not verified');
      }
    } catch (err) {
      showLog(`Registration error: ${err?.message || err}`);
    }
  });
})();


