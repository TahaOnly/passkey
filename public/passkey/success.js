(function () {
  // Initialize logger for passkey success/account task
  window.initLogger('passkey_account');

  const whoEl = document.getElementById('who');
  const signOutBtn = document.getElementById('signOutBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const noteEl = document.getElementById('note');

  const username = localStorage.getItem('demo.username') || '';
  if (whoEl) whoEl.textContent = username || 'Unknown user';

  // Log button clicks
  signOutBtn?.addEventListener('click', () => {
    window.logEvent('click_sign_out_button', { location: 'passkey_account' });
    localStorage.removeItem('demo.username');
    window.location.href = '/passkey/login.html';
  });

  deleteBtn?.addEventListener('click', async () => {
    window.logEvent('click_delete_account_button', { location: 'passkey_account' });

    if (!username) {
      window.logEvent('delete_error', { error: 'no_username' });
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
      window.logEvent('localstorage_user_deleted', { emailLength: username.length });
      window.logTaskCompletion(true, { action: 'account_deleted' });
      if (noteEl) {
        noteEl.textContent = 'Account removed from the demo server. To fully revoke the passkey, delete it from your device\'s Password Manager.';
      }
      setTimeout(() => (window.location.href = '/passkey/register.html'), 1000);
    } catch (err) {
      window.logEvent('delete_error', {
        error: err?.message || String(err),
        errorType: err?.name || 'unknown',
      });
      if (noteEl) {
        noteEl.textContent = `Failed to delete account: ${err?.message || err}`;
      }
    }
  });
})();


