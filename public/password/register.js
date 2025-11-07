(function () {
  const form = document.getElementById('registerForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm');
  const messageEl = document.getElementById('registerMessage');

  function showMessage(text, type = 'error') {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.classList.remove('text-red-600', 'text-green-600');
    messageEl.classList.add(type === 'success' ? 'text-green-600' : 'text-red-600');
  }

  function clearMessage() {
    if (messageEl) messageEl.textContent = '';
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|co|io|gov|pk)$/i;
    return emailRegex.test(email);
  }

  function isValidPassword(password) {
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passRegex.test(password);
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage();

    const email = (emailInput?.value || '').trim();
    const password = passwordInput?.value || '';
    const confirm = confirmInput?.value || '';

    if (!isValidEmail(email)) {
      showMessage('Enter a valid email (e.g., name@example.com).');
      return;
    }

    if (!isValidPassword(password)) {
      showMessage('Password must be at least 8 characters with uppercase, lowercase, and a number.');
      return;
    }

    if (password !== confirm) {
      showMessage('Passwords do not match.');
      return;
    }

    const existingEmail = localStorage.getItem('password.userEmail');
    if (existingEmail && existingEmail === email) {
      showMessage('An account with this email already exists. Please log in instead.');
      return;
    }

    localStorage.setItem('password.userEmail', email);
    localStorage.setItem('password.userPassword', password);
    localStorage.removeItem('password.isLoggedIn');

    showMessage('✅ Account created successfully! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = '/password/login.html';
    }, 1200);
  });

  [emailInput, passwordInput, confirmInput].forEach((input) => {
    input?.addEventListener('input', clearMessage);
  });
})();


