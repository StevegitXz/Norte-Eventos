import { fetchNotifications, markNotificationAsRead, clearNotifications } from './api.js';
import { formatDateString } from './utils.js';

// ==========================================
// NOTIFICATIONS LOGIC
// ==========================================

export async function loadNotifications() {
    try {
        const notifs = await fetchNotifications();
        renderNotifications(notifs);
    } catch (err) {
        console.error('Erro ao carregar notificações', err);
    }
}

function renderNotifications(notifs) {
    const notifList = document.getElementById('notif-list');
    const notifBadge = document.getElementById('notif-badge');
    const exploreNotifList = document.getElementById('explore-notifications-list');

    if (notifBadge) {
        const unreadCount = notifs.filter(n => !n.lida).length;
        if (unreadCount > 0) {
            notifBadge.classList.remove('hidden');
        } else {
            notifBadge.classList.add('hidden');
        }
    }

    if (notifList) {
        notifList.innerHTML = '';
        if (notifs.length === 0) {
            notifList.innerHTML = '<div class="text-center text-sm text-gray-500 p-4">Nenhuma notificação nova.</div>';
        } else {
            notifs.forEach(n => {
                const div = document.createElement('div');
                div.className = `p-3 text-sm rounded-lg border-b border-gray-100 dark:border-slate-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${n.lida ? 'opacity-60' : 'bg-brand-green/5 dark:bg-brand-green/10'}`;
                div.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="mt-0.5 text-brand-green">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div>
                            <p class="text-gray-800 dark:text-gray-200 leading-snug">${n.mensagem}</p>
                            <p class="text-xs text-gray-400 mt-1">${formatDateString(n.criado_em.split('T')[0])}</p>
                        </div>
                    </div>
                `;
                
                div.addEventListener('click', async () => {
                    if (!n.lida) {
                        await markNotificationAsRead(n.id);
                        loadNotifications();
                    }
                });

                notifList.appendChild(div);
            });
        }
    }

    if (exploreNotifList) {
        exploreNotifList.innerHTML = '';
        if (notifs.length === 0) {
            exploreNotifList.innerHTML = '<p class="text-sm text-white/80">Nenhuma notificação recente.</p>';
        } else {
            notifs.forEach(n => {
                const div = document.createElement('div');
                div.className = `p-2 text-sm rounded-lg border-b border-white/10 cursor-pointer hover:bg-white/10 transition-colors ${n.lida ? 'opacity-60' : ''}`;
                div.innerHTML = `
                    <div class="flex items-start gap-2">
                        <div class="mt-0.5 text-white/80">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div>
                            <p class="text-white leading-snug">${n.mensagem}</p>
                        </div>
                    </div>
                `;
                div.addEventListener('click', async () => {
                    if (!n.lida) {
                        await markNotificationAsRead(n.id);
                        loadNotifications();
                    }
                });
                exploreNotifList.appendChild(div);
            });
        }
    }
}

export function setupNotificationsBindings() {
    const btnNotifs = document.getElementById('btn-notifications');
    const notifDropdown = document.getElementById('notif-dropdown');
    const btnClearNotifs = document.getElementById('btn-clear-notifs');

    if (btnNotifs && notifDropdown) {
        btnNotifs.addEventListener('click', () => {
            notifDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!btnNotifs.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.add('hidden');
            }
        });
    }

    if (btnClearNotifs) {
        btnClearNotifs.addEventListener('click', async () => {
            try {
                await clearNotifications();
                loadNotifications();
            } catch (err) {
                console.error('Erro ao limpar notificações', err);
            }
        });
    }
}
