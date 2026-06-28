import { state } from './state.js';
import { formatDateString, escapeHTML } from './utils.js';
import { handleSubscription, deleteEvent, removeParticipant, addParticipant } from './api.js';
import { fetchAndRenderParticipants, loadEventsFromServer, loadExploreEvents, renderEvents, renderExploreEvents, enableEditMode } from './events.js';

// ==========================================
// UI FUNCTIONS
// ==========================================

export function switchTab(tabId) {
    const navLinks = document.querySelectorAll('.sidebar-menu .menu-item, .mobile-nav .mobile-nav-item');
    const tabs = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.classList.remove('active');
        const hrefAttr = link.getAttribute('href') || link.dataset.target;
        if (hrefAttr === `#${tabId}`) {
            link.classList.add('active');
        }
    });

    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabId) {
            tab.classList.add('active');
        }
    });

    const pageTitleEl = document.querySelector('.page-title');
    if (pageTitleEl) {
        if (tabId === 'explore-events') pageTitleEl.textContent = 'Início';
        else if (tabId === 'overview') pageTitleEl.textContent = 'Dashboard';
        else if (tabId === 'my-events') pageTitleEl.textContent = 'Meus Eventos';
        else if (tabId === 'create-event') {
            pageTitleEl.textContent = state.eventToEditId ? 'Editar Evento' : 'Novo Evento';
        }
        else if (tabId === 'manage-event') {
            pageTitleEl.textContent = 'Gerenciar Evento';
        }
        else if (tabId === 'settings') {
            pageTitleEl.textContent = 'Configurações';
        }
    }

    if (tabId === 'overview' || tabId === 'my-events') {
        renderEvents();
        renderStats();
    } else if (tabId === 'explore-events') {
        loadExploreEvents();
    }
}

export function renderStats() {
    const totalEventsVal = document.getElementById('stat-total-events');
    const totalInscriptionsVal = document.getElementById('stat-total-inscriptions');
    const totalCategoriesVal = document.getElementById('stat-total-categories');
    const nextEventDateVal = document.getElementById('stat-next-event');

    if (!totalEventsVal) return;

    totalEventsVal.textContent = state.events.length;
    const sumInscriptions = state.events.reduce((acc, curr) => acc + (parseInt(curr.inscritos) || 0), 0);
    totalInscriptionsVal.textContent = sumInscriptions;

    const uniqueCategories = [...new Set(state.events.map(ev => ev.categoria))];
    totalCategoriesVal.textContent = uniqueCategories.length || 0;

    const now = new Date();
    const upcomingEvents = state.events
        .filter(ev => new Date(`${ev.data}T${ev.hora || '00:00'}`) >= now)
        .sort((a, b) => new Date(`${a.data}T${a.hora || '00:00'}`) - new Date(`${b.data}T${b.hora || '00:00'}`));

    if (upcomingEvents.length > 0) {
        nextEventDateVal.textContent = formatDateString(upcomingEvents[0].data);
    } else {
        nextEventDateVal.textContent = '--/--/----';
    }
}

export function renderEmptyStateMarkup(title = 'Nenhum evento localizado', desc = 'Você ainda não tem eventos criados nesta categoria ou correspondentes à sua busca.') {
    return `
      <div class="empty-state form-full-width col-span-1 md:col-span-2 xl:col-span-3 text-center py-12">
        <div class="empty-state-icon flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-800 text-gray-400 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">${title}</h4>
        <p class="text-sm text-gray-500 mb-4">${desc}</p>
        <button class="btn-primary inline-flex btn-go-create px-6 py-2">Criar Novo Evento</button>
      </div>
    `;
}

export function openDeleteConfirmModal(id) {
    state.eventToDeleteId = id;
    const modalDelete = document.getElementById('modal-delete-confirm');
    if (modalDelete) modalDelete.classList.add('open');
}

export function closeDeleteConfirmModal() {
    state.eventToDeleteId = null;
    const modalDelete = document.getElementById('modal-delete-confirm');
    if (modalDelete) modalDelete.classList.remove('open');
}

export function cancelEditMode() {
    state.eventToEditId = null;
    const eventForm = document.getElementById('event-form');
    if (eventForm) eventForm.reset();
    
    const bannerOptions = document.querySelectorAll('.banner-option');
    bannerOptions.forEach(o => o.classList.remove('selected'));
    if (bannerOptions[0]) bannerOptions[0].classList.add('selected');
    state.selectedBannerClass = 'event-card-gradient-1';

    const titleEl = document.getElementById('form-view-title');
    if (titleEl) titleEl.textContent = 'Organizar Novo Evento';
    
    const submitTextEl = document.getElementById('btn-submit-text');
    if (submitTextEl) submitTextEl.textContent = 'Publicar Evento';
}

