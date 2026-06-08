let users = [];


const getAuthHeaders = (json = false) => {
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
};

const triggerNotification = (msg, type) => {
    if (typeof showToast === 'function') {
        showToast(msg, type);
    } else {
        alert(msg);
    }
};

async function loadPendingStores() {
    try {
        const res = await fetch('/api/users', {
            headers: getAuthHeaders()
        });
        
        if (!res.ok) throw new Error(`Failed to fetch users (Status ${res.status})`);

        const data = await res.json();
        users = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

        renderTable();
    } catch (err) {
        console.error(err);
        document.getElementById('lender-table-body').innerHTML =
            `<tr><td colspan="5" style="text-align:center; color: red;">Error loading data: ${err.message}</td></tr>`;
    }
}

function renderTable() {
    const tableBody = document.getElementById('lender-table-body');
    tableBody.innerHTML = "";

    const pendingStores = users.filter(u =>
        u.role === "Store" && u.approved === false
    );

    if (pendingStores.length === 0) {
        tableBody.innerHTML =
            `<tr><td colspan="5" style="text-align:center">No pending approvals.</td></tr>`;
        return;
    }

    pendingStores.forEach(store => {
        const row = `
            <tr id="row-${store._id}">
                <td>${store._id}</td>
                <td><strong>${store.username}</strong></td>
                <td>${store.email}</td>
                <td><span class="status-badge" style="background-color: #ffc107; color: black; padding: 3px 8px; border-radius: 4px;">Pending</span></td>
                <td>
                    <button class="btn-check" onclick="handleApproval('${store._id}', 'approve')" style="cursor:pointer; margin-right: 5px;">
                        Accept
                    </button>
                    <button class="btn-trash" onclick="handleApproval('${store._id}', 'decline')" style="cursor:pointer;">
                        Decline
                    </button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

async function handleApproval(id, action) {

const confirmed = await showConfirm(
`Are you sure you want to ${action} this store registration?`
);

if (!confirmed) return;

try {
if (action === 'approve') {

    const res = await fetch(`/api/users/${id}/approve`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Approve operation failed on server');

    users = users.map(u =>
        u._id === id ? { ...u, approved: true } : u
    );

   triggerNotification('Store approved successfully!', 'success');
   await loadPendingStores();

} else {

    const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Decline/Delete operation failed on server');

    users = users.filter(u => u._id !== id);

    triggerNotification('Store registration application declined.', 'info');
}

const row = document.getElementById(`row-${id}`);
if (row) row.remove();

} catch (err) {
console.error(err);
triggerNotification(err.message || 'Operation failed. Please try again.', 'error');
}
}

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    loadPendingStores();
});

function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('pshub_wishlist');
    window.location.href = '/login';
}