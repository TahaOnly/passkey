(function () {
  const whoEl = document.getElementById('who');
  const signOutBtn = document.getElementById('signOutBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const noteEl = document.getElementById('note');

  const username = localStorage.getItem('demo.username') || '';
  if (whoEl) whoEl.textContent = username || 'Unknown user';

  signOutBtn?.addEventListener('click', () => {
    localStorage.removeItem('demo.username');
    window.location.href = '/login.html';
  });

  deleteBtn?.addEventListener('click', async () => {
    // Frontend-only demo: no backend endpoint exists to delete the server-side user.
    // We clear the local client state and inform the user how to fully reset.
    localStorage.removeItem('demo.username');
    if (noteEl) {
      noteEl.textContent = 'Demo note: This app uses in-memory storage on the server. Restarting the server clears users/credentials. Removing a passkey from your device must be done in the device\'s Password Manager.';
    }
    setTimeout(() => (window.location.href = '/login.html'), 1000);
  });
})();


