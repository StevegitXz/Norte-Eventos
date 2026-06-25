// ==========================================
// API FUNCTIONS
// ==========================================

export async function fetchUser() {
    const response = await fetch('/api/usuarios/me');
    if (!response.ok) throw new Error('Não autenticado');
    return await response.json();
}

export async function fetchEvents() {
    const response = await fetch('/api/eventos');
    if (!response.ok) throw new Error('Erro ao buscar eventos');
    return await response.json();
}

export async function fetchExploreEvents() {
    const response = await fetch('/api/eventos/explorar');
    if (!response.ok) throw new Error('Erro ao buscar eventos para explorar');
    return await response.json();
}

export async function createEvent(eventoData) {
    const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventoData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.erro || 'Erro ao criar evento');
    }
    return response;
}

export async function updateEvent(id, eventoData) {
    const response = await fetch('/api/eventos/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventoData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.erro || 'Erro ao atualizar evento');
    }
    return response;
}

export async function deleteEvent(id) {
    const response = await fetch('/api/eventos/' + id, { method: 'DELETE' });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.erro || 'Erro ao excluir evento');
    }
    return response;
}

export async function uploadImage(file) {
    const formData = new FormData();
    formData.append('imagem', file);
    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    if (!response.ok) throw new Error('Falha ao fazer upload da imagem');
    return await response.json();
}

export async function fetchParticipants(eventId) {
    const response = await fetch(`/api/eventos/${eventId}/participantes`);
    if (!response.ok) throw new Error('Erro ao carregar participantes');
    return await response.json();
}

export async function addParticipant(eventId, email) {
    const response = await fetch(`/api/eventos/${eventId}/participantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.erro || 'Erro ao adicionar participante');
    }
    return response;
}

export async function removeParticipant(eventId, participanteId) {
    const response = await fetch(`/api/eventos/${eventId}/participantes/${participanteId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.erro || 'Erro ao remover participante');
    }
    return response;
}

export async function handleSubscription(eventId, method) {
    const response = await fetch(`/api/eventos/${eventId}/inscrever`, { method });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.erro || 'Erro na inscrição');
    }
    return response;
}

export async function fetchNotifications() {
    const response = await fetch('/api/notificacoes');
    if (!response.ok) throw new Error('Erro ao buscar notificações');
    return await response.json();
}

export async function markNotificationAsRead(id) {
    const response = await fetch(`/api/notificacoes/${id}/lida`, { method: 'PUT' });
    return response;
}

export async function clearNotifications() {
    const response = await fetch('/api/notificacoes', { method: 'DELETE' });
    return response;
}

export async function updateProfile(nome, email) {
    const response = await fetch('/api/usuarios/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.erro || 'Erro ao atualizar perfil');
    }
    return await response.json();
}

export async function deleteAccount() {
    const response = await fetch('/api/usuarios/me', { method: 'DELETE' });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.erro || 'Erro ao excluir conta');
    }
    return response;
}

export async function logoutUser() {
    const response = await fetch('/api/usuarios/logout', { method: 'POST' });
    return response;
}
