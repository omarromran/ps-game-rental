(function () {

  if (!document.getElementById('pshub-ui-style')) {
    const style = document.createElement('style');
    style.id = 'pshub-ui-style';
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
        animation: pshub-slide-in 0.3s ease forwards;
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

      .pshub-toast.info::before { background: #00439c; }
      .pshub-toast.success::before { background: #28a745; }
      .pshub-toast.error::before { background: #ff4444; }
      .pshub-toast.warning::before { background: #f59e0b; }

      .pshub-toast-icon {
        font-size: 1.2rem;
      }

      .pshub-toast-msg {
        flex: 1;
      }

      .pshub-toast-close {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
      }

      .pshub-toast.hiding {
        animation: pshub-slide-out 0.3s ease forwards;
      }

      @keyframes pshub-slide-in {
        from { opacity: 0; transform: translateX(40px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes pshub-slide-out {
        from { opacity: 1; }
        to { opacity: 0; transform: translateX(40px); }
      }

      /* CONFIRM */
      #pshub-confirm-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100000;
      }

      #pshub-confirm-box {
        background: #111;
        border: 1px solid #333;
        border-radius: 18px;
        padding: 28px;
        width: 90%;
        max-width: 360px;
        text-align: center;
        color: white;
      }

      #pshub-confirm-box p {
        margin-bottom: 20px;
      }

      #pshub-confirm-box button {
        margin: 5px;
        padding: 10px 20px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
      }

      .btn-cancel {
        background: #222;
        color: #aaa;
      }

      .btn-confirm {
        background: #ff4444;
        color: white;
      }

      .btn-confirm.safe {
        background: #00439c;
      }
    `;
    document.head.appendChild(style);
  }

  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  function getContainer() {
    let c = document.getElementById('pshub-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'pshub-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  window.showToast = function (message, type = 'info', duration = 3500) {
    const container = getContainer();

    const toast = document.createElement('div');
    toast.className = `pshub-toast ${type}`;

    toast.innerHTML = `
      <span class="pshub-toast-icon">${icons[type] || icons.info}</span>
      <span class="pshub-toast-msg">${message}</span>
      <button class="pshub-toast-close">✕</button>
    `;

    const dismiss = () => {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.pshub-toast-close').onclick = dismiss;

    container.appendChild(toast);
    setTimeout(dismiss, duration);
  };

  window.showConfirm = function (message, { dangerous = true } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'pshub-confirm-overlay';

      overlay.innerHTML = `
        <div id="pshub-confirm-box">
          <p>${message}</p>
          <button class="btn-cancel">Cancel</button>
          <button class="btn-confirm ${dangerous ? '' : 'safe'}">Confirm</button>
        </div>
      `;

      overlay.querySelector('.btn-cancel').onclick = () => {
        overlay.remove();
        resolve(false);
      };

      overlay.querySelector('.btn-confirm').onclick = () => {
        overlay.remove();
        resolve(true);
      };

      document.body.appendChild(overlay);
    });
  };

})();