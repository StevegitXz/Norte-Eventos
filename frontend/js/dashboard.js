/* ==========================================================================
   Norte Eventos — Dashboard JS Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. AUTHENTICATION CHECK
  const token = getCookie('norte_eventos_token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  const userData = parseJwt(token);
  if (!userData) {
    window.location.href = '/login';
    return;
  }

  // 1.5 DARK MODE LOGIC
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIconDark = document.getElementById('theme-icon-dark');
  const themeIconLight = document.getElementById('theme-icon-light');
  
  // Check local storage or system preference
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

  // Display User Information
  const userEmail = userData.email || 'organizador@norteeventos.com';
  const userName = extractUsername(userEmail);
  
  document.querySelectorAll('.user-name-display').forEach(el => {
    el.textContent = userName;
  });
  document.querySelectorAll('.user-email-display').forEach(el => {
    el.textContent = userEmail;
  });
  document.querySelectorAll('.avatar').forEach(el => {
    el.textContent = userName.substring(0, 2).toUpperCase();
  });

  // 2. STATE VARIABLES
  let events = [];
  let currentFilterCategory = 'Tudo';
  let searchQuery = '';
  let currentSort = 'date-asc';
  let eventToDeleteId = null;
  let eventToEditId = null;
  let selectedBannerClass = 'event-card-gradient-1';

  // Fetch events from Backend
  async function loadEventsFromServer() {
    try {
      const response = await fetch('/api/eventos');
      if (response.ok) {
        const data = await response.json();
        // Format dates from ISO string (returned by DB) to YYYY-MM-DD for consistency
        events = data.map(ev => ({
          ...ev,
          data: ev.data.split('T')[0], 
          hora: ev.hora ? ev.hora.substring(0, 5) : '00:00' // Ensure HH:MM
        }));
        renderStats();
        renderEvents();
      } else {
        if (response.status === 401) {
          window.location.href = '/login';
        } else {
          console.error('Erro ao buscar eventos.');
        }
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
    }
  }

  // 3. TAB NAVIGATION SYSTEM
  const navLinks = document.querySelectorAll('.sidebar-menu .menu-item, .mobile-nav .mobile-nav-item');
  const tabs = document.querySelectorAll('.tab-content');

  function switchTab(tabId) {
    // Remove active classes
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

    // Page title dynamic update
    const pageTitleEl = document.querySelector('.page-title');
    if (pageTitleEl) {
      if (tabId === 'overview') pageTitleEl.textContent = 'Início';
      else if (tabId === 'my-events') pageTitleEl.textContent = 'Meus Eventos';
      else if (tabId === 'create-event') {
        pageTitleEl.textContent = eventToEditId ? 'Editar Evento' : 'Novo Evento';
      }
    }

    // Custom tab lifecycle tasks
    if (tabId === 'overview' || tabId === 'my-events') {
      renderEvents();
      renderStats();
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = (link.getAttribute('href') || link.dataset.target).substring(1);
      
      // If switching away from create-event, reset edit mode
      if (targetId !== 'create-event') {
        cancelEditMode();
      }
      
      switchTab(targetId);
    });
  });

  // Link inside welcome banner
  const linkToMyEvents = document.querySelector('.btn-link-my-events');
  if (linkToMyEvents) {
    linkToMyEvents.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('my-events');
    });
  }

  // Quick action "+ Criar Evento" in Topbar
  const btnTopbarCreate = document.querySelector('.btn-new-event');
  if (btnTopbarCreate) {
    btnTopbarCreate.addEventListener('click', () => {
      cancelEditMode();
      switchTab('create-event');
    });
  }

  // 4. BANNER GRADIENT SELECTOR (FORM)
  const bannerOptions = document.querySelectorAll('.banner-option');
  bannerOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      bannerOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedBannerClass = opt.dataset.gradient;
    });
  });

  // 5. CRUD: EVENT OPERATIONS & RENDERING

  // Stats calculation
  function renderStats() {
    const totalEventsVal = document.getElementById('stat-total-events');
    const totalInscriptionsVal = document.getElementById('stat-total-inscriptions');
    const totalCategoriesVal = document.getElementById('stat-total-categories');
    const nextEventDateVal = document.getElementById('stat-next-event');

    if (!totalEventsVal) return;

    totalEventsVal.textContent = events.length;

    const sumInscriptions = events.reduce((acc, curr) => acc + (parseInt(curr.inscritos) || 0), 0);
    totalInscriptionsVal.textContent = sumInscriptions;

    const uniqueCategories = [...new Set(events.map(ev => ev.categoria))];
    totalCategoriesVal.textContent = uniqueCategories.length || 0;

    // Next event calculation
    const now = new Date();
    const upcomingEvents = events
      .filter(ev => new Date(`${ev.data}T${ev.hora || '00:00'}`) >= now)
      .sort((a, b) => new Date(`${a.data}T${a.hora || '00:00'}`) - new Date(`${b.data}T${b.hora || '00:00'}`));

    if (upcomingEvents.length > 0) {
      nextEventDateVal.textContent = formatDateString(upcomingEvents[0].data);
    } else {
      nextEventDateVal.textContent = '--/--/----';
    }
  }

  // Filtering and Sorting logic
  function getFilteredEvents() {
    return events.filter(ev => {
      // Category filter
      const matchesCategory = currentFilterCategory === 'Tudo' || ev.categoria === currentFilterCategory;
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        ev.nome.toLowerCase().includes(searchLower) || 
        (ev.descricao && ev.descricao.toLowerCase().includes(searchLower)) || 
        ev.local.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (currentSort === 'date-asc') {
        return new Date(`${a.data}T${a.hora || '00:00'}`) - new Date(`${b.data}T${b.hora || '00:00'}`);
      } else if (currentSort === 'date-desc') {
        return new Date(`${b.data}T${b.hora || '00:00'}`) - new Date(`${a.data}T${a.hora || '00:00'}`);
      } else if (currentSort === 'inscritos-desc') {
        return b.inscritos - a.inscritos;
      }
      return 0;
    });
  }

  // Main Render Function
  function renderEvents() {
    const listOverview = document.getElementById('recent-events-list');
    const listMyEvents = document.getElementById('my-events-list');
    const filtered = getFilteredEvents();

    // Render Overview Recent Events (Limit to 3)
    if (listOverview) {
      listOverview.innerHTML = '';
      if (events.length === 0) {
        listOverview.innerHTML = renderEmptyStateMarkup();
      } else {
        const recent = [...events]
          .sort((a, b) => new Date(`${b.data}T${b.hora || '00:00'}`) - new Date(`${a.data}T${a.hora || '00:00'}`))
          .slice(0, 3);
        
        recent.forEach(ev => {
          listOverview.appendChild(createEventCardElement(ev));
        });
      }
    }

    // Render My Events List
    if (listMyEvents) {
      listMyEvents.innerHTML = '';
      if (filtered.length === 0) {
        listMyEvents.innerHTML = renderEmptyStateMarkup();
      } else {
        filtered.forEach(ev => {
          listMyEvents.appendChild(createEventCardElement(ev));
        });
      }
    }
  }

  // Create Card element
  function createEventCardElement(ev) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 flex flex-col event-card';
    card.dataset.id = ev.id;

    card.innerHTML = `
      <div class="h-24 p-4 flex items-start justify-end ${ev.bannerClass || 'event-card-gradient-1'}">
        <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white tracking-wide shadow-sm">${ev.categoria}</span>
      </div>
      <div class="p-5 flex-1 flex flex-col">
        <div class="flex items-center gap-2 text-sm font-semibold text-brand-green mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${formatDateString(ev.data)} às ${ev.hora || '00:00'}</span>
        </div>
        <h4 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 leading-tight">${escapeHTML(ev.nome)}</h4>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">${escapeHTML(ev.descricao || 'Sem descrição cadastrada.')}</p>
        
        <div class="space-y-2 mb-5">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span class="truncate" title="${escapeHTML(ev.local)}">${escapeHTML(ev.local)}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>${ev.inscritos} / ${ev.capacidade} Inscritos</span>
          </div>
        </div>

        <div class="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
          <button class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-brand-dark bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 transition-colors btn-action btn-edit" data-id="${ev.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Editar
          </button>
          <button class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors btn-action btn-delete" data-id="${ev.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Excluir
          </button>
        </div>
      </div>
    `;

    // Hook edit & delete button events inside the card
    card.querySelector('.btn-edit').addEventListener('click', () => {
      enableEditMode(ev.id);
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      openDeleteConfirmModal(ev.id);
    });

    return card;
  }

  function renderEmptyStateMarkup() {
    return `
      <div class="empty-state form-full-width">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <h4>Nenhum evento localizado</h4>
        <p>Você ainda não tem eventos criados nesta categoria ou correspondentes à sua busca.</p>
        <button class="btn-new-event btn-go-create">Criar Novo Evento</button>
      </div>
    `;
  }

  // Delegate event for empty state create button
  document.body.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('btn-go-create')) {
      cancelEditMode();
      switchTab('create-event');
    }
  });

  // 6. CREATE / EDIT FORM SUBMIT
  const eventForm = document.getElementById('event-form');
  if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = document.getElementById('event-nome').value.trim();
      const categoria = document.getElementById('event-categoria').value;
      const data = document.getElementById('event-data').value;
      const hora = document.getElementById('event-hora').value;
      const local = document.getElementById('event-local').value.trim();
      const descricao = document.getElementById('event-desc').value.trim();
      const capacidade = parseInt(document.getElementById('event-capacidade').value) || 100;

      if (!nome || !categoria || !data || !local) {
        alert('Por favor, preencha todos os campos obrigatórios (*).');
        return;
      }

      const eventoData = {
        nome,
        categoria,
        data,
        hora,
        local,
        descricao,
        capacidade,
        bannerClass: selectedBannerClass
      };

      try {
        if (eventToEditId) {
          // Editing existing event
          const response = await fetch('/api/eventos/' + eventToEditId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventoData)
          });

          if (response.ok) {
            alert('Evento atualizado com sucesso!');
          } else {
            const err = await response.json();
            alert('Erro ao atualizar: ' + err.erro);
            return;
          }
        } else {
          // Creating new event
          eventoData.inscritos = 0; // Eventos novos iniciam com 0 inscritos
          const response = await fetch('/api/eventos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventoData)
          });

          if (response.ok) {
            alert('Evento criado com sucesso!');
          } else {
            const err = await response.json();
            alert('Erro ao criar: ' + err.erro);
            return;
          }
        }

        // Reload events from server and reset UI
        await loadEventsFromServer();
        cancelEditMode(); 
        switchTab('my-events');

      } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro de conexão ao salvar evento.');
      }
    });

    // Cancel Button in Form
    const btnCancelForm = document.getElementById('btn-cancel-form');
    if (btnCancelForm) {
      btnCancelForm.addEventListener('click', () => {
        cancelEditMode();
        switchTab('my-events');
      });
    }
  }

  // Switch to Edit Mode
  function enableEditMode(id) {
    const ev = events.find(e => e.id == id);
    if (!ev) return;

    eventToEditId = ev.id;
    
    // Fill form fields
    document.getElementById('event-nome').value = ev.nome;
    document.getElementById('event-categoria').value = ev.categoria;
    document.getElementById('event-data').value = ev.data;
    document.getElementById('event-hora').value = ev.hora || '';
    document.getElementById('event-local').value = ev.local;
    document.getElementById('event-desc').value = ev.descricao || '';
    document.getElementById('event-capacidade').value = ev.capacidade || 100;

    // Set active banner gradient
    selectedBannerClass = ev.bannerClass || 'event-card-gradient-1';
    bannerOptions.forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.gradient === selectedBannerClass) {
        opt.classList.add('selected');
      }
    });

    // Update headings/buttons in form
    document.getElementById('form-view-title').textContent = 'Editar Detalhes do Evento';
    document.getElementById('btn-submit-text').textContent = 'Salvar Alterações';

    switchTab('create-event');
  }

  // Cancel Edit Mode & Reset Form
  function cancelEditMode() {
    eventToEditId = null;
    if (eventForm) eventForm.reset();
    
    // Reset banner selector
    bannerOptions.forEach(o => o.classList.remove('selected'));
    bannerOptions[0].classList.add('selected');
    selectedBannerClass = 'event-card-gradient-1';

    // Reset headers
    const titleEl = document.getElementById('form-view-title');
    if (titleEl) titleEl.textContent = 'Organizar Novo Evento';
    
    const submitTextEl = document.getElementById('btn-submit-text');
    if (submitTextEl) submitTextEl.textContent = 'Publicar Evento';
  }

  // 7. DELETE CONFIRM MODAL
  const modalDelete = document.getElementById('modal-delete-confirm');
  const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  function openDeleteConfirmModal(id) {
    eventToDeleteId = id;
    if (modalDelete) modalDelete.classList.add('open');
  }

  function closeDeleteConfirmModal() {
    eventToDeleteId = null;
    if (modalDelete) modalDelete.classList.remove('open');
  }

  if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener('click', closeDeleteConfirmModal);
  if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteConfirmModal);

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (eventToDeleteId) {
        try {
          const response = await fetch('/api/eventos/' + eventToDeleteId, {
            method: 'DELETE'
          });

          if (response.ok) {
            alert('Evento excluído com sucesso!');
            await loadEventsFromServer();
            closeDeleteConfirmModal();
          } else {
            const err = await response.json();
            alert('Erro ao excluir: ' + err.erro);
          }
        } catch (error) {
          console.error('Erro na requisição de exclusão:', error);
          alert('Erro de conexão ao excluir evento.');
        }
      }
    });
  }

  // 8. CATEGORY AND SEARCH FILTERS (MY EVENTS TAB)
  const categoryFilters = document.querySelectorAll('.filters-group .filter-btn');
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterCategory = btn.dataset.category;
      renderEvents();
    });
  });

  // Search input event
  const searchInput = document.getElementById('topbar-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderEvents();
    });
  }

  // Sort select event
  const sortSelect = document.getElementById('sort-events-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderEvents();
    });
  }

  // 9. LOG OUT LOGIC
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      // Remove token cookie by setting past expiration date
      document.cookie = 'norte_eventos_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';
      alert('Sessão finalizada com sucesso. Até logo!');
      window.location.href = '/login';
    });
  }

  // 10. RUN INITIAL RENDER
  loadEventsFromServer();
});

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

// Parse Cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Decode JWT payload without server verification (for client presentation)
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Extract Username from Email
function extractUsername(email) {
  if (!email) return 'Organizador';
  const namePart = email.split('@')[0];
  // Replace symbols and capitalize
  const cleaned = namePart.replace(/[._-]/g, ' ');
  return cleaned.replace(/\b\w/g, char => char.toUpperCase());
}

// Format Date to BR Format (DD/MM/YYYY)
function formatDateString(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Simple HTML escaping helper to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
