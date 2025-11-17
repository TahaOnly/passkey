(function () {
  // Initialize logger for auth choice task
  window.initLogger('auth_choice');

  const passwordBtn = document.getElementById('passwordBtn');
  const passkeyBtn = document.getElementById('passkeyBtn');

  passwordBtn?.addEventListener('click', () => {
    window.logEvent('click_continue_with_password', { source: 'auth_choice' });
    window.logEvent('navigate_to_login', { destination: '/password/login.html', method: 'password' });
    window.location.href = '/password/login.html';
  });

  passkeyBtn?.addEventListener('click', () => {
    window.logEvent('click_continue_with_passkey', { source: 'auth_choice' });
    window.logEvent('navigate_to_login', { destination: '/login.html', method: 'passkey' });
    window.location.href = '/login.html';
  });
})();


