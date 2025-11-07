(function () {
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

  signOutBtn?.addEventListener('click', () => {
    localStorage.removeItem('password.isLoggedIn');
    window.location.href = '/password/login.html';
  });
})();


