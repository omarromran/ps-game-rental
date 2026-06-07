
let rentals = [];
let availableWishlistCount = 0;

// ==========================================
// 🔑 AUTH HELPERS — Token only
// ==========================================
const getToken = () => localStorage.getItem('token');

const authHeaders = (json = false) => {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
};

// ==========================================
// 👤 CURRENT USER — from localStorage only
// ==========================================
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

// ==========================================
// ❤️ WISHLIST
// ==========================================
function getWishlist() {
  try {
    const raw = JSON.parse(localStorage.getItem('pshub_wishlist') || '[]');
    return raw.map(w => String(typeof w === 'string' ? w : (w.gameID || w.id || w._id || ''))).filter(Boolean);
  } catch {
    return [];
  }
}

// ==========================================
// 📦 LOAD DATA
// ==========================================
async function loadData() {
  await loadRentals();
  await refreshUI();
}

// ==========================================
// 🧾 LOAD RENTALS
// ==========================================
async function loadRentals() {
  const token = getToken();
  if (!token) {
    rentals = [];
    return;
  }

  try {
    const res = await fetch('/api/rentals/my', {
      headers: authHeaders()
    });

    if (!res.ok) {
      rentals = [];
      rentals = [];
      return;
    }

    const data = await res.json();
    rentals = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load rentals:', err);
    rentals = [];
  }
}

// ==========================================
// 📑 SHOW SECTIONS
// ==========================================
function showSection(sectionId, btn) {
  document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
  const sec = document.getElementById(sectionId);
  if (sec) sec.style.display = 'block';

  document.querySelectorAll('.sidebar nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ==========================================
// 🚪 LOGOUT
// ==========================================
async function logout() {
  const confirmed = await showConfirm('Are you sure you want to log out?');
  if (!confirmed) return;

  fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() }).catch(() => { });

  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('pshub_wishlist');

  window.location.href = '/login';
}

// ==========================================
// 🔄 REFRESH UI
// ==========================================
async function refreshUI() {
  await renderWishlist(); // sets availableWishlistCount first
  renderDashboard();
  renderRentals();
  renderProfile();
}

