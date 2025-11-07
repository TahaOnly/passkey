(function () {
  const passwordBtn = document.getElementById('passwordBtn');
  const passkeyBtn = document.getElementById('passkeyBtn');

  passwordBtn?.addEventListener('click', () => {
    window.location.href = '/password/login.html';
  });

  passkeyBtn?.addEventListener('click', () => {
    window.location.href = '/login.html';
  });
})();


