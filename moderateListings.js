function switchTab(name, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    el.classList.add('active');
  }

  function removeRow(btn) {
    const row = btn.closest('tr');
    row.classList.add('removing');
    setTimeout(() => row.remove(), 300);
  }
