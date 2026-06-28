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

        const avatarPlaceholderList = document.querySelectorAll('.avatar, #settings-profile-placeholder');
        const avatarImgList = document.querySelectorAll('#sidebar-user-avatar, #settings-profile-preview');

        if (userData.foto_perfil) {
            avatarImgList.forEach(img => {
                img.src = userData.foto_perfil;
                img.classList.remove('hidden');
            });
            avatarPlaceholderList.forEach(el => el.classList.add('hidden'));
        } else {
            avatarPlaceholderList.forEach(el => {
                el.textContent = userName.substring(0, 2).toUpperCase();
                el.classList.remove('hidden');
            });
            avatarImgList.forEach(img => img.classList.add('hidden'));
        }
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

    const btnLogoutSettings = document.getElementById('btn-logout-settings');
    if (btnLogoutSettings) {
        btnLogoutSettings.addEventListener('click', async (e) => {
            e.preventDefault();
            try { await logoutUser(); } catch (error) {}
            showToast('Sessão finalizada com sucesso. Até logo!', 'success');
            setTimeout(() => { window.location.href = '/login'; }, 1000);
        });
    }

    const checkboxEdit = document.getElementById('settings-enable-edit');
    const inputNome = document.getElementById('settings-nome');
    const inputEmail = document.getElementById('settings-email');
    const btnSaveInfo = document.getElementById('btn-save-profile-info');

    if (checkboxEdit) {
        checkboxEdit.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            if(inputNome) inputNome.readOnly = !enabled;
            if(inputEmail) inputEmail.readOnly = !enabled;
            if(btnSaveInfo) btnSaveInfo.disabled = !enabled;
            if (enabled && inputNome) inputNome.focus();
        });
    }

    if (btnSaveInfo) {
        btnSaveInfo.addEventListener('click', async () => {
            const nome = inputNome.value;
            const email = inputEmail.value;
            try {
                const data = await updateProfile(nome, email);
                showToast(data.mensagem || 'Perfil atualizado!', 'success');
                document.querySelectorAll('.user-name-display').forEach(el => el.textContent = nome);
                document.querySelectorAll('.user-email-display').forEach(el => el.textContent = email);
                if (checkboxEdit) {
                    checkboxEdit.checked = false;
                    checkboxEdit.dispatchEvent(new Event('change'));
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    const fotoInput = document.getElementById('settings-foto');
    const picContainer = document.getElementById('profile-pic-container');
    const picPreview = document.getElementById('settings-profile-preview');
    const picPlaceholder = document.getElementById('settings-profile-placeholder');

    if (picContainer && fotoInput) {
        picContainer.addEventListener('click', () => fotoInput.click());
        fotoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    if(picPreview) {
                        picPreview.src = evt.target.result;
                        picPreview.classList.remove('hidden');
                    }
                    if (picPlaceholder) picPlaceholder.classList.add('hidden');
                }
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    const btnSavePic = document.getElementById('btn-save-profile-pic');
    if (btnSavePic && fotoInput) {
        btnSavePic.addEventListener('click', async () => {
            if (!fotoInput.files || !fotoInput.files[0]) {
                return showToast('Selecione uma imagem primeiro.', 'error');
            }
            try {
                const formData = new FormData();
                formData.append('nome', inputNome ? inputNome.value : state.userData.nome);
                formData.append('email', inputEmail ? inputEmail.value : state.userData.email);
                formData.append('foto_perfil', fotoInput.files[0]);

                const res = await fetch('/api/usuarios/me', {
                    method: 'PUT',
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.erro || 'Erro ao salvar foto.');
                showToast('Foto atualizada com sucesso!', 'success');
                
                if (data.usuario && data.usuario.foto_perfil) {
                    document.querySelectorAll('#sidebar-user-avatar, #settings-profile-preview').forEach(img => {
                        img.src = data.usuario.foto_perfil;
                        img.classList.remove('hidden');
                    });
                    document.querySelectorAll('.avatar, #settings-profile-placeholder').forEach(el => el.classList.add('hidden'));
                }
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    const btnSavePassword = document.getElementById('btn-save-password');
    if (btnSavePassword) {
        btnSavePassword.addEventListener('click', async () => {
            const senhaAtual = document.getElementById('settings-senha-atual').value;
            const novaSenha = document.getElementById('settings-nova-senha').value;
            const confirmarSenha = document.getElementById('settings-confirmar-senha').value;

            if (!senhaAtual || !novaSenha || !confirmarSenha) {
                return showToast('Preencha todos os campos de senha.', 'error');
            }
            if (novaSenha !== confirmarSenha) {
                return showToast('A nova senha e a confirmação não coincidem.', 'error');
            }

            try {
                const res = await fetch('/api/usuarios/me', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        nome: inputNome ? inputNome.value : state.userData.nome, 
                        email: inputEmail ? inputEmail.value : state.userData.email,
                        senhaAtual, 
                        novaSenha 
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.erro || 'Erro ao alterar senha.');
                showToast('Senha alterada com sucesso!', 'success');
                document.getElementById('settings-senha-atual').value = '';
                document.getElementById('settings-nova-senha').value = '';
                document.getElementById('settings-confirmar-senha').value = '';
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
