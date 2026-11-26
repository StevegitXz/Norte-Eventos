function showToast(message, type = 'success') {
  // Check if toast container exists, if not create it
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  const accentColor = isSuccess ? '#10B981' : '#F43F5E';
  const borderColor = isSuccess ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.4)';
  const icon = isSuccess
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

  toast.style.cssText = `display: flex; align-items: center; gap: 12px; min-width: 280px; max-width: 380px; padding: 14px 16px; border-radius: 14px; background: rgba(11, 25, 20, 0.94); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid ${borderColor}; box-shadow: 0 12px 32px rgba(7, 16, 13, 0.28); color: #F7F7F4; transform: translateY(30px); opacity: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);`;

  const iconWrapper = document.createElement('div');
  iconWrapper.style.cssText = `flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px; background: ${isSuccess ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.14)'}; color: ${accentColor};`;
  iconWrapper.innerHTML = icon;

  const messageWrapper = document.createElement('div');
  messageWrapper.style.cssText = 'font-weight: 500; font-size: 13.5px; line-height: 1.4; color: #F7F7F4;';
  messageWrapper.textContent = String(message ?? '');

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Fechar notificação');
  closeBtn.style.cssText = 'margin-left: auto; opacity: 0.65; cursor: pointer; background: none; border: none; color: #D6D3D1; display: flex; padding: 4px; border-radius: 6px; transition: opacity 0.2s;';
  closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeBtn.addEventListener('mouseover', () => { closeBtn.style.opacity = '1'; });
  closeBtn.addEventListener('mouseout', () => { closeBtn.style.opacity = '0.65'; });
  closeBtn.addEventListener('click', () => { toast.remove(); });

  toast.appendChild(iconWrapper);
  toast.appendChild(messageWrapper);
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  // Animate out and remove
  setTimeout(() => {
    toast.style.transform = 'translateY(30px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Sobrescrever a função alert globalmente (Opcional, mas útil para pegar os antigos)
window.alert = function(message) {
  const msgStr = String(message ?? '');
  const type = msgStr.toLowerCase().includes('erro') || msgStr.toLowerCase().includes('falha') || msgStr.toLowerCase().includes('não') ? 'error' : 'success';
  showToast(msgStr, type);
};
