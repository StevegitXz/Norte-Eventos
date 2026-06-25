import { fetchUser, updateProfile, deleteAccount, logoutUser } from './api.js';
import { extractUsername } from './utils.js';
import { state } from './state.js';

// ==========================================
// AUTH & SETTINGS LOGIC
// ==========================================

export async function initAuth() {
    try {
        const userData = await fetchUser();
        state.userData = userData;

        const userEmail = userData.email || 'organizador@norteeventos.com';
        const userName = userData.nome || extractUsername(userEmail);
        
        document.querySelectorAll('.user-name-display').forEach(el => el.textContent = userName);
        document.querySelectorAll('.user-email-display').forEach(el => el.textContent = userEmail);

        const inputNome = document.getElementById('settings-nome');
        const inputEmail = document.getElementById('settings-email');
        if(inputNome) inputNome.value = userName;
        if(inputEmail) inputEmail.value = userEmail;

        document.querySelectorAll('.avatar').forEach(el => {
            el.textContent = userName.substring(0, 2).toUpperCase();
        });
    } catch (err) {
        window.location.href = '/login';
    }
}

export function setupAuthBindings() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await logoutUser();
            } catch (error) {}
            showToast('Sessão finalizada com sucesso. Até logo!', 'success');
            setTimeout(() => { window.location.href = '/login'; }, 1000);
        });
    }

    const formUpdateProfile = document.getElementById('form-update-profile');
    if (formUpdateProfile) {
        formUpdateProfile.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('settings-nome').value;
            const email = document.getElementById('settings-email').value;
            try {
                const data = await updateProfile(nome, email);
                showToast(data.mensagem || 'Perfil atualizado!', 'success');
                document.querySelectorAll('.user-name-display').forEach(el => el.textContent = nome);
                document.querySelectorAll('.user-email-display').forEach(el => el.textContent = email);
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // Modal de Excluir Conta
    const btnDeleteAccount = document.getElementById('btn-delete-account');
    const modalDeleteAccount = document.getElementById('modal-delete-account-confirm');
    const btnCloseDeleteAccountModal = document.getElementById('btn-close-delete-account-modal');
    const btnCancelDeleteAccount = document.getElementById('btn-cancel-delete-account');
    const btnConfirmDeleteAccount = document.getElementById('btn-confirm-delete-account');

    if (btnDeleteAccount && modalDeleteAccount) {
        btnDeleteAccount.addEventListener('click', () => {
            modalDeleteAccount.classList.add('open');
        });

        const closeAccountModal = () => modalDeleteAccount.classList.remove('open');
        if (btnCloseDeleteAccountModal) btnCloseDeleteAccountModal.addEventListener('click', closeAccountModal);
        if (btnCancelDeleteAccount) btnCancelDeleteAccount.addEventListener('click', closeAccountModal);

        if (btnConfirmDeleteAccount) {
            btnConfirmDeleteAccount.addEventListener('click', async () => {
                btnConfirmDeleteAccount.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
                try {
                    await deleteAccount();
                    showToast('Sua conta foi excluída. Adeus!', 'success');
                    setTimeout(() => { window.location.href = '/login'; }, 1500);
                } catch (err) {
                    showToast(err.message, 'error');
                    btnConfirmDeleteAccount.textContent = 'Sim, Excluir Conta';
                }
            });
        }
    }
}
