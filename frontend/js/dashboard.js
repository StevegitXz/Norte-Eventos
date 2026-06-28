import { initAuth, setupAuthBindings } from './modules/auth.js';
import { setupUIBindings } from './modules/ui.js';
import { loadEventsFromServer, setupEventsBindings, loadExploreEvents } from './modules/events.js';
import { loadNotifications, setupNotificationsBindings } from './modules/notifications.js';

// ==========================================================================
// Norte Eventos — Dashboard Entry Point
// ==========================================================================

window.addEventListener('error', function(event) {
    alert('Global Error: ' + event.message + ' at ' + event.filename + ':' + event.lineno);
});
window.addEventListener('unhandledrejection', function(event) {
    alert('Unhandled Promise Rejection: ' + (event.reason && event.reason.message || event.reason));
});

(async () => {
    // 1. Iniciar Autenticação e Preencher Perfil
    await initAuth();

    // 2. Lógica de Dark Mode
    const themeToggleBtn = document.getElementById('theme-toggle');
    const isDarkMode = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            if (document.documentElement.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // 3. Setup de Bindings e Lógicas Independentes
    setupUIBindings();
    setupAuthBindings();
    setupEventsBindings();
    setupNotificationsBindings();

    // 4. Carregar Dados Iniciais
    loadNotifications();
    loadEventsFromServer();
    // A tab padrão agora é "Início" (explore-events), então carregar logo
    loadExploreEvents();
})();
