/**
 * PSHUB Toast Notification System
 * Replaces all browser alert() calls with styled in-page toasts.
 * 
 * Usage:
 *   showToast('Message here')               → default (blue)
 *   showToast('Done!', 'success')           → green
 *   showToast('Something failed', 'error')  → red
 *   showToast('Heads up', 'warning')        → orange
 *
 * For confirm() replacements:
 *   const confirmed = await showConfirm('Are you sure?')
 *   if (confirmed) { ... }
 */

(function () {

  // ─── Inject CSS once ───────────────────────────────────────────────────────
  if (!document.getElementById('pshub-toast-style')) {
    const style = document.createElement('style');
    style.id = 'pshub-toast-style';
    style.textContent = `
      #pshub-toast-container {
        position: fixed;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }

      .pshub-toast {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 260px;
        max-width: 380px;
        padding: 14px 18px;
        border-radius: 14px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 0.92rem;
        font-weight: 500;
        color: #fff;
        background: #1a1a1a;
        border: 1px solid #333;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        pointer-events: all;
        animation: pshub-slide-in 0.3s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
        position: relative;
        overflow: hidden;
      }

      .pshub-toast::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 4px;
        border-radius: 14px 0 0 14px;
      }

      .pshub-toast.info::before    { background: #00439c; }
      .pshub-toast.success::before { background: #28a745; }
      .pshub-toast.error::before   { background: #ff4444; }
      .pshub-toast.warning::before { background: #f59e0b; }

      .pshub-toast-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
      }

      .pshub-toast-msg {
        flex: 1;
        line-height: 1.4;
      }

      .pshub-toast-close {
        background: none;
        border: none;
        color: #888;
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0 0 0 8px;
        line-height: 1;
        transition: color 0.2s;
      }
      .pshub-toast-close:hover { color: #fff; }

      .pshub-toast.hiding {
        animation: pshub-slide-out 0.3s ease forwards;
      }

      @keyframes pshub-slide-in {
        from { opacity: 0; transform: translateX(40px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes pshub-slide-out {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(40px); }
      }

      /* ── Confirm Dialog ── */
      #pshub-confirm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pshub-fade-in 0.2s ease;
      }

      @keyframes pshub-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      #pshub-confirm-box {
        background: #111;
        border: 1px solid #333;
        border-radius: 18px;
        padding: 32px 28px 24px;
        max-width: 360px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.7);
        text-align: center;
        font-family: 'Segoe UI', sans-serif;
        color: #fff;
        animation: pshub-pop-in 0.25s cubic-bezier(0.25,0.46,0.45,0.94);
      }

      @keyframes pshub-pop-in {
        from { opacity: 0; transform: scale(0.9); }
        to   { opacity: 1; transform: scale(1); }
      }

      #pshub-confirm-box .confirm-icon {
        font-size: 2.2rem;
        margin-bottom: 14px;
      }

      #pshub-confirm-box p {
        font-size: 1rem;
        color: #ccc;
        line-height: 1.5;
        margin-bottom: 24px;
      }

      #pshub-confirm-box .confirm-btns {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      #pshub-confirm-box button {
        padding: 11px 28px;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        font-family: 'Segoe UI', sans-serif;
        transition: 0.2s;
      }

      #pshub-confirm-box .btn-cancel {
        background: #1a1a1a;
        color: #aaa;
        border: 1px solid #333;
      }
      #pshub-confirm-box .btn-cancel:hover {
        background: #222;
        color: #fff;
      }

      #pshub-confirm-box .btn-confirm {
        background: rgba(255,68,68,0.15);
        color: #ff4444;
        border: 1px solid rgba(255,68,68,0.3);
      }
      #pshub-confirm-box .btn-confirm:hover {
        background: #ff4444;
        color: #fff;
      }

      #pshub-confirm-box .btn-confirm.safe {
        background: rgba(0,67,156,0.15);
        color: #4d8fff;
        border: 1px solid rgba(0,67,156,0.3);
      }
      #pshub-confirm-box .btn-confirm.safe:hover {
        background: #00439c;
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Toast container ───────────────────────────────────────────────────────
  function getContainer() {
    let c = document.getElementById('pshub-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'pshub-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  // ─── showToast ─────────────────────────────────────────────────────────────
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };

  window.showToast = function (message, type = 'info', duration = 3500) {
    const container = getContainer();

    const toast = document.createElement('div');
    toast.className = `pshub-toast ${type}`;
    toast.innerHTML = `
      <span class="pshub-toast-icon">${icons[type] || icons.info}</span>
      <span class="pshub-toast-msg">${message}</span>
      <button class="pshub-toast-close" aria-label="Close">✕</button>
    `;

    const close = toast.querySelector('.pshub-toast-close');
    const dismiss = () => {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    close.addEventListener('click', dismiss);
    container.appendChild(toast);

    setTimeout(dismiss, duration);
  };

  // ─── showConfirm ───────────────────────────────────────────────────────────
  window.showConfirm = function (message, { dangerous = true } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'pshub-confirm-overlay';

      overlay.innerHTML = `
        <div id="pshub-confirm-box">
          <div class="confirm-icon">${dangerous ? '⚠️' : '💬'}</div>
          <p>${message}</p>
          <div class="confirm-btns">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-confirm ${dangerous ? '' : 'safe'}">Confirm</button>
          </div>
        </div>
      `;

      overlay.querySelector('.btn-cancel').addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });

      overlay.querySelector('.btn-confirm').addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });

      document.body.appendChild(overlay);
    });
  };

})();