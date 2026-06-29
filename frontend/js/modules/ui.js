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

    // Topbar Search — sincroniza com ambas as abas (Início e Meus Eventos)
    const searchInput = document.getElementById('topbar-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            state.exploreSearchQuery = e.target.value;
            renderEvents();
            renderExploreEvents();
            // Sincronizar com a barra de busca da aba Início
            const exploreInput = document.getElementById('explore-search-input');
            if (exploreInput && exploreInput.value !== e.target.value) {
                exploreInput.value = e.target.value;
            }
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
            state.searchQuery = e.target.value;
            renderExploreEvents();
            renderEvents();
            // Sincronizar com a barra de busca do topbar
            const topbarInput = document.getElementById('topbar-search-input');
            if (topbarInput && topbarInput.value !== e.target.value) {
                topbarInput.value = e.target.value;
            }
        });
    }

    const btnToggleViewMode = document.getElementById('btn-toggle-view-mode');
    if (btnToggleViewMode) {
        btnToggleViewMode.addEventListener('click', () => {
            state.exploreListView = !state.exploreListView;
            
            // Troca o ícone do botão
            if (state.exploreListView) {
                btnToggleViewMode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M112,48V104a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V48A16,16,0,0,1,40,32H96A16,16,0,0,1,112,48Zm104-16H160a16,16,0,0,0-16,16v56a16,16,0,0,0,16,16h56a16,16,0,0,0,16-16V48A16,16,0,0,0,216,32ZM112,152v56a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V152a16,16,0,0,1,16-16H96A16,16,0,0,1,112,152Zm120,0v56a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V152a16,16,0,0,1,16-16h56A16,16,0,0,1,232,152Z" opacity="0.2" fill="currentColor"></path><path d="M96,24H40A24,24,0,0,0,16,48v56a24,24,0,0,0,24,24H96a24,24,0,0,0,24-24V48A24,24,0,0,0,96,24Zm8,80a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V48a8,8,0,0,1,8-8H96a8,8,0,0,1,8,8ZM216,24H160a24,24,0,0,0-24,24v56a24,24,0,0,0,24,24h56a24,24,0,0,0,24-24V48A24,24,0,0,0,216,24Zm8,80a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V48a8,8,0,0,1,8-8h56a8,8,0,0,1,8,8Zm-128,24H40a24,24,0,0,0-24,24v56a24,24,0,0,0,24,24H96a24,24,0,0,0,24-24V152A24,24,0,0,0,96,128Zm8,80a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V152a8,8,0,0,1,8-8H96a8,8,0,0,1,8,8Zm112-80H160a24,24,0,0,0-24,24v56a24,24,0,0,0,24,24h56a24,24,0,0,0,24-24V152A24,24,0,0,0,216,128Zm8,80a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V152a8,8,0,0,1,8-8h56a8,8,0,0,1,8,8Z" fill="currentColor"></path></svg>`;
            } else {
                btnToggleViewMode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path d="M216,64H88a8,8,0,0,1,0-16H216a8,8,0,0,1,0,16Zm0,56H88a8,8,0,0,1,0-16H216a8,8,0,0,1,0,16Zm0,56H88a8,8,0,0,1,0-16H216a8,8,0,0,1,0,16ZM56,48A12,12,0,1,0,68,60,12,12,0,0,0,56,48Zm0,56a12,12,0,1,0,12,12A12,12,0,0,0,56,104Zm0,56a12,12,0,1,0,12,12A12,12,0,0,0,56,160Z" opacity="0.2" fill="currentColor"></path><path d="M224,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM88,72H216a8,8,0,0,0,0-16H88a8,8,0,0,0,0,16ZM216,184H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM60,120a8,8,0,1,0,8,8A8,8,0,0,0,60,120Zm0-56a8,8,0,1,0,8,8A8,8,0,0,0,60,64Zm0,112a8,8,0,1,0,8,8A8,8,0,0,0,60,176Z" fill="currentColor"></path></svg>`;
            }

            import('./events.js').then(m => m.renderExploreEvents());
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

    const btnCloseEventDetails = document.getElementById('btn-close-event-details');
    if (btnCloseEventDetails) {
        btnCloseEventDetails.addEventListener('click', () => {
            import('./events.js').then(m => m.closeEventProductModal());
        });
    }
    
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                if (overlay.id === 'modal-delete-confirm') closeDeleteConfirmModal();
                else if (overlay.id === 'modal-event-details') import('./events.js').then(m => m.closeEventProductModal());
            }
        });
    });

    // Nota: O modal de exclusão de conta é gerenciado por auth.js (setupAuthBindings)

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
