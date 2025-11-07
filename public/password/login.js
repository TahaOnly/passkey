(function () {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const messageEl = document.getElementById('loginMessage');

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

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    clearMessage();

    const email = (emailInput?.value || '').trim();
    const password = passwordInput?.value || '';

    const storedEmail = localStorage.getItem('password.userEmail');
    const storedPassword = localStorage.getItem('password.userPassword');

    if (!email || !password) {
      showMessage('Please enter both email and password.');
      return;
    }

    if (!isValidEmail(email)) {
      showMessage('Enter a valid email (e.g., name@example.com).');
      return;
    }

    if (email === storedEmail && password === storedPassword) {
      localStorage.setItem('password.isLoggedIn', 'true');
      localStorage.setItem('password.userEmail', email);
      showMessage('✅ Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/password/account.html';
      }, 1200);
    } else {
      showMessage('Invalid email or password.');
    }
  });

  [emailInput, passwordInput].forEach((input) => {
    input?.addEventListener('input', clearMessage);
  });

  if (localStorage.getItem('password.isLoggedIn') === 'true') {
    window.location.href = '/password/account.html';
  }
})();


