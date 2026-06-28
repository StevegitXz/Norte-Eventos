import { state } from './state.js';
import { fetchEvents, fetchExploreEvents, createEvent, updateEvent, uploadImage, handleSubscription, fetchParticipants, removeParticipant, addParticipant } from './api.js';
import { formatDateString, escapeHTML } from './utils.js';
import { renderEmptyStateMarkup, openDeleteConfirmModal, cancelEditMode, switchTab } from './ui.js';

// ==========================================
// EVENTS LOGIC
// ==========================================

export async function loadEventsFromServer() {
    try {
        const data = await fetchEvents();
        state.events = data.map(ev => ({
            ...ev,
            data: ev.data.split('T')[0], 
            hora: ev.hora ? ev.hora.substring(0, 5) : '00:00'
        }));
        // Import dynamically to avoid circular dependency loop with ui.js
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
    
    if (isExploreView) {
        // Glassmorphism Card Style
        const bgStyle = ev.imagem_url ? `background-image: url('${ev.imagem_url}');` : 'background-color: #00a35c;';
        const bgClass = ev.imagem_url ? 'bg-cover bg-center' : '';
        
        card.className = `relative rounded-3xl overflow-hidden shadow-md transition-all hover:shadow-xl flex flex-col event-card ${bgClass}`;
        if (bgStyle) card.setAttribute('style', bgStyle);
        card.style.minHeight = '320px';

        let actionsHTML = '';
        if (ev.inscrito) {
            actionsHTML = `<button class="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold text-white bg-red-500/80 hover:bg-red-600/90 backdrop-blur-md btn-unsubscribe transition-colors" data-id="${ev.id}">Cancelar Inscrição</button>`;
        } else {
            actionsHTML = `<button class="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold text-white bg-brand-green/90 hover:bg-brand-green backdrop-blur-md btn-subscribe transition-colors" data-id="${ev.id}">Inscrever-se</button>`;
        }

        card.innerHTML = `
          <!-- Overlay degrade para garantir leitura do glass no fundo -->
          <div class="absolute inset-0" style="background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);"></div>
          
          <div class="relative z-10 flex flex-col h-full justify-end p-4">
              <!-- Tag Categoria -->
              <div class="absolute top-4 right-4">
                  <span class="inline-block px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-sm">${escapeHTML(ev.categoria || 'Geral')}</span>
              </div>

              <!-- Glass Morphism Card Info -->
              <div class="rounded-2xl p-5 w-full text-white shadow-xl" style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3);">
                  <div class="flex items-center gap-2 text-xs font-semibold text-white/90 mb-1">
                      <span>${formatDateString(ev.data)} às ${ev.hora || '00:00'}</span>
                  </div>
                  <h4 class="text-xl font-bold mb-1 line-clamp-1 drop-shadow-md">${escapeHTML(ev.nome)}</h4>
                  <p class="text-sm text-white/80 mb-3 line-clamp-2">${escapeHTML(ev.descricao || 'Sem descrição')}</p>
                  
                  <div class="flex items-center gap-2 text-xs text-white/90 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span>${escapeHTML(ev.local)}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-white/90">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      <span>${ev.inscritos} / ${ev.capacidade} Inscritos</span>
                  </div>

                  ${actionsHTML}
              </div>
          </div>
        `;

        if (ev.inscrito) card.querySelector('.btn-unsubscribe').addEventListener('click', () => callSubscription(ev.id, 'DELETE'));
        else card.querySelector('.btn-subscribe').addEventListener('click', () => callSubscription(ev.id, 'POST'));

    } else {
        // Normal style for Dashboard/My Events
        card.className = 'bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md flex flex-col event-card';
        card.dataset.id = ev.id;

        const bannerHTML = ev.imagem_url 
          ? `<div class="h-32 bg-cover bg-center flex items-start justify-end p-4" style="background-image: url('${ev.imagem_url}');">
               <span class="inline-block px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-sm">${ev.categoria}</span>
             </div>`
          : `<div class="h-24 p-4 flex items-start justify-end ${ev.bannerClass || 'event-card-gradient-1'}">
               <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-sm">${ev.categoria}</span>
             </div>`;

        let actionsHTML = `
            <div class="flex flex-col w-full gap-2">
              <button class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 btn-manage" data-id="${ev.id}">Gerenciar Inscrições</button>
              <div class="flex items-center gap-2 w-full">
                <button class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-brand-dark bg-gray-100 btn-edit" data-id="${ev.id}">Editar</button>
                <button class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-red-600 bg-red-50 btn-delete" data-id="${ev.id}">Excluir</button>
              </div>
            </div>
          `;

        card.innerHTML = `
          ${bannerHTML}
          <div class="p-5 flex-1 flex flex-col">
            <div class="flex items-center gap-2 text-sm font-semibold text-brand-green mb-2">
              <span>${formatDateString(ev.data)} às ${ev.hora || '00:00'}</span>
            </div>
            <h4 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">${escapeHTML(ev.nome)}</h4>
            <p class="text-sm text-gray-500 mb-4 line-clamp-2">${escapeHTML(ev.descricao || 'Sem descrição')}</p>
            <div class="space-y-2 mb-5">
              <div class="flex items-center gap-2 text-sm text-gray-600"><span>${escapeHTML(ev.local)}</span></div>
              <div class="flex items-center gap-2 text-sm text-gray-600"><span>${ev.inscritos} / ${ev.capacidade} Inscritos</span></div>
            </div>
            <div class="flex flex-col gap-3 pt-4 border-t border-gray-100">
              ${actionsHTML}
            </div>
          </div>
        `;

        card.querySelector('.btn-edit').addEventListener('click', () => enableEditMode(ev.id));
        card.querySelector('.btn-delete').addEventListener('click', () => openDeleteConfirmModal(ev.id));
        card.querySelector('.btn-manage').addEventListener('click', () => openEventDetails(ev.id));
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
    
    state.selectedBannerClass = ev.bannerClass || 'event-card-gradient-1';
    document.getElementById('form-view-title').textContent = 'Editar Detalhes do Evento';
    document.getElementById('btn-submit-text').textContent = 'Salvar Alterações';
    switchTab('create-event');
}

async function callSubscription(eventoId, method) {
    try {
        await handleSubscription(eventoId, method);
        showToast(method === 'POST' ? 'Inscrição confirmada!' : 'Inscrição cancelada!', 'success');
        loadExploreEvents();
        loadEventsFromServer();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function openEventDetails(eventoId) {
    const ev = state.events.find(e => e.id == eventoId);
    if (!ev) return;
    state.eventManageId = eventoId;
    document.getElementById('manage-event-title').textContent = ev.nome;
    document.getElementById('manage-event-desc').textContent = ev.descricao || 'Sem descrição cadastrada.';
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
            container.innerHTML = '<div class="text-center py-4">Nenhum participante.</div>';
            return;
        }
        participantes.forEach(p => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border mb-2';
            item.innerHTML = `<p class="font-bold">${escapeHTML(p.nome)}</p><button class="text-red-500 btn-remove-participant" data-id="${p.id}">X</button>`;
            item.querySelector('.btn-remove-participant').addEventListener('click', async () => {
                if(confirm('Remover participante?')) {
                    await removeParticipant(state.eventManageId, p.id);
                    fetchAndRenderParticipants();
                    loadEventsFromServer();
                }
            });
            container.appendChild(item);
        });
    } catch (e) {
        container.innerHTML = '<div class="text-red-500 py-4">Erro ao carregar participantes</div>';
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
