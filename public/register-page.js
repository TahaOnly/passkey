// Tailwind-styled register page logic using existing backend endpoints
(function () {
  const logEl = document.getElementById('log');
  const emailEl = document.getElementById('email');
  const registerBtn = document.getElementById('registerBtn');
  const emailErrorEl = document.getElementById('emailError');

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

  function showEmailError(message) {
    if (!emailErrorEl) return;
    emailErrorEl.textContent = message;
    emailErrorEl.classList.remove('hidden');
  }

  function clearEmailError() {
    if (!emailErrorEl) return;
    emailErrorEl.classList.add('hidden');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  emailEl?.addEventListener('input', clearEmailError);

  registerBtn?.addEventListener('click', async () => {
    const username = (emailEl?.value || '').trim();
    if (!username) {
      showEmailError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(username)) {
      showEmailError('Please enter a valid email address.');
      return;
    }
    clearEmailError();
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


