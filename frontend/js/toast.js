function showToast(message, type = 'success') {
  // Check if toast container exists, if not create it
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 12px; font-family: sans-serif;';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#06b6d4' : '#ef4444'; // Cyan/Green or Red
  const icon = type === 'success' 
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

  toast.style.cssText = `display: flex; align-items: center; gap: 12px; min-width: 250px; padding: 12px 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); color: white; background-color: ${bgColor}; transform: translateY(40px); opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`;
  
  toast.innerHTML = `
    <div style="flex-shrink: 0; display: flex;">${icon}</div>
    <div style="font-weight: 500; font-size: 14px;">${message}</div>
    <button style="margin-left: auto; opacity: 0.7; cursor: pointer; background: none; border: none; color: white; display: flex;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" onclick="this.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  // Animate out and remove
  setTimeout(() => {
    toast.style.transform = 'translateY(40px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Sobrescrever a função alert globalmente (Opcional, mas útil para pegar os antigos)
window.alert = function(message) {
  // If it contains the word "Erro", display as error
  const type = message.toLowerCase().includes('erro') || message.toLowerCase().includes('falha') || message.toLowerCase().includes('não') ? 'error' : 'success';
  showToast(message, type);
};
