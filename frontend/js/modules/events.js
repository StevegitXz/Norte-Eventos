import { state } from './state.js';
import { fetchEvents, fetchExploreEvents, createEvent, updateEvent, uploadImage, handleSubscription, fetchParticipants, removeParticipant, addParticipant } from './api.js';
import { formatDateString, escapeHTML } from './utils.js';
import { renderEmptyStateMarkup, openDeleteConfirmModal, cancelEditMode, switchTab } from './ui.js';

// ==========================================
// EVENTS LOGIC
// ==========================================

const SAFE_UPLOAD_URL_REGEX = /^\/uploads\/[a-zA-Z0-9_/-]+\.(jpg|jpeg|png|webp)$/i;
const ALLOWED_BANNERS = new Set([
    'event-card-gradient-1',
    'event-card-gradient-2',
    'event-card-gradient-3',
    'event-card-gradient-4',
    'event-card-gradient-5'
]);

function getSafeImageUrl(url) {
    if (typeof url === 'string' && SAFE_UPLOAD_URL_REGEX.test(url)) {
        return url;
    }
    return null;
}

function getSafeBannerClass(bannerClass) {
    if (typeof bannerClass === 'string' && ALLOWED_BANNERS.has(bannerClass)) {
        return bannerClass;
    }
    return 'event-card-gradient-1';
}

export async function loadEventsFromServer() {
    try {
        const data = await fetchEvents();
        state.events = data.map(ev => ({
            ...ev,
            data: ev.data.split('T')[0], 
            hora: ev.hora ? ev.hora.substring(0, 5) : '00:00'
        }));
        const { renderStats } = await import('./ui.js');
        renderStats();
        renderEvents();
    } catch (error) {
        if (error.message === 'Não autenticado') window.location.href = '/login';
        else console.error(error);
    }
}

export async function loadExploreEvents() {
    try {
        const data = await fetchExploreEvents();
        state.exploreEvents = data.map(ev => ({
            ...ev,
            data: ev.data.split('T')[0], 
            hora: ev.hora ? ev.hora.substring(0, 5) : '00:00'
        }));
        renderExploreEvents();
        updateExploreSidebarStats();
    } catch (error) {
        console.error(error);
    }
}

