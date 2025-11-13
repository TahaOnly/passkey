(function () {
  const form = document.getElementById('registerForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm');
  const messageEl = document.getElementById('registerMessage');
  const strengthBar = document.getElementById('passwordStrengthBar');
  const strengthText = document.getElementById('passwordStrengthText');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
  const togglePasswordIcon = togglePasswordBtn?.querySelector('i');
  const toggleConfirmPasswordIcon = toggleConfirmPasswordBtn?.querySelector('i');
  const matchText = document.getElementById('passwordMatchText');

  const blocklist = ['password', 'pakistan', 'abcd1234'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-600'];

  function showMessage(text, type = 'error') {
    if (!messageEl) {
      return;
    }
    messageEl.textContent = text;
    messageEl.classList.remove('text-red-600', 'text-green-600');
    messageEl.classList.add(type === 'success' ? 'text-green-600' : 'text-red-600');
  }

  function clearMessage() {
    if (!messageEl) {
      return;
    }
    messageEl.textContent = '';
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|net|org|edu|co|io|gov|pk)$/i;
    return emailRegex.test(email);
  }

  function resetStrengthUI() {
    if (!strengthBar || !strengthText) {
      return;
    }
    strengthBar.style.width = '0%';
    strengthColors.forEach((colorClass) => strengthBar.classList.remove(colorClass));
    strengthBar.classList.add(strengthColors[0]);
    strengthText.textContent = '';
  }

  function updateStrengthUI(password) {
    if (!strengthBar || !strengthText) {
      return { meetsPolicy: false, score: 0, guesses: 0 };
    }

    if (!password) {
      resetStrengthUI();
      return { meetsPolicy: false, score: 0, guesses: 0 };
    }

    const result = typeof zxcvbn === 'function' ? zxcvbn(password, blocklist) : { score: 0, guesses: 0 };
    const normalizedScore = Math.max(0, Math.min(result.score ?? 0, 4));
    const lengthValid = password.length >= 8;
    const meetsPolicy = lengthValid && normalizedScore >= 3 && (result.guesses ?? 0) >= 1e8;

    const percent = ((normalizedScore + 1) / 5) * 100;
    strengthBar.style.width = `${percent}%`;

    strengthColors.forEach((colorClass) => strengthBar.classList.remove(colorClass));
    strengthBar.classList.add(strengthColors[normalizedScore]);

    let feedbackText = '';
    if (!lengthValid) {
      feedbackText = '😵 That\'s too short. You need at least 8 characters.';
    } else {
      switch (normalizedScore) {
        case 0:
        case 1:
          feedbackText = '😟 Terrible. This password is very easy to guess.';
          break;
        case 2:
          feedbackText = '😐 Weak. Your password needs to be better.';
          break;
        case 3:
          feedbackText = '🙂 Good. Your password is pretty good.';
          break;
        case 4:
          feedbackText = '😇 Excellent. Your password appears strong.';
          break;
        default:
          feedbackText = '';
      }
    }

    strengthText.textContent = feedbackText;
    strengthText.classList.toggle('text-red-600', !meetsPolicy);
    strengthText.classList.toggle('text-slate-600', meetsPolicy);
    strengthText.classList.toggle('text-green-600', normalizedScore >= 3 && meetsPolicy);

    return {
      meetsPolicy,
      score: normalizedScore,
      guesses: result.guesses ?? 0,
      lengthValid,
    };
  }

  function evaluatePassword(password) {
    const { meetsPolicy, score, guesses, lengthValid } = updateStrengthUI(password);
    return {
      meetsPolicy,
      score,
      guesses,
      lengthValid,
    };
  }

  function updatePasswordMatch(password, confirm) {
    if (!matchText) {
      return;
    }

    if (!confirm) {
      matchText.textContent = '';
      matchText.classList.remove('text-red-600', 'text-green-600', 'text-slate-600');
      return;
    }

    if (password === confirm) {
      matchText.textContent = '✅ Passwords match.';
      matchText.classList.remove('text-red-600', 'text-slate-600');
      matchText.classList.add('text-green-600');
    } else {
      matchText.textContent = '❌ Passwords do not match. Check them for typos.';
      matchText.classList.remove('text-green-600', 'text-slate-600');
      matchText.classList.add('text-red-600');
    }
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
    });
    apply();
  }

  attachToggleVisibility(togglePasswordBtn, passwordInput, togglePasswordIcon);
  attachToggleVisibility(toggleConfirmPasswordBtn, confirmInput, toggleConfirmPasswordIcon);

  passwordInput?.addEventListener('input', (event) => {
    const value = event.target?.value || '';
    clearMessage();
    evaluatePassword(value);
    // Also check match when password changes
    if (confirmInput?.value) {
      updatePasswordMatch(value, confirmInput.value);
    }
  });

  confirmInput?.addEventListener('input', (event) => {
    const value = event.target?.value || '';
    clearMessage();
    updatePasswordMatch(passwordInput?.value || '', value);
  });

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

    const { meetsPolicy, lengthValid, score, guesses } = evaluatePassword(password);

    if (!lengthValid) {
      showMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!meetsPolicy) {
      showMessage('Password must reach at least a "Good" strength (score ≥ 3 and 10^8 guesses).');
      return;
    }

    if (password !== confirm) {
      showMessage('❌ Passwords do not match. Check them for typos.');
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

  emailInput?.addEventListener('input', clearMessage);
})();


