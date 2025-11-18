// Tailwind-styled login page logic using existing backend endpoints
(function () {
  // Initialize logger for passkey login task
  window.initLogger('login_passkey');

  const logEl = document.getElementById('log');
  const emailEl = document.getElementById('email');
  const form = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const messageEl = document.getElementById('loginMessage');
  const registerLink = document.querySelector('a[href="/passkey/register.html"]');

  function showLog(_msg) {
    if (!logEl) return;
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

  registerLink?.addEventListener('click', () => {
    window.logEvent('navigate_to_register', { source: 'passkey_login', destination: '/passkey/register.html' });
  });

  loginBtn?.addEventListener('click', () => {
    window.logEvent('click_login_button', { source: 'passkey_login', trigger: 'click' });
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    window.logEvent('passkey_login_started', { trigger: 'submit' });

    const username = (emailEl?.value || '').trim();
    if (!username) {
      window.logEvent('invalid_email_format', { emailLength: 0, reason: 'empty' });
      showMessage('Please enter your email address.');
      return;
    }
    if (!isValidEmail(username)) {
      window.logEvent('invalid_email_format', { emailLength: username.length, reason: 'format' });
      showMessage('Enter a valid email (e.g., name@example.com).');
      return;
    }
    clearMessage();

    // log exact email used this time
    window.logEvent('email_used', { email: username });

    try {
      showLog('Requesting authentication options...');
      const options = await postJSON('/webauthn/generate-authentication-options', { username });
      window.logEvent('passkey_login_prompt_shown', {
        challengeLength: options?.challenge?.length || 0,
        userVerification: options?.userVerification || 'preferred',
      });

      showLog('Starting WebAuthn authentication...');
      const assertionResponse = await SimpleWebAuthnBrowser.startAuthentication(options);

      showLog('Verifying authentication response...');
      const verification = await postJSON('/webauthn/verify-authentication', {
        username,
        assertionResponse,
      });

      if (verification?.verified) {
        window.logEvent('passkey_login_success', {
          credentialId: assertionResponse?.id || 'unknown',
        });
        localStorage.setItem('demo.username', username);
        window.logTaskCompletion(true, {
          emailLength: username.length,
          credentialId: assertionResponse?.id || 'unknown',
        });
        window.location.href = '/passkey/success.html';
      } else {
        window.logEvent('passkey_login_error', { error: 'verification_failed' });
        window.logTaskFailure({ error: 'verification_failed' });
        showLog('Login failed or not verified');
      }
    } catch (err) {
      window.logEvent('passkey_login_error', {
        error: err?.message || String(err),
        errorName: err?.name || 'unknown',
      });
      window.logTaskFailure({
        error: err?.message || String(err),
        errorName: err?.name || 'unknown',
      });
      showLog(`Authentication error: ${err?.message || err}`);
    }
  });
})();