function updateExploreSidebarStats() {
    const statEvents = document.getElementById('explore-stat-events');
    const statInscricoes = document.getElementById('explore-stat-inscricoes');
    const statNextEvent = document.getElementById('explore-stat-next-event');

    if (statEvents) {
        statEvents.textContent = String(state.exploreEvents.length).padStart(2, '0');
    }
    if (statInscricoes) {
        const inscrito = state.exploreEvents.filter(ev => ev.inscrito).length;
        statInscricoes.textContent = String(inscrito).padStart(2, '0');
    }
    if (statNextEvent) {
        const now = new Date();
        const upcoming = state.exploreEvents
            .filter(ev => new Date(`${ev.data}T${ev.hora || '00:00'}`) >= now)
            .sort((a, b) => new Date(`${a.data}T${a.hora || '00:00'}`) - new Date(`${b.data}T${b.hora || '00:00'}`));
        if (upcoming.length > 0) {
            const d = new Date(upcoming[0].data + 'T00:00:00');
            const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            statNextEvent.textContent = `${String(d.getDate()).padStart(2, '0')} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
        } else {
            statNextEvent.textContent = 'Sem eventos futuros';
        }
    }
}

function getFilteredExploreEvents() {
    return state.exploreEvents.filter(ev => {
        const matchesCategory = state.exploreFilterCategory === 'Tudo' || ev.categoria === state.exploreFilterCategory;
        const searchLower = (state.exploreSearchQuery || '').toLowerCase();
        const matchesSearch = (state.exploreSearchQuery || '') === '' || 
            (ev.nome && ev.nome.toLowerCase().includes(searchLower)) || 
            (ev.descricao && ev.descricao.toLowerCase().includes(searchLower)) || 
            (ev.local && ev.local.toLowerCase().includes(searchLower));
        return matchesCategory && matchesSearch;
    });
}

function getFilteredEvents(list, category) {
    return list.filter(ev => {
        const matchesCategory = category === 'Tudo' || ev.categoria === category;
        const searchLower = (state.searchQuery || '').toLowerCase();
        const matchesSearch = (state.searchQuery || '') === '' || 
            (ev.nome && ev.nome.toLowerCase().includes(searchLower)) || 
            (ev.descricao && ev.descricao.toLowerCase().includes(searchLower)) || 
            (ev.local && ev.local.toLowerCase().includes(searchLower));

        return matchesCategory && matchesSearch;
    }).sort((a, b) => {
        if (state.currentSort === 'date-asc') {
            return new Date(`${a.data}T${a.hora || '00:00'}`) - new Date(`${b.data}T${b.hora || '00:00'}`);
        } else if (state.currentSort === 'date-desc') {
            return new Date(`${b.data}T${b.hora || '00:00'}`) - new Date(`${a.data}T${a.hora || '00:00'}`);
        } else if (state.currentSort === 'inscritos-desc') {
            return b.inscritos - a.inscritos;
        }
        return 0;
    });
}

export function renderEvents() {
    const listOverview = document.getElementById('recent-events-list');
    const listMyEvents = document.getElementById('my-events-list');
    const filtered = getFilteredEvents(state.events, state.currentFilterCategory);

    if (listOverview) {
        listOverview.innerHTML = '';
        if (state.events.length === 0) {
            listOverview.innerHTML = renderEmptyStateMarkup();
        } else {
            const recent = [...state.events]
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

export function renderExploreEvents() {
    const listExplore = document.getElementById('explore-events-list');
    const filtered = getFilteredExploreEvents();
    if (listExplore) {
        listExplore.innerHTML = '';
        
        if (state.exploreListView) {
            listExplore.classList.remove('sm:grid-cols-2');
            listExplore.classList.add('grid-cols-1');
        } else {
            listExplore.classList.add('sm:grid-cols-2');
        }

        if (filtered.length === 0) {
            listExplore.innerHTML = renderEmptyStateMarkup('Nenhum evento disponível', 'Aguarde até que outros usuários publiquem eventos na plataforma.');
        } else {
            filtered.forEach(ev => {
                listExplore.appendChild(createEventCardElement(ev, true));
            });
        }
    }
}

function createEventCardElement(ev, isExploreView) {
    const card = document.createElement('div');
    const safeImageUrl = getSafeImageUrl(ev.imagem_url);
    const safeBannerClass = getSafeBannerClass(ev.bannerClass);
    const safeId = Number(ev.id) || 0;
    const safeInscritos = Number(ev.inscritos) || 0;
    const safeCapacidade = Number(ev.capacidade) || 0;

    const backgroundMediaHTML = safeImageUrl
        ? `<img src="${escapeHTML(safeImageUrl)}" alt="${escapeHTML(ev.nome)}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />`
        : `<div class="absolute inset-0 w-full h-full ${safeBannerClass} transition-transform duration-700 ease-out group-hover:scale-105">
             <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45) 0%, transparent 55%);"></div>
           </div>`;

    if (isExploreView) {
        const minHeightClass = state.exploreListView ? 'min-h-[460px]' : 'min-h-[420px]';

        card.className = `relative ${minHeightClass} rounded-[30px] overflow-hidden shadow-[0_16px_38px_rgba(0,0,0,0.10)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-end group event-card select-none`;

        let actionsHTML = '';
        if (ev.inscrito) {
            actionsHTML = `
            <div class="flex items-center gap-2.5 w-full">
                <button type="button" class="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-white hover:bg-stone-100 active:scale-[0.99] text-brand-green font-display font-bold text-sm shadow-lg transition-all cursor-pointer btn-details" data-id="${safeId}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Inscrito • Ver detalhes
                </button>
                <button type="button" class="w-12 h-12 flex shrink-0 items-center justify-center rounded-full bg-red-500/85 hover:bg-red-500 text-white backdrop-blur-md border border-white/15 shadow-lg btn-unsubscribe-card transition-all cursor-pointer" data-id="${safeId}" title="Cancelar Inscrição" aria-label="Cancelar Inscrição">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>`;
        } else {
            actionsHTML = `
            <button type="button" class="w-full py-3.5 px-6 rounded-full bg-white hover:bg-stone-100 active:scale-[0.99] text-brand-dark font-display font-bold text-sm shadow-lg transition-all cursor-pointer btn-details" data-id="${safeId}">
                Ver detalhes
            </button>`;
        }

        card.innerHTML = `
          ${backgroundMediaHTML}
          <div class="absolute inset-x-0 bottom-0 h-[68%] card-progressive-blur pointer-events-none"></div>
          <div class="absolute inset-0 card-scrim-gradient pointer-events-none"></div>

          <div class="relative z-10 p-6 sm:p-7 flex flex-col">
              <h4 class="font-display font-bold text-2xl text-white tracking-tight mb-2 line-clamp-1">${escapeHTML(ev.nome)}</h4>
              <p class="text-sm text-white/80 leading-relaxed mb-4 ${state.exploreListView ? 'line-clamp-3' : 'line-clamp-2'}">${escapeHTML(ev.descricao || 'Experiência exclusiva na Região Norte.')}</p>

              <!-- Pílulas Frosted Glass -->
              <div class="flex flex-wrap items-center gap-2 mb-5">
                  <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-xs font-medium text-white/95">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-amber-300 shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      ${escapeHTML(ev.categoria || 'Geral')}
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-xs font-medium text-white/95">
                      ${escapeHTML(formatDateString(ev.data))} • ${escapeHTML(ev.hora || '00:00')}
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-xs font-medium text-white/95 max-w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="text-brand-emerald shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span class="truncate max-w-[140px]">${escapeHTML(ev.local)}</span>
                      <span class="text-white/60">•</span>
                      <span>${safeInscritos}/${safeCapacidade}</span>
                  </span>
              </div>

              ${actionsHTML}
          </div>
        `;

        card.querySelector('.btn-details').addEventListener('click', () => openEventProductModal(ev));

        if (ev.inscrito) {
            card.querySelector('.btn-unsubscribe-card').addEventListener('click', (e) => {
                e.stopPropagation();
                card.querySelector('.btn-unsubscribe-card').innerHTML = '<svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
                callSubscription(safeId, 'DELETE');
            });
        }

    } else {
        card.className = 'relative min-h-[410px] rounded-[30px] overflow-hidden shadow-[0_16px_38px_rgba(0,0,0,0.10)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-end group event-card select-none';
        card.dataset.id = safeId;

        const actionsHTML = `
            <div class="flex flex-col w-full gap-2.5">
              <button type="button" class="w-full py-3.5 px-6 rounded-full bg-white hover:bg-stone-100 active:scale-[0.99] text-brand-dark font-display font-bold text-sm shadow-lg transition-all cursor-pointer btn-manage" data-id="${safeId}">
                  Gerenciar Inscrições
              </button>
              <div class="flex items-center gap-2 w-full">
                <button type="button" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-xs font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/15 btn-edit transition-all cursor-pointer" data-id="${safeId}">
                    Editar
                </button>
                <button type="button" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full text-xs font-semibold text-red-100 hover:text-white bg-red-500/25 hover:bg-red-500 backdrop-blur-md border border-red-400/25 btn-delete transition-all cursor-pointer" data-id="${safeId}">
                    Excluir
                </button>
              </div>
            </div>
          `;

        card.innerHTML = `
          ${backgroundMediaHTML}
          <div class="absolute inset-x-0 bottom-0 h-[70%] card-progressive-blur pointer-events-none"></div>
          <div class="absolute inset-0 card-scrim-gradient pointer-events-none"></div>

          <div class="relative z-10 p-6 sm:p-7 flex flex-col">
            <h4 class="font-display font-bold text-2xl text-white tracking-tight mb-2 line-clamp-1">${escapeHTML(ev.nome)}</h4>
            <p class="text-sm text-white/80 leading-relaxed mb-4 line-clamp-2">${escapeHTML(ev.descricao || 'Sem descrição')}</p>

            <div class="flex flex-wrap items-center gap-2 mb-5">
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-xs font-medium text-white/95">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-amber-300 shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ${escapeHTML(ev.categoria || 'Geral')}
              </span>
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-xs font-medium text-white/95">
                ${escapeHTML(formatDateString(ev.data))} • ${escapeHTML(ev.hora || '00:00')}
              </span>
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-xs font-medium text-white/95">
                ${safeInscritos}/${safeCapacidade} inscritos
              </span>
            </div>

            ${actionsHTML}
          </div>
        `;

        card.querySelector('.btn-edit').addEventListener('click', () => enableEditMode(safeId));
        card.querySelector('.btn-delete').addEventListener('click', () => openDeleteConfirmModal(safeId));
        card.querySelector('.btn-manage').addEventListener('click', () => openEventDetails(safeId));
    }

    return card;
}

export function enableEditMode(id) {
    const ev = state.events.find(e => e.id == id);
    if (!ev) return;
    state.eventToEditId = ev.id;
    document.getElementById('event-nome').value = ev.nome;
    document.getElementById('event-categoria').value = ev.categoria;
    document.getElementById('event-data').value = ev.data;
    document.getElementById('event-hora').value = ev.hora || '';
    document.getElementById('event-local').value = ev.local;
    document.getElementById('event-desc').value = ev.descricao || '';
    document.getElementById('event-capacidade').value = ev.capacidade || 100;

    state.selectedBannerClass = getSafeBannerClass(ev.bannerClass);
    document.querySelectorAll('.banner-option').forEach(opt => {
        const isMatch = opt.dataset.gradient === state.selectedBannerClass;
        opt.classList.toggle('selected', isMatch);
        opt.setAttribute('aria-checked', String(isMatch));
    });
    document.getElementById('form-view-title').textContent = 'Editar Detalhes do Evento';
    document.getElementById('btn-submit-text').textContent = 'Salvar Alterações';
    switchTab('create-event');
}

async function callSubscription(eventoId, method) {
    try {
        await handleSubscription(eventoId, method);
        showToast(method === 'POST' ? 'Inscrição confirmada!' : 'Inscrição cancelada!', 'success');
        
        closeEventProductModal();

        loadExploreEvents();
        loadEventsFromServer();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

export function openEventProductModal(ev) {
    const modal = document.getElementById('modal-event-details');
    if (!modal) return;

    const imgPreview = document.getElementById('details-image');
    const imgPlaceholder = document.getElementById('details-image-placeholder');
    const safeImageUrl = getSafeImageUrl(ev.imagem_url);
    const safeBannerClass = getSafeBannerClass(ev.bannerClass);
    if (safeImageUrl) {
        imgPreview.src = safeImageUrl;
        imgPreview.classList.remove('hidden');
        imgPlaceholder.classList.add('hidden');
    } else {
        imgPreview.src = '';
        imgPreview.classList.add('hidden');
        imgPlaceholder.className = `w-full h-full flex items-center justify-center text-white/80 ${safeBannerClass}`;
        imgPlaceholder.classList.remove('hidden');
    }

    document.getElementById('details-category').textContent = ev.categoria || 'Geral';
    document.getElementById('details-date').textContent = `${formatDateString(ev.data)} às ${ev.hora || '00:00'}`;
    document.getElementById('modal-event-details-title').textContent = ev.nome;
    document.getElementById('details-local').textContent = ev.local;
    document.getElementById('details-capacity').textContent = `${ev.inscritos || 0} / ${ev.capacidade || 0} vagas ocupadas`;
    document.getElementById('details-description').textContent = ev.descricao || 'Nenhuma descrição fornecida para este evento.';

    const creatorElem = document.getElementById('details-creator');
    if (creatorElem) {
        creatorElem.textContent = ev.criador_nome || 'Usuário Norte Eventos';
    }

    const btnSub = document.getElementById('btn-details-subscribe');
    btnSub.dataset.id = ev.id;

    const newBtnSub = btnSub.cloneNode(true);
    btnSub.parentNode.replaceChild(newBtnSub, btnSub);

    if (ev.inscrito) {
        newBtnSub.textContent = 'Cancelar Inscrição';
        newBtnSub.className = 'w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-base font-display font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md shadow-red-600/20 cursor-pointer';
        newBtnSub.addEventListener('click', () => {
            newBtnSub.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
            callSubscription(ev.id, 'DELETE');
        });
    } else {
        newBtnSub.textContent = 'Inscrever-se no Evento';
        newBtnSub.className = 'w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-base font-display font-bold text-white bg-brand-green hover:bg-brand-green-light transition-colors shadow-[0_4px_14px_rgba(15,83,56,0.22)] cursor-pointer';
        newBtnSub.addEventListener('click', () => {
            newBtnSub.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
            callSubscription(ev.id, 'POST');
        });
    }

    modal.classList.add('open');
}

export function closeEventProductModal() {
    const modal = document.getElementById('modal-event-details');
    if (modal) modal.classList.remove('open');
}

async function openEventDetails(eventoId) {
    const ev = state.events.find(e => e.id == eventoId);
    if (!ev) return;
    state.eventManageId = eventoId;

    const bannerEl = document.getElementById('manage-event-banner');
    const safeImageUrl = getSafeImageUrl(ev.imagem_url);
    const safeBannerClass = getSafeBannerClass(ev.bannerClass);
    if (bannerEl) {
        bannerEl.className = `h-52 sm:h-64 w-full bg-cover bg-center relative ${safeImageUrl ? '' : safeBannerClass}`;
        bannerEl.style.backgroundImage = safeImageUrl ? `url('${safeImageUrl}')` : '';
    }

    const catEl = document.getElementById('manage-event-category');
    if (catEl) catEl.textContent = ev.categoria || 'Geral';

    document.getElementById('manage-event-title').textContent = ev.nome;
    document.getElementById('manage-event-desc').textContent = ev.descricao || 'Sem descrição cadastrada.';

    const dtEl = document.getElementById('manage-event-datetime');
    if (dtEl) dtEl.textContent = `${formatDateString(ev.data)} às ${ev.hora || '00:00'}`;

    const locEl = document.getElementById('manage-event-location');
    if (locEl) locEl.textContent = ev.local || 'Local não informado';

    const statsEl = document.getElementById('manage-event-stats');
    if (statsEl) statsEl.textContent = `${Number(ev.inscritos) || 0} de ${Number(ev.capacidade) || 0} inscritos`;

    switchTab('manage-event');
    await fetchAndRenderParticipants();
}

export async function fetchAndRenderParticipants() {
    if (!state.eventManageId) return;
    const container = document.getElementById('participants-list-container');
    try {
        const participantes = await fetchParticipants(state.eventManageId);
        container.innerHTML = '';
        if (participantes.length === 0) {
            container.innerHTML = '<div class="text-center text-sm text-stone-500 dark:text-gray-400 py-8 border border-dashed border-stone-200 dark:border-white/10 rounded-2xl">Nenhum participante inscrito ainda.</div>';
            return;
        }
        participantes.forEach(p => {
            const initials = (p.nome || 'U').trim().substring(0, 2).toUpperCase();
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between gap-3 p-3.5 bg-white dark:bg-[#121A16] rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-2xs';
            item.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-full bg-brand-green/10 dark:bg-brand-emerald/15 text-brand-green dark:text-brand-emerald font-display font-bold text-xs flex items-center justify-center shrink-0">
                        ${escapeHTML(initials)}
                    </div>
                    <div class="min-w-0">
                        <p class="font-semibold text-sm text-brand-dark dark:text-white truncate">${escapeHTML(p.nome)}</p>
                        ${p.email ? `<p class="text-xs text-stone-500 dark:text-gray-400 truncate">${escapeHTML(p.email)}</p>` : ''}
                    </div>
                </div>
                <button type="button" class="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors btn-remove-participant cursor-pointer shrink-0" data-id="${Number(p.id) || 0}" aria-label="Remover participante" title="Remover participante">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;
            item.querySelector('.btn-remove-participant').addEventListener('click', async () => {
                if (confirm('Remover participante?')) {
                    await removeParticipant(state.eventManageId, p.id);
                    fetchAndRenderParticipants();
                    loadEventsFromServer();
                }
            });
            container.appendChild(item);
        });
    } catch (e) {
        container.innerHTML = '<div class="text-red-500 text-sm text-center py-6">Erro ao carregar participantes</div>';
    }
}

export function setupEventsBindings() {
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-submit');
            btnSubmit.disabled = true;

            const eventoData = {
                nome: document.getElementById('event-nome').value.trim(),
                categoria: document.getElementById('event-categoria').value,
                data: document.getElementById('event-data').value,
                hora: document.getElementById('event-hora').value,
                local: document.getElementById('event-local').value.trim(),
                descricao: document.getElementById('event-desc').value.trim(),
                capacidade: parseInt(document.getElementById('event-capacidade').value) || 100,
                bannerClass: state.selectedBannerClass
            };

            const fileInput = document.getElementById('event-image');
            if (fileInput.files && fileInput.files[0]) {
                try {
                    const uploadData = await uploadImage(fileInput.files[0]);
                    eventoData.imagem_url = uploadData.url;
                } catch (e) {
                    showToast('Erro upload', 'error');
                    btnSubmit.disabled = false;
                    return;
                }
            }

            try {
                if (state.eventToEditId) {
                    await updateEvent(state.eventToEditId, eventoData);
                    showToast('Evento atualizado!', 'success');
                } else {
                    await createEvent(eventoData);
                    showToast('Evento criado!', 'success');
                }
                await loadEventsFromServer();
                cancelEditMode();
                switchTab('my-events');
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
            }
        });
    }
}
