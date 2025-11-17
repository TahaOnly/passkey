// Tailwind-styled register page logic using existing backend endpoints
(function () {
  // Initialize logger for passkey registration task
  window.initLogger('register_passkey');

  const logEl = document.getElementById('log');
  const emailEl = document.getElementById('email');
  const form = document.getElementById('registerForm');
  const registerBtn = document.getElementById('registerBtn');
  const messageEl = document.getElementById('registerMessage');
  const loginLink = document.querySelector('a[href="/login.html"]');

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

  function showMessage(text, type = 'error') {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.classList.remove('text-red-600', 'text-green-600');
    messageEl.classList.add(type === 'success' ? 'text-green-600' : 'text-red-600');
  }

  function clearMessage() {
    if (!messageEl) return;
    messageEl.textContent = '';
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|co|io|gov|pk)$/i;
    return emailRegex.test(email);
  }

  emailEl?.addEventListener('focus', () => {
    window.logEvent('email_focus');
  });
  emailEl?.addEventListener('blur', () => {
    window.logEvent('email_blur');
  });
  emailEl?.addEventListener('input', (event) => {
    const value = event.target?.value || '';
    window.logEvent('email_changed', { length: value.length, inputType: event.inputType || 'unknown' });
    clearMessage();
  });
  emailEl?.addEventListener('paste', (event) => {
    const pasted = event.clipboardData?.getData('text') || '';
    window.logEvent('email_paste', { length: pasted.length });
  });

  loginLink?.addEventListener('click', () => {
    window.logEvent('navigate_to_login', { source: 'passkey_register', destination: '/login.html' });
  });

  registerBtn?.addEventListener('click', () => {
    window.logEvent('click_create_account_button', { location: 'passkey_register', trigger: 'click' });
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    window.logEvent('passkey_register_started');

    const username = (emailEl?.value || '').trim();
    if (!username) {
      window.logEvent('invalid_email_format', { emailLength: 0, reason: 'empty' });
      showMessage('Please enter your email address.');
      return;
    }
    if (!isValidEmail(username)) {
      window.logEvent('invalid_email_format', { emailLength: username.length });
      showMessage('Enter a valid email (e.g., name@example.com).');
      return;
    }


    // log exact email used this time
    window.logEvent('email_used', { email: username });

    clearMessage();

    try {
      showLog('Requesting registration options...');
      const options = await postJSON('/webauthn/generate-registration-options', { username });
      window.logEvent('passkey_register_prompt_shown', {
        challengeLength: options?.challenge?.length || 0,
        userVerification: options?.authenticatorSelection?.userVerification,
      });

      showLog('Starting WebAuthn registration...');
      const attestationResponse = await SimpleWebAuthnBrowser.startRegistration(options);

      showLog('Verifying registration response...');
      const verification = await postJSON('/webauthn/verify-registration', {
        username,
        attestationResponse,
      });

      if (verification?.verified) {
        window.logEvent('passkey_register_success', {
          credentialId: attestationResponse?.id || 'unknown',
        });
        localStorage.setItem('demo.username', username);
        window.logEvent('localstorage_user_created', { emailLength: username.length });
        window.logTaskCompletion(true, {
          emailLength: username.length,
          credentialId: attestationResponse?.id || 'unknown',
        });

        // Redirect to sign-in so user can authenticate next
        window.location.replace('/login.html');
      } else {
        window.logEvent('passkey_register_error', { error: 'verification_failed' });
        window.logTaskFailure({ error: 'verification_failed' });
        showLog('Registration failed or not verified');
      }
    } catch (err) {
      window.logEvent('passkey_register_error', {
        error: err?.message || String(err),
        errorName: err?.name || 'unknown',
      });
      window.logTaskFailure({
        error: err?.message || String(err),
        errorName: err?.name || 'unknown',
      });
      showLog(`Registration error: ${err?.message || err}`);
    }
  });
})();

