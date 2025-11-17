(function () {
  // Initialize logger for password login task
  window.initLogger('login_password');

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const toggleLoginPasswordBtn = document.getElementById('toggleLoginPassword');
  const toggleLoginPasswordIcon = toggleLoginPasswordBtn?.querySelector('i');
  const messageEl = document.getElementById('loginMessage');
  const continueBtn = form?.querySelector('button[type="submit"]');
  const registerLink = document.querySelector('a[href="/password/register.html"]');
  const authChoiceLink = document.querySelector('a[href="/auth-choice.html"]');

  function showMessage(text, type = 'error') {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.classList.remove('text-green-600', 'text-red-600');
    messageEl.classList.add(type === 'success' ? 'text-green-600' : 'text-red-600');
  }

  function clearMessage() {
    if (messageEl) messageEl.textContent = '';
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|co|io|gov|pk)$/i;
    return emailRegex.test(email);
  }

  function setVisibility(input, button, icon, visible) {
    if (!input || !button || !icon) {
      return;
    }
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', visible ? 'true' : 'false');
    icon.classList.toggle('fa-eye', !visible);
    icon.classList.toggle('fa-eye-slash', visible);
  }

  function attachToggleVisibility(button, input, icon) {
    if (!button || !input || !icon) {
      return;
    }
    let visible = false;
    const apply = () => setVisibility(input, button, icon, visible);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      visible = !visible;
      apply();
      window.logEvent('click_show_password_button', { field: 'password', visible });
      window.logEvent('password_visibility_toggled', { field: 'password', visible });
    });
    apply();
  }

  function attachFieldAnalytics(element, fieldName, { onInput } = {}) {
    if (!element) {
      return;
    }
    element.addEventListener('focus', () => window.logEvent(`${fieldName}_focus`));
    element.addEventListener('blur', () => window.logEvent(`${fieldName}_blur`));
    element.addEventListener('input', (event) => {
      const value = event.target?.value || '';
      window.logEvent(`${fieldName}_changed`, { length: value.length, inputType: event.inputType || 'unknown' });
      onInput?.(value, event);
    });
    element.addEventListener('paste', (event) => {
      const pasted = event.clipboardData?.getData('text') || '';
      window.logEvent(`${fieldName}_paste`, { length: pasted.length });
    });
  }

  function logLoginFailure(type, metadata = {}) {
    window.logEvent(type, metadata);
    window.logEvent('password_submit_failed', { reason: type, ...metadata });
    window.logTaskFailure({ reason: type, ...metadata });
  }

  attachToggleVisibility(toggleLoginPasswordBtn, passwordInput, toggleLoginPasswordIcon);

  attachFieldAnalytics(emailInput, 'email', {
    onInput: () => clearMessage(),
  });

  attachFieldAnalytics(passwordInput, 'password', {
    onInput: () => clearMessage(),
  });

  continueBtn?.addEventListener('click', () => {
    window.logEvent('click_login_button', { source: 'password_login' });
  });

  registerLink?.addEventListener('click', () => {
    window.logEvent('navigate_to_register', { source: 'password_login', destination: '/password/register.html' });
  });

  authChoiceLink?.addEventListener('click', () => {
    window.logEvent('navigate_back_to_auth_choice', { source: 'password_login' });
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage();

    if (!event.submitter && continueBtn) {
      window.logEvent('click_login_button', { source: 'password_login', viaSubmitKey: true });
    }

    // Log form submission
    window.logEvent('form_submit', { form: 'password_login' });

    const email = (emailInput?.value || '').trim();
    const password = passwordInput?.value || '';

    const storedEmail = localStorage.getItem('password.userEmail');
    const storedPassword = localStorage.getItem('password.userPassword');

    if (!email || !password) {
      logLoginFailure('missing_credentials', {
        emailLength: email.length,
        passwordLength: password.length,
      });
      showMessage('Please enter both email and password.');
      return;
    }

    if (!isValidEmail(email)) {
      logLoginFailure('invalid_email_format', { emailLength: email.length });
      showMessage('Enter a valid email (e.g., name@example.com).');
      return;
    }

    if (email === storedEmail && password === storedPassword) {
      // Log successful login
      window.logTaskCompletion(true, {
        emailLength: email.length,
        passwordLength: password.length,
      });

      localStorage.setItem('password.isLoggedIn', 'true');
      localStorage.setItem('password.userEmail', email);
      showMessage('✅ Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/password/account.html';
      }, 1200);
    } else {
      logLoginFailure('invalid_credentials', { emailLength: email.length });
      showMessage('Invalid email or password.');
    }
  });

  if (localStorage.getItem('password.isLoggedIn') === 'true') {
    window.location.href = '/password/account.html';
  }
})();


