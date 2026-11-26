import { fetchNotifications, markNotificationAsRead, clearNotifications } from './api.js';
import { formatDateString, escapeHTML } from './utils.js';

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
            notifList.innerHTML = '<div class="text-center text-sm text-stone-500 dark:text-gray-400 p-4">Nenhuma notificação nova.</div>';
        } else {
            notifs.forEach(n => {
                const div = document.createElement('div');
                div.className = `p-3 text-sm rounded-xl border-b border-stone-100 dark:border-white/5 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-colors ${n.lida ? 'opacity-60' : 'bg-brand-green/5 dark:bg-brand-emerald/10'}`;
                div.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="mt-0.5 text-brand-green dark:text-brand-emerald shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div>
                            <p class="text-brand-dark dark:text-gray-200 leading-snug">${escapeHTML(n.mensagem)}</p>
                            <p class="text-xs text-stone-400 dark:text-gray-500 mt-1">${escapeHTML(formatDateString(n.criado_em.split('T')[0]))}</p>
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
            exploreNotifList.innerHTML = '<p class="text-sm text-stone-500 dark:text-gray-400">Nenhuma notificação recente.</p>';
        } else {
            notifs.forEach(n => {
                const div = document.createElement('div');
                div.className = `p-2.5 text-sm rounded-xl border-b border-stone-100 dark:border-white/5 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-colors ${n.lida ? 'opacity-60' : 'bg-brand-green/[0.04] dark:bg-brand-emerald/10'}`;
                div.innerHTML = `
                    <div class="flex items-start gap-2.5">
                        <div class="mt-0.5 text-brand-green dark:text-brand-emerald shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div>
                            <p class="text-stone-700 dark:text-gray-200 leading-snug">${escapeHTML(n.mensagem)}</p>
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
