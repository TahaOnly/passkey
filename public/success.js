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
    if (!username) {
      if (noteEl) {
        noteEl.textContent = 'Unable to determine which user to delete. Please register or sign in again.';
      }
      return;
    }
    try {
      const res = await fetch('/webauthn/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      localStorage.removeItem('demo.username');
      if (noteEl) {
        noteEl.textContent = 'Account removed from the demo server. To fully revoke the passkey, delete it from your device\'s Password Manager.';
      }
      setTimeout(() => (window.location.href = '/register.html'), 1000);
    } catch (err) {
      if (noteEl) {
        noteEl.textContent = `Failed to delete account: ${err?.message || err}`;
      }
    }
  });
})();


