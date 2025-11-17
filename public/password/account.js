(function () {
  // Initialize logger for password account task
  window.initLogger('password_account');

  const whoEl = document.getElementById('who');
  const signOutBtn = document.getElementById('signOutBtn');

  const email = localStorage.getItem('password.userEmail');
  const isLoggedIn = localStorage.getItem('password.isLoggedIn') === 'true';

  if (!isLoggedIn || !email) {
    window.location.href = '/password/login.html';
    return;
  }

  if (whoEl) {
    whoEl.textContent = email;
  }

  // Log button clicks
  signOutBtn?.addEventListener('click', () => {
    window.logEvent('click_sign_out_button', { location: 'password_account' });
    localStorage.removeItem('password.isLoggedIn');
    window.location.href = '/password/login.html';
  });

  // Log navigation to delete page
  const deleteLink = document.querySelector('a[href="/password/delete.html"]');
  deleteLink?.addEventListener('click', () => {
    window.logEvent('click_delete_account_button', { location: 'password_account' });
    window.logEvent('navigate_to_delete_account', { destination: '/password/delete.html' });
  });
})();


