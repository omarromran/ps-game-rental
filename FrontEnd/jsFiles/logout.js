// logout.js – shared logout helper for all dashboards
export function logout() {
  // Optional user confirmation
  if (typeof showConfirm === 'function') {
    // `showConfirm` is defined in toast.js; it returns a promise<boolean>
    showConfirm('Are you sure you want to log out?')
      .then(confirmed => {
        if (!confirmed) return;
        performLogout();
      })
      .catch(() => performLogout()); // fallback if showConfirm fails
  } else {
    performLogout();
  }

  function performLogout() {
    // Inform the server (stateless, so errors are ignored)
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      }
    }).catch(() => {});

    // Remove all authentication‑related data from the client
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('pshub_wishlist');

    // Redirect to the login page
    window.location.href = '/login';
  }
}