export function setupUIBindings() {
    // Topbar and Sidebars
    const navLinks = document.querySelectorAll('.sidebar-menu .menu-item, .mobile-nav .mobile-nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = (link.getAttribute('href') || link.dataset.target).substring(1);
            if (targetId !== 'create-event') cancelEditMode();
            switchTab(targetId);
        });
    });

    // Botão de perfil no sidebar-header (fora do sidebar-menu)
    const btnProfileSettings = document.querySelector('.sidebar-header .menu-item[data-target="#settings"]');
    if (btnProfileSettings) {
        btnProfileSettings.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('settings');
        });
    }

    const linkToMyEvents = document.querySelector('.btn-link-my-events');
    if (linkToMyEvents) {
        linkToMyEvents.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('my-events');
        });
    }

    const btnTopbarCreate = document.querySelector('.btn-new-event');
    if (btnTopbarCreate) {
        btnTopbarCreate.addEventListener('click', () => {
            cancelEditMode();
            switchTab('create-event');
        });
    }

    const bannerOptions = document.querySelectorAll('.banner-option');
    bannerOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            bannerOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            state.selectedBannerClass = opt.dataset.gradient;
        });
    });

    // Filters and Search (Dashboard/Meus Eventos)
    const categoryFilters = document.querySelectorAll('.filters-group:not(.explore-filters-group) .filter-btn');
    categoryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilterCategory = btn.dataset.category;
            renderEvents();
        });
    });

    const searchInput = document.getElementById('topbar-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderEvents();
        });
    }

    const sortSelect = document.getElementById('sort-events-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.currentSort = e.target.value;
            renderEvents();
        });
    }

    // Explore page: search bar + filter toggle + category filters
    const exploreSearchInput = document.getElementById('explore-search-input');
    if (exploreSearchInput) {
        exploreSearchInput.addEventListener('input', (e) => {
            state.exploreSearchQuery = e.target.value;
            renderExploreEvents();
        });
    }

    const btnToggleFilters = document.getElementById('btn-toggle-explore-filters');
    const filtersContainer = document.getElementById('explore-filters-container');
    if (btnToggleFilters && filtersContainer) {
        btnToggleFilters.addEventListener('click', () => {
            filtersContainer.classList.toggle('hidden');
        });
    }

    const exploreFilterBtns = document.querySelectorAll('.explore-filters-group .filter-btn');
    exploreFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            exploreFilterBtns.forEach(b => {
                b.classList.remove('active', 'bg-brand-green', 'text-white');
                b.classList.add('bg-gray-100', 'dark:bg-slate-800', 'text-gray-600', 'dark:text-gray-300');
            });
            btn.classList.add('active', 'bg-brand-green', 'text-white');
            btn.classList.remove('bg-gray-100', 'dark:bg-slate-800', 'text-gray-600', 'dark:text-gray-300');
            state.exploreFilterCategory = btn.dataset.category;
            renderExploreEvents();
        });
    });

    // Modals bindings
    const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener('click', closeDeleteConfirmModal);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteConfirmModal);
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (!state.eventToDeleteId) return;
            try {
                await deleteEvent(state.eventToDeleteId);
                closeDeleteConfirmModal();
                loadEventsFromServer();
            } catch (err) {
                console.error('Erro ao excluir evento', err);
            }
        });
    }
    
    const btnCloseDeleteAccountModal = document.getElementById('btn-close-delete-account-modal');
    const btnCancelDeleteAccount = document.getElementById('btn-cancel-delete-account');
    const btnConfirmDeleteAccount = document.getElementById('btn-confirm-delete-account');

    if (btnCloseDeleteAccountModal) btnCloseDeleteAccountModal.addEventListener('click', closeDeleteAccountConfirmModal);
    if (btnCancelDeleteAccount) btnCancelDeleteAccount.addEventListener('click', closeDeleteAccountConfirmModal);
    if (btnConfirmDeleteAccount) {
        btnConfirmDeleteAccount.addEventListener('click', async () => {
            try {
                await deleteAccount();
                closeDeleteAccountConfirmModal();
                window.location.href = '/login';
            } catch (err) {
                console.error('Erro ao excluir conta', err);
            }
        });
    }

    // Sidebar Collapse
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const mainSidebar = document.getElementById('main-sidebar');
    if (btnToggleSidebar && mainSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            mainSidebar.classList.toggle('collapsed');
        });
    }

    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-go-create')) {
            cancelEditMode();
            switchTab('create-event');
        }
    });
}
