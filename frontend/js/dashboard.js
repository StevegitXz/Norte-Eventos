/* ==========================================================================
   Norte Eventos — Dashboard JS Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. AUTHENTICATION CHECK & FETCH USER DATA
  let userData = null;
  try {
    const resAuth = await fetch('/api/usuarios/me');
    if (!resAuth.ok) {
      window.location.href = '/login';
      return;
    }
    userData = await resAuth.json();
  } catch (err) {
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
  const userName = userData.nome || extractUsername(userEmail);
  
  document.querySelectorAll('.user-name-display').forEach(el => {
    el.textContent = userName;
  });
  document.querySelectorAll('.user-email-display').forEach(el => {
    el.textContent = userEmail;
  });

  // Preencher dados nas Configurações
  const inputNome = document.getElementById('settings-nome');
  const inputEmail = document.getElementById('settings-email');
  if(inputNome) inputNome.value = userName;
  if(inputEmail) inputEmail.value = userEmail;

  // Carregar notificações ao iniciar
  loadNotifications();
  document.querySelectorAll('.avatar').forEach(el => {
    el.textContent = userName.substring(0, 2).toUpperCase();
  });

  // 2. STATE VARIABLES
  let events = [];
  let exploreEvents = [];
  let currentFilterCategory = 'Tudo';
  let exploreFilterCategory = 'Tudo';
  let searchQuery = '';
  let currentSort = 'date-asc';
  let eventToDeleteId = null;
  let eventToEditId = null;
  let eventManageId = null; // ID do evento atual sendo gerenciado
  let selectedBannerClass = 'event-card-gradient-1';

  // Fetch events from Backend
  async function loadEventsFromServer() {
    try {
      const response = await fetch('/api/eventos');
      if (response.ok) {
        const data = await response.json();
        events = data.map(ev => ({
          ...ev,
          data: ev.data.split('T')[0], 
          hora: ev.hora ? ev.hora.substring(0, 5) : '00:00'
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

  async function loadExploreEvents() {
    try {
      const response = await fetch('/api/eventos/explorar');
      if (response.ok) {
        const data = await response.json();
        exploreEvents = data.map(ev => ({
          ...ev,
          data: ev.data.split('T')[0], 
          hora: ev.hora ? ev.hora.substring(0, 5) : '00:00'
        }));
        renderExploreEvents();
      }
    } catch (error) {
      console.error('Erro de conexão ao explorar eventos:', error);
    }
  }

  // 3. TAB NAVIGATION SYSTEM
  const navLinks = document.querySelectorAll('.sidebar-menu .menu-item, .mobile-nav .mobile-nav-item');
  const tabs = document.querySelectorAll('.tab-content');

  function switchTab(tabId) {
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
      if (tabId === 'overview') pageTitleEl.textContent = 'Início';
      else if (tabId === 'my-events') pageTitleEl.textContent = 'Meus Eventos';
      else if (tabId === 'explore-events') pageTitleEl.textContent = 'Explorar Eventos';
      else if (tabId === 'create-event') {
        pageTitleEl.textContent = eventToEditId ? 'Editar Evento' : 'Novo Evento';
      }
      else if (tabId === 'manage-event') {
        pageTitleEl.textContent = 'Gerenciar Evento';
      }
    }

    if (tabId === 'overview' || tabId === 'my-events') {
      renderEvents();
      renderStats();
    } else if (tabId === 'explore-events') {
      loadExploreEvents();
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = (link.getAttribute('href') || link.dataset.target).substring(1);
      
      if (targetId !== 'create-event') {
        cancelEditMode();
      }
      
      switchTab(targetId);
    });
  });

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
      selectedBannerClass = opt.dataset.gradient;
    });
  });

  // 5. CRUD & RENDERING

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

  function getFilteredEvents(list, category) {
    return list.filter(ev => {
      const matchesCategory = category === 'Tudo' || ev.categoria === category;
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

  function renderEvents() {
    const listOverview = document.getElementById('recent-events-list');
    const listMyEvents = document.getElementById('my-events-list');
    const filtered = getFilteredEvents(events, currentFilterCategory);

    if (listOverview) {
      listOverview.innerHTML = '';
      if (events.length === 0) {
        listOverview.innerHTML = renderEmptyStateMarkup();
      } else {
        const recent = [...events]
          .sort((a, b) => new Date(`${b.data}T${b.hora || '00:00'}`) - new Date(`${a.data}T${a.hora || '00:00'}`))
          .slice(0, 3);
        recent.forEach(ev => {
          listOverview.appendChild(createEventCardElement(ev, false));
        });
      }
    }

    if (listMyEvents) {
      listMyEvents.innerHTML = '';
      if (filtered.length === 0) {
        listMyEvents.innerHTML = renderEmptyStateMarkup();
      } else {
        filtered.forEach(ev => {
          listMyEvents.appendChild(createEventCardElement(ev, false));
        });
      }
    }
  }

  function renderExploreEvents() {
    const listExplore = document.getElementById('explore-events-list');
    const filtered = getFilteredEvents(exploreEvents, exploreFilterCategory);
    if (listExplore) {
      listExplore.innerHTML = '';
      if (filtered.length === 0) {
        listExplore.innerHTML = renderEmptyStateMarkup('Nenhum evento global disponível', 'Aguarde até que outros usuários publiquem eventos.');
      } else {
        filtered.forEach(ev => {
          listExplore.appendChild(createEventCardElement(ev, true));
        });
      }
    }
  }

  function createEventCardElement(ev, isExploreView) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 flex flex-col event-card';
    card.dataset.id = ev.id;

    // Render image or gradient
    const bannerHTML = ev.imagem_url 
      ? `<div class="h-32 bg-cover bg-center flex items-start justify-end p-4" style="background-image: url('${ev.imagem_url}');">
           <span class="inline-block px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-bold text-white tracking-wide shadow-sm">${ev.categoria}</span>
         </div>`
      : `<div class="h-24 p-4 flex items-start justify-end ${ev.bannerClass || 'event-card-gradient-1'}">
           <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white tracking-wide shadow-sm">${ev.categoria}</span>
         </div>`;

    // Action buttons based on view mode
    let actionsHTML = '';
    if (isExploreView) {
      if (ev.inscrito) {
        actionsHTML = `
          <button class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-brand-green bg-green-50 dark:bg-brand-green/10 transition-colors btn-action btn-unsubscribe" data-id="${ev.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Inscrito (Cancelar)
          </button>
        `;
      } else {
        actionsHTML = `
          <button class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white bg-brand-green hover:bg-brand-dark transition-colors btn-action btn-subscribe" data-id="${ev.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Inscrever-se
          </button>
        `;
      }
    } else {
      actionsHTML = `
        <div class="flex flex-col w-full gap-2">
          <button class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors btn-action btn-manage" data-id="${ev.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Gerenciar Inscrições
          </button>
          <div class="flex items-center gap-2 w-full">
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
    }

    card.innerHTML = `
      ${bannerHTML}
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

        <div class="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
          ${actionsHTML}
        </div>
      </div>
    `;

    if (isExploreView) {
      if (ev.inscrito) {
        card.querySelector('.btn-unsubscribe').addEventListener('click', () => handleSubscription(ev.id, 'DELETE'));
      } else {
        card.querySelector('.btn-subscribe').addEventListener('click', () => handleSubscription(ev.id, 'POST'));
      }
    } else {
      card.querySelector('.btn-edit').addEventListener('click', () => enableEditMode(ev.id));
      card.querySelector('.btn-delete').addEventListener('click', () => openDeleteConfirmModal(ev.id));
      card.querySelector('.btn-manage').addEventListener('click', () => openEventDetails(ev.id));
    }

    return card;
  }

  async function handleSubscription(eventoId, method) {
    try {
      const response = await fetch(`/api/eventos/${eventoId}/inscrever`, { method });
      if (response.ok) {
        showToast(method === 'POST' ? 'Inscrição confirmada!' : 'Inscrição cancelada!', 'success');
        loadExploreEvents(); // Recarrega a lista
        loadEventsFromServer(); // Recarrega as métricas da overview
      } else {
        const err = await response.json();
        showToast('Erro: ' + err.erro, 'error');
      }
    } catch (error) {
      showToast('Erro de conexão.', 'error');
    }
  }

  // GERENCIAR PARTICIPANTES VIEW LOGIC
  async function openEventDetails(eventoId) {
    const ev = events.find(e => e.id == eventoId);
    if (!ev) return;

    eventManageId = eventoId;
    
    // Povoar os dados do evento na tela
    document.getElementById('manage-event-title').textContent = ev.nome;
    document.getElementById('manage-event-desc').textContent = ev.descricao || 'Sem descrição cadastrada.';
    document.getElementById('manage-event-category').textContent = ev.categoria;
    document.getElementById('manage-event-datetime').textContent = `${formatDateString(ev.data)} às ${ev.hora || '00:00'}`;
    document.getElementById('manage-event-location').textContent = ev.local;

    const bannerEl = document.getElementById('manage-event-banner');
    if (ev.imagem_url) {
      bannerEl.className = 'h-48 md:h-64 w-full bg-cover bg-center';
      bannerEl.style.backgroundImage = `url('${ev.imagem_url}')`;
    } else {
      bannerEl.className = `h-48 md:h-64 w-full bg-cover bg-center ${ev.bannerClass || 'event-card-gradient-1'}`;
      bannerEl.style.backgroundImage = 'none';
    }

    const container = document.getElementById('participants-list-container');
    container.innerHTML = '<div class="text-center text-sm text-gray-500 py-8">Carregando participantes...</div>';
    
    switchTab('manage-event');
    await fetchAndRenderParticipants();
  }

  async function fetchAndRenderParticipants() {
    if (!eventManageId) return;
    const container = document.getElementById('participants-list-container');
    
    try {
      const response = await fetch(`/api/eventos/${eventManageId}/participantes`);
      if (response.ok) {
        const participantes = await response.json();
        
        const ev = events.find(e => e.id == eventManageId);
        if (ev) {
          document.getElementById('manage-event-stats').textContent = `${participantes.length} de ${ev.capacidade} inscritos`;
        }

        container.innerHTML = '';
        if (participantes.length === 0) {
          container.innerHTML = '<div class="text-center text-sm text-gray-500 py-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg">Ninguém se inscreveu neste evento ainda.</div>';
          return;
        }

        participantes.forEach(p => {
          const item = document.createElement('div');
          item.className = 'flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors hover:border-gray-300 dark:hover:border-slate-600';
          item.innerHTML = `
            <div class="overflow-hidden">
              <p class="text-base font-bold text-gray-800 dark:text-gray-100 truncate">${escapeHTML(p.nome)}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${escapeHTML(p.email)}</p>
            </div>
            <button class="ml-4 shrink-0 p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors btn-remove-participant" data-id="${p.id}" title="Remover Inscrição">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
            </button>
          `;
          
          item.querySelector('.btn-remove-participant').addEventListener('click', async () => {
            if (confirm(`Tem certeza que deseja remover ${p.nome} do evento?`)) {
              await removerParticipante(p.id);
            }
          });
          
          container.appendChild(item);
        });

      } else {
        container.innerHTML = '<div class="text-center text-sm text-red-500 py-4">Erro ao carregar participantes.</div>';
      }
    } catch (error) {
      container.innerHTML = '<div class="text-center text-sm text-red-500 py-4">Erro de conexão.</div>';
    }
  }

  async function removerParticipante(participanteId) {
    try {
      const response = await fetch(`/api/eventos/${eventManageId}/participantes/${participanteId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Participante removido com sucesso!', 'success');
        await fetchAndRenderParticipants();
        await loadEventsFromServer(); // Atualizar card counter
      } else {
        const err = await response.json();
        showToast('Erro: ' + err.erro, 'error');
      }
    } catch (error) {
      showToast('Erro de conexão ao remover.', 'error');
    }
  }

  const formAddParticipant = document.getElementById('form-add-participant');
  if (formAddParticipant) {
    formAddParticipant.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('input-add-participant-email');
      const email = emailInput.value.trim();
      
      if (!email || !eventManageId) return;

      const btn = document.getElementById('btn-submit-add-participant');
      btn.disabled = true;

      try {
        const response = await fetch(`/api/eventos/${eventManageId}/participantes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (response.ok) {
          showToast('Participante adicionado com sucesso!', 'success');
          emailInput.value = '';
          await fetchAndRenderParticipants();
          await loadEventsFromServer(); // Atualiza contador
        } else {
          const err = await response.json();
          showToast('Erro: ' + err.erro, 'error');
        }
      } catch (error) {
        showToast('Erro de conexão ao adicionar.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  const btnBackToEvents = document.getElementById('btn-back-to-events');
  if (btnBackToEvents) {
    btnBackToEvents.addEventListener('click', () => {
      eventManageId = null;
      switchTab('my-events');
    });
  }

  function renderEmptyStateMarkup(title = 'Nenhum evento localizado', desc = 'Você ainda não tem eventos criados nesta categoria ou correspondentes à sua busca.') {
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

      const btnSubmit = document.getElementById('btn-submit');
      const originalBtnText = document.getElementById('btn-submit-text').textContent;
      document.getElementById('btn-submit-text').textContent = 'Processando...';
      btnSubmit.disabled = true;

      const nome = document.getElementById('event-nome').value.trim();
      const categoria = document.getElementById('event-categoria').value;
      const data = document.getElementById('event-data').value;
      const hora = document.getElementById('event-hora').value;
      const local = document.getElementById('event-local').value.trim();
      const descricao = document.getElementById('event-desc').value.trim();
      const capacidade = parseInt(document.getElementById('event-capacidade').value) || 100;
      const fileInput = document.getElementById('event-image');

      if (!nome || !categoria || !data || !local) {
        alert('Por favor, preencha todos os campos obrigatórios (*).');
        btnSubmit.disabled = false;
        document.getElementById('btn-submit-text').textContent = originalBtnText;
        return;
      }

      let imagem_url = null;

      // Se há um arquivo selecionado, faz o upload primeiro
      if (fileInput.files && fileInput.files[0]) {
        const formData = new FormData();
        formData.append('imagem', fileInput.files[0]);

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData // o navegador seta o Content-Type: multipart/form-data automático
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            imagem_url = uploadData.url;
          } else {
            alert('Falha ao fazer upload da imagem.');
            btnSubmit.disabled = false;
            document.getElementById('btn-submit-text').textContent = originalBtnText;
            return;
          }
        } catch (err) {
          alert('Erro de conexão no upload da imagem.');
          btnSubmit.disabled = false;
          document.getElementById('btn-submit-text').textContent = originalBtnText;
          return;
        }
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

      if (imagem_url) {
        eventoData.imagem_url = imagem_url;
      }

      try {
        if (eventToEditId) {
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
          }
        } else {
          eventoData.inscritos = 0; 
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
          }
        }

        await loadEventsFromServer();
        cancelEditMode(); 
        switchTab('my-events');

      } catch (error) {
        alert('Erro de conexão ao salvar evento.');
      } finally {
        btnSubmit.disabled = false;
        document.getElementById('btn-submit-text').textContent = originalBtnText;
      }
    });

    const btnCancelForm = document.getElementById('btn-cancel-form');
    if (btnCancelForm) {
      btnCancelForm.addEventListener('click', () => {
        cancelEditMode();
        switchTab('my-events');
      });
    }
  }

  function enableEditMode(id) {
    const ev = events.find(e => e.id == id);
    if (!ev) return;

    eventToEditId = ev.id;
    
    document.getElementById('event-nome').value = ev.nome;
    document.getElementById('event-categoria').value = ev.categoria;
    document.getElementById('event-data').value = ev.data;
    document.getElementById('event-hora').value = ev.hora || '';
    document.getElementById('event-local').value = ev.local;
    document.getElementById('event-desc').value = ev.descricao || '';
    document.getElementById('event-capacidade').value = ev.capacidade || 100;
    document.getElementById('event-image').value = ''; // Limpa input de arquivo

    selectedBannerClass = ev.bannerClass || 'event-card-gradient-1';
    bannerOptions.forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.gradient === selectedBannerClass) {
        opt.classList.add('selected');
      }
    });

    document.getElementById('form-view-title').textContent = 'Editar Detalhes do Evento';
    document.getElementById('btn-submit-text').textContent = 'Salvar Alterações';

    switchTab('create-event');
  }

  function cancelEditMode() {
    eventToEditId = null;
    if (eventForm) eventForm.reset();
    
    bannerOptions.forEach(o => o.classList.remove('selected'));
    bannerOptions[0].classList.add('selected');
    selectedBannerClass = 'event-card-gradient-1';

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
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch('/api/usuarios/logout', { method: 'POST' });
      } catch (error) {
        console.error('Erro ao fazer logout', error);
      }
      showToast('Sessão finalizada com sucesso. Até logo!', 'success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    });
  }

  // 10. RUN INITIAL RENDER
  loadEventsFromServer();

  // ==========================================
  // NOTIFICATIONS LOGIC
  // ==========================================
  const btnNotifs = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notif-dropdown');
  const notifBadge = document.getElementById('notif-badge');
  const notifList = document.getElementById('notif-list');
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

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notificacoes');
      if (res.ok) {
        const notifs = await res.json();
        renderNotifications(notifs);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações', err);
    }
  }

  function renderNotifications(notifs) {
    if (!notifList || !notifBadge) return;
    
    notifList.innerHTML = '';
    const unreadCount = notifs.filter(n => !n.lida).length;

    if (unreadCount > 0) {
      notifBadge.classList.remove('hidden');
    } else {
      notifBadge.classList.add('hidden');
    }

    if (notifs.length === 0) {
      notifList.innerHTML = '<div class="text-center text-sm text-gray-500 p-4">Nenhuma notificação nova.</div>';
      return;
    }

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
            await fetch(`/api/notificacoes/${n.id}/lida`, { method: 'PUT' });
            loadNotifications();
        }
      });

      notifList.appendChild(div);
    });
  }

  if (btnClearNotifs) {
    btnClearNotifs.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/notificacoes', { method: 'DELETE' });
            if (res.ok) loadNotifications();
        } catch (err) {
            console.error('Erro ao limpar notificações', err);
        }
    });
  }

  // ==========================================
  // SETTINGS LOGIC
  // ==========================================
  const formUpdateProfile = document.getElementById('form-update-profile');
  if (formUpdateProfile) {
      formUpdateProfile.addEventListener('submit', async (e) => {
          e.preventDefault();
          const nome = document.getElementById('settings-nome').value;
          const email = document.getElementById('settings-email').value;

          try {
              const res = await fetch('/api/usuarios/me', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nome, email })
              });
              const data = await res.json();
              
              if (res.ok) {
                  showToast(data.mensagem, 'success');
                  document.querySelectorAll('.user-name-display').forEach(el => el.textContent = nome);
                  document.querySelectorAll('.user-email-display').forEach(el => el.textContent = email);
              } else {
                  showToast(data.erro, 'error');
              }
          } catch (err) {
              showToast('Erro de conexão', 'error');
          }
      });
  }

  const btnDeleteAccount = document.getElementById('btn-delete-account');
  if (btnDeleteAccount) {
      btnDeleteAccount.addEventListener('click', async () => {
          if (confirm('Tem certeza absoluta? Esta ação apagará TODOS os seus eventos e inscrições permanentemente.')) {
              try {
                  const res = await fetch('/api/usuarios/me', { method: 'DELETE' });
                  if (res.ok) {
                      alert('Sua conta foi excluída. Adeus!');
                      window.location.href = '/login';
                  } else {
                      const data = await res.json();
                      showToast(data.erro, 'error');
                  }
              } catch (err) {
                  showToast('Erro de conexão', 'error');
              }
          }
      });
  }

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