// ==========================================
// 📊 DASHBOARD
// ==========================================
function renderDashboard() {
  const user = getCurrentUser();
  if (!user) return;

  const recentRentals = rentals
    .slice()
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 5);

  const cards = document.getElementById('dashboard-cards');
  if (cards) {
    cards.innerHTML = `
      <div class="card">
        <h3>Active Rentals</h3>
        <p>${rentals.filter(r => r.status === 'active').length}</p>
      </div>
      <div class="card">
        <h3>Wishlist</h3>
        <p>${availableWishlistCount}</p>
      </div>
    `;
  }

  const tbody = document.getElementById('activity-body');
  if (!tbody) return;

  if (!recentRentals.length) {
    tbody.innerHTML = '<tr><td colspan=3>No recent activity found.</td></tr>';
    return;
  }

  tbody.innerHTML = recentRentals.map(rental => {
    const date = rental.startDate ? new Date(rental.startDate).toLocaleDateString() : '-';
    const statusLabel = rental.status === 'active' ? 'Active Rental' : 'Returned';
    return `
      <tr>
        <td>${rental.game?.title || 'Unknown Game'}</td>
        <td>${statusLabel}</td>
        <td>${date}</td>
      </tr>
    `;
  }).join('');
}
// ==========================================
// ❤️ WISHLIST
// ==========================================
async function renderWishlist() {
  const container = document.getElementById('wishlist-container');
  if (!container) return;

  const token = getToken();
  if (!token) {
    container.innerHTML = '<p>Please login to see your wishlist.</p>';
    return;
  }

  container.innerHTML = '<p>Loading wishlist...</p>';

  try {
    const res = await fetch('/api/wishlist', { headers: authHeaders() });

    if (!res.ok) {
      container.innerHTML = '<p>Failed to load wishlist.</p>';
      return;
    }

    const wishlistGames = await res.json();

    // Sync count to localStorage
    const ids = wishlistGames.map(g => String(g._id || g.gameID || g.id));
    localStorage.setItem('pshub_wishlist', JSON.stringify(ids));

    const availableGames = wishlistGames.filter(g =>
      g.status === 'Available' || g.status === 'available'
    );
    availableWishlistCount = availableGames.length;

    if (!availableGames.length) {
      container.innerHTML = '<p>Your wishlist is empty.</p>';
      return;
    }

    container.innerHTML = availableGames.map(game => {
      const gid = String(game._id || game.gameID || game.id || '');
      return `
        <div class="wishlist-card">
          <img src="${game.img || game.image || '/photos/placeholder.png'}" style="width:60px" alt="${game.title}">
          <h3>${game.title || 'Unknown Game'}</h3>
          <p>${game.category || ''}</p>
          <p>${game.pricePerDay || 0} EGP/day</p>
          <p>Status: ${game.status || 'Unknown'}</p>
          <button onclick="goToGameDescription('${gid}')">Rent</button>
          <button onclick="removeFromWishlist('${gid}')">Remove</button>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Wishlist load error:', err);
    container.innerHTML = '<p>Failed to load wishlist.</p>';
  }
}

async function removeFromWishlist(gameID) {
  try {
    await fetch(`/api/wishlist/${gameID}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
  } catch (err) {
    console.error('Remove wishlist error:', err);
  }
  await renderWishlist();
  renderDashboard();
  showToast('Removed from wishlist.');
}

// ==========================================
// 🎮 RENTALS
// ==========================================
function renderRentals() {
  const active = document.getElementById('active-rentals');
  if (!active) return;

  const activeRentals = rentals.filter(r => r.status === 'active');

  if (!activeRentals.length) {
    active.innerHTML = '<p>No active rentals.</p>';
    return;
  }

  active.innerHTML = activeRentals.map(rental => {
    const game = rental.game || {};
    const dateStart = rental.startDate ? new Date(rental.startDate).toLocaleDateString() : '-';
    const dateEnd = rental.dueDate ? new Date(rental.dueDate).toLocaleDateString() : '-';
    const imageUrl = game.img || game.image || game.cover || '/photos/images.png';
    return `
      <div class="wishlist-card">
        <img src="${imageUrl}" alt="${game.title || 'Game cover'}" style="width:60px" />
        <h3>${game.title || 'Unknown Game'}</h3>
        <p>${game.platform || ''}</p>
        <p>${dateStart} → ${dateEnd}</p>
        <p>Status: ${rental.status}</p>
        <button onclick="returnGame('${rental._id}')">Return</button>
      </div>
    `;
  }).join('');
}

async function returnGame(rentalId) {
  const confirmed = await showConfirm('Are you sure you want to return this game?');
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/rentals/${rentalId}/return`, {
      method: 'PATCH',
      headers: authHeaders()
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || data.message || 'Failed to return game.', 'error');
      return;
    }

    await loadRentals();
    await refreshUI();
    showToast('Game returned successfully!', 'success');
  } catch (err) {
    console.error('Return failed:', err);
    showToast('Failed to return game.', 'error');
  }
}



// ==========================================
// 👤 PROFILE
// ==========================================
function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;

  const displayName = user.name || user.username || "Gamer";

  document.getElementById("nameText").innerText = displayName;
  document.getElementById("emailText").innerText = user.email || "No Email";
  document.getElementById("usernameText").innerText = user.username || "Unknown";
  document.getElementById("phoneText").innerText = user.phone || "N/A";

  // Avatar initials
  const avatarEl = document.getElementById('profileAvatar');
  if (avatarEl) {
    avatarEl.innerText = (user.username || user.name || '?').charAt(0).toUpperCase();
  }

  const activeCount = rentals.filter(r => r.status === 'active').length;
  const completedCount = rentals.filter(r => r.status !== 'active').length;
  document.getElementById('totalRentals').innerText = `${activeCount + completedCount} Games`;

  const wishlistIds = getWishlist();
  const profileSummary = document.getElementById('profile-summary');
  if (profileSummary) {
    profileSummary.innerText = `${activeCount} active rental${activeCount === 1 ? '' : 's'} • ${wishlistIds.length} wishlist item${wishlistIds.length === 1 ? '' : 's'}`;
  }

  // Always reset to view mode
  toggleEdit(false);
}

function editProfile() {
  toggleEdit(true);
}

function saveProfile() {
  const email = document.getElementById('emailInput').value;
  const username = document.getElementById('usernameInput').value;
  const phone = document.getElementById('phoneInput').value;

  const current = getCurrentUser();
  if (!current || !current._id) {
    showToast('No logged in user.');
    return;
  }

  fetch(`/api/users/${current._id}`, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify({ username, email, phone })
  }).then(async res => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || data.message || 'Failed to save profile', 'error');
      return;
    }

    const user = data.user || data;
    const minimal = {
      _id: user._id || user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone || ''
    };
    localStorage.setItem('currentUser', JSON.stringify(minimal));

    renderProfile();
    toggleEdit(false);
    showToast('Profile saved!', 'success');
  }).catch(err => {
    console.error('Save failed', err);
    showToast('Failed to save profile.', 'error');
  });
}

function toggleEdit(editing) {
  const user = getCurrentUser();
  if (editing && user) {
    document.getElementById('emailInput').value = user.email || '';
    document.getElementById('usernameInput').value = user.username || '';
    document.getElementById('phoneInput').value = user.phone || '';
  }

  // handle email, username normally
  ['email', 'username'].forEach(id => {
    document.getElementById(id + 'Text').style.display = editing ? 'none' : 'block';
    document.getElementById(id + 'Input').style.display = editing ? 'block' : 'none';
  });

  // handle phone separately because it has a container div
  document.getElementById('phoneText').style.display = editing ? 'none' : 'block';
  document.getElementById('phoneEditContainer').style.display = editing ? 'block' : 'none';

  document.getElementById('editBtn').style.display = editing ? 'none' : 'block';
  document.getElementById('saveBtn').style.display = editing ? 'block' : 'none';
}

// ==========================================
// 🎮 NAV HELPERS
// ==========================================
function goToGameDescription(gameID) {
  window.location.href = `/game-description?id=${gameID}`;
}



// ==========================================
// 🚀 INIT
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Hydrate currentUser from server
  try {
    const meRes = await fetch('/api/auth/me', { headers: authHeaders() });
    if (meRes.ok) {
      const me = await meRes.json();
      if (me && me._id) {
        const profileRes = await fetch(`/api/users/${me._id}`, { headers: authHeaders() });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const minimal = {
            _id: profile._id || profile.id,
            username: profile.username,
            email: profile.email,
            role: profile.role,
            phone: profile.phone || ''
          };
          localStorage.setItem('currentUser', JSON.stringify(minimal));
        }
      }
    } else {
      // Token is invalid — force re-login
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
      return;
    }
  } catch (e) {
  }

  await loadData();

  showSection('dashboard', document.querySelector('.sidebar nav button'));
});

window.addEventListener('storage', (event) => {
  if (['currentUser', 'token', 'pshub_wishlist'].includes(event.key)) {
    refreshUI();
  }
});
