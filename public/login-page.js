// Tailwind-styled login page logic using existing backend endpoints
(function () {
  const logEl = document.getElementById('log');
  const emailEl = document.getElementById('email');
  const loginBtn = document.getElementById('loginBtn');

  function showLog(_msg) {
    if (!logEl) return;
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
    const username = (emailEl?.value || '').trim();
    if (!username) {
      showLog('Please enter your email');
      return;
    }
    try {
      showLog('Requesting authentication options...');
      const options = await postJSON('/webauthn/generate-authentication-options', { username });

      showLog('Starting WebAuthn authentication...');
      const assertionResponse = await SimpleWebAuthnBrowser.startAuthentication(options);

      showLog('Verifying authentication response...');
      const verification = await postJSON('/webauthn/verify-authentication', {
        username,
        assertionResponse,
      });

      if (verification?.verified) {
        localStorage.setItem('demo.username', username);
        window.location.href = '/success.html';
      } else {
        showLog('Login failed or not verified');
      }
    } catch (err) {
      showLog(`Authentication error: ${err?.message || err}`);
    }
  });
})();


