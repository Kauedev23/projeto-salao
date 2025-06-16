// Configuração do Supabase
// **ATENÇÃO:** Substitua com as suas chaves do Supabase
const SUPABASE_URL = 'https://zjyrtblttwtqjctqipnt.supabase.co'; // Ex: 'https://abcdefghijklmnop.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeXJ0Ymx0dHd0cWpjdHFpcG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY3NDcsImV4cCI6MjA2NTY2Mjc0N30.7MkR9xCRBSXpXveBSiRYyouXIPEqPnD-qtJHknp6jE0'; // Ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const supabase = window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

// Elementos do DOM
const authSection = document.getElementById('auth-section');
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const authButton = document.getElementById('auth-button');
const toggleAuth = document.getElementById('toggle-auth');
const nameGroup = document.getElementById('name-group');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nameInput = document.getElementById('name');
const alertContainer = document.getElementById('alert-container');

const residentDashboard = document.getElementById('resident-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');

const navDashboard = document.getElementById('nav-dashboard');
const navAdminDashboard = document.getElementById('nav-admin-dashboard');
const navLogout = document.getElementById('nav-logout');

const calendarEl = document.getElementById('calendar');
let calendar; // Para a instância do FullCalendar

const requestBookingForm = document.getElementById('request-booking-form');
const bookingDateInput = document.getElementById('booking-date');
const bookingTimeSelect = document.getElementById('booking-time');
const myBookingsList = document.getElementById('my-bookings-list');

const pendingBookingsList = document.getElementById('pending-bookings-list');
const blockDateForm = document.getElementById('block-date-form');
const blockDateInput = document.getElementById('block-date');
const blockReasonInput = document.getElementById('block-reason');
const blockedDatesList = document.getElementById('blocked-dates-list');
const allBookingsHistoryList = document.getElementById('all-bookings-history-list');

let isRegistering = false; // Flag para alternar entre login e cadastro
let currentUser = null;
let currentUserProfile = null;

// --- Funções Auxiliares ---

/**
 * Exibe uma mensagem de alerta na tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'success'|'danger'|'warning'|'info'} type - O tipo de alerta (cor).
 */
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alertDiv);
    // Remove o alerta após 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Formata uma data para o formato DD/MM/YYYY.
 * @param {string|Date} dateString - A string ou objeto Date.
 * @returns {string} Data formatada.
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formata uma data e hora para exibição completa.
 * @param {string} datetimeString - A string de data e hora.
 * @returns {string} Data e hora formatada.
 */
function formatDateTime(datetimeString) {
    const date = new Date(datetimeString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Converte uma data para o formato YYYY-MM-DD para inputs type="date".
 * @param {Date} date - Objeto Date.
 * @returns {string} Data formatada.
 */
function toInputDateFormat(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Inicializa o calendário FullCalendar.
 * @param {Array} events - Eventos a serem exibidos no calendário.
 */
function initializeCalendar(events = []) {
    if (calendar) {
        calendar.destroy(); // Destrói a instância anterior se existir
    }
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        height: 'auto',
        events: events,
        eventContent: function(arg) {
            // Personaliza o conteúdo do evento para incluir o horário
            const timeText = arg.event.extendedProps.time ? ` (${arg.event.extendedProps.time})` : '';
            return { html: `<div class="fc-event-title">${arg.event.title}${timeText}</div>` };
        }
    });
    calendar.render();
}

// --- Funções de Autenticação ---

/**
 * Alterna entre o formulário de Login e Cadastro.
 */
toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isRegistering = !isRegistering;
    if (isRegistering) {
        authTitle.textContent = 'Cadastro';
        authButton.textContent = 'Cadastrar';
        nameGroup.style.display = 'block';
        toggleAuth.textContent = 'Fazer Login';
    } else {
        authTitle.textContent = 'Login';
        authButton.textContent = 'Login';
        nameGroup.style.display = 'none';
        toggleAuth.textContent = 'Cadastre-se';
    }
    // Limpa os campos
    emailInput.value = '';
    passwordInput.value = '';
    nameInput.value = '';
    alertContainer.innerHTML = ''; // Limpa alertas
});

/**
 * Lida com o envio do formulário de autenticação (Login ou Cadastro).
 */
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    const name = nameInput.value;

    alertContainer.innerHTML = ''; // Limpa alertas anteriores

    if (isRegistering) {
        // Validação de Cadastro
        if (!email || !password || !name) {
            showAlert('Por favor, preencha todos os campos.', 'danger');
            return;
        }
        if (password.length < 6) {
            showAlert('A senha deve ter no mínimo 6 caracteres.', 'danger');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        nome: name,
                        perfil: 'morador' // Por padrão, novos usuários são moradores
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Inserir o perfil na tabela 'users'
                const { user } = session; // ou use o retorno do signUp

                await supabase
                  .from('users')
                  .insert([
                    {
                      id: user.id, // o mesmo id do Auth
                      nome: nameInput.value,
                      perfil: 'morador' // ou outro perfil padrão
                    }
                  ]);

                showAlert('Cadastro realizado com sucesso! Verifique seu email para confirmar.', 'success');
                // Após o cadastro, pode-se logar ou esperar a confirmação do email
                isRegistering = false;
                toggleAuth.click(); // Volta para a tela de login
            }

        } catch (error) {
            console.error('Erro no cadastro:', error.message);
            if (error.message.includes('already registered')) {
                showAlert('Este email já está cadastrado. Tente fazer login ou use outro email.', 'danger');
            } else {
                showAlert(`Erro ao cadastrar: ${error.message}`, 'danger');
            }
        }
    } else {
        // Validação de Login
        if (!email || !password) {
            showAlert('Por favor, preencha email e senha.', 'danger');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            if (data.user) {
                showAlert('Login realizado com sucesso!', 'success');
                // Redirecionar para o painel
                checkUserAndRedirect();
            }

        } catch (error) {
            console.error('Erro no login:', error.message);
            showAlert(`Erro ao fazer login: ${error.message}`, 'danger');
        }
    }
});

/**
 * Busca o perfil do usuário logado na tabela 'users'.
 */
async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('perfil, nome')
        .eq('id', userId)
        .maybeSingle(); // Troque .single() por .maybeSingle()

    if (error) {
        console.error('Erro ao buscar perfil do usuário:', error.message);
        return null;
    }
    return data;
}

/**
 * Verifica o status do usuário logado e exibe o painel apropriado.
 */
async function checkUserAndRedirect() {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;

    authSection.style.display = 'none';
    residentDashboard.style.display = 'none';
    adminDashboard.style.display = 'none';
    navDashboard.style.display = 'none';
    navAdminDashboard.style.display = 'none';
    navLogout.style.display = 'none';
    alertContainer.innerHTML = ''; // Limpa alertas

    if (currentUser) {
        navLogout.style.display = 'block';
        currentUserProfile = await getUserProfile(currentUser.id);

        if (currentUserProfile) {
            if (currentUserProfile.perfil === 'admin') {
                navAdminDashboard.style.display = 'block';
                adminDashboard.style.display = 'block';
                loadAdminDashboard();
            } else {
                navDashboard.style.display = 'block';
                residentDashboard.style.display = 'block';
                loadResidentDashboard();
            }
        } else {
            // Se o perfil não for encontrado, algo deu errado com o cadastro.
            showAlert('Erro: Perfil do usuário não encontrado. Por favor, contate o suporte.', 'danger');
            await supabase.auth.signOut(); // Força o logout
            authSection.style.display = 'block';
        }
    } else {
        authSection.style.display = 'block';
    }
}

/**
 * Lida com o logout do usuário.
 */
navLogout.addEventListener('click', async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error.message);
        showAlert('Erro ao fazer logout. Tente novamente.', 'danger');
    } else {
        showAlert('Você foi desconectado.', 'info');
        checkUserAndRedirect();
    }
});

// --- Funções do Painel do Morador ---

/**
 * Carrega os dados para o painel do morador.
 */
async function loadResidentDashboard() {
    // Carrega o calendário com as reservas e datas bloqueadas
    await loadCalendarEvents();
    // Carrega as minhas reservas
    await loadMyBookings();

    // Define a data mínima para o input de reserva (a partir de amanhã)
    const today = new Date();
    today.setDate(today.getDate() + 1); // Garante que não é possível reservar para hoje ou passado
    bookingDateInput.min = toInputDateFormat(today);
}

/**
 * Carrega todos os eventos (reservas e datas bloqueadas) para o calendário.
 */
async function loadCalendarEvents() {
    // Buscar reservas
    const { data: reservations, error: reservationsError } = await supabase
        .from('reservas')
        .select(`
            id,
            data_reserva,
            horario,
            status,
            users (nome)
        `);

    if (reservationsError) {
        console.error('Erro ao buscar reservas para o calendário:', reservationsError.message);
        showAlert('Erro ao carregar reservas.', 'danger');
        return;
    }

    // Buscar datas bloqueadas
    const { data: blockedDates, error: blockedDatesError } = await supabase
        .from('datas_bloqueadas')
        .select('*');

    if (blockedDatesError) {
        console.error('Erro ao buscar datas bloqueadas para o calendário:', blockedDatesError.message);
        showAlert('Erro ao carregar datas bloqueadas.', 'danger');
        return;
    }

    const events = [];

    // Adicionar reservas como eventos do calendário
    reservations.forEach(res => {
        let className = '';
        let title = '';

        if (res.status === 'aprovado') {
            className = 'fc-event-approved';
            title = `Reservado (${res.users.nome || 'Usuário'})`;
        } else if (res.status === 'pendente') {
            className = 'fc-event-pending';
            title = `Pendente (${res.users.nome || 'Usuário'})`;
        } else if (res.status === 'recusado') {
            className = 'fc-event-recusado';
            title = `Recusado (${res.users.nome || 'Usuário'})`;
        }

        // Para evitar mostrar nome em reservas pendentes/recusadas para outros moradores
        if (currentUserProfile.perfil === 'morador' && res.status !== 'aprovado' && res.user_id !== currentUser.id) {
             title = `Indisponível`;
        }


        events.push({
            id: res.id,
            title: title,
            start: res.data_reserva,
            className: className,
            extendedProps: {
                status: res.status,
                time: res.horario,
                userName: res.users ? res.users.nome : 'N/A'
            }
        });
    });

    // Adicionar datas bloqueadas como eventos do calendário
    blockedDates.forEach(date => {
        events.push({
            id: date.id,
            title: `Bloqueado: ${date.motivo}`,
            start: date.data_bloqueada,
            display: 'background', // Mostra como um fundo
            color: '#6c757d', // Cinza para bloqueado
            className: 'fc-event-blocked'
        });
    });

    initializeCalendar(events);
}

/**
 * Lida com a solicitação de uma nova reserva.
 */
requestBookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bookingDate = bookingDateInput.value;
    const bookingTime = bookingTimeSelect.value;

    alertContainer.innerHTML = '';

    if (!bookingDate || !bookingTime) {
        showAlert('Por favor, selecione a data e o horário da reserva.', 'danger');
        return;
    }

    const selectedDate = new Date(bookingDate + 'T00:00:00'); // Garante fuso horário
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparação apenas de data

    if (selectedDate <= today) {
        showAlert('Não é possível solicitar reservas para datas passadas ou para hoje.', 'danger');
        return;
    }

    try {
        // Verificar se a data já está bloqueada
        const { data: blocked, error: blockedError } = await supabase
            .from('datas_bloqueadas')
            .select('*')
            .eq('data_bloqueada', bookingDate);

        if (blockedError) throw blockedError;
        if (blocked && blocked.length > 0) {
            showAlert(`Esta data está bloqueada: ${blocked[0].motivo}`, 'danger');
            return;
        }

        // Verificar se já existe uma reserva aprovada ou pendente para a mesma data e horário
        const { data: existingBookings, error: existingBookingsError } = await supabase
            .from('reservas')
            .select('*')
            .eq('data_reserva', bookingDate)
            .eq('horario', bookingTime)
            .in('status', ['pendente', 'aprovado']); // Considera pendente e aprovado como ocupado

        if (existingBookingsError) throw existingBookingsError;

        if (existingBookings && existingBookings.length > 0) {
            showAlert('Já existe uma reserva pendente ou aprovada para esta data e horário.', 'danger');
            return;
        }

        // Inserir a nova reserva
        const { data, error } = await supabase
            .from('reservas')
            .insert([
                {
                    user_id: currentUser.id,
                    data_reserva: bookingDate,
                    horario: bookingTime,
                    status: 'pendente',
                    data_solicitacao: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        showAlert('Solicitação de reserva enviada com sucesso! Aguarde a aprovação do administrador.', 'success');
        requestBookingForm.reset(); // Limpa o formulário
        await loadMyBookings(); // Recarrega minhas reservas
        await loadCalendarEvents(); // Atualiza o calendário
    } catch (error) {
        console.error('Erro ao solicitar reserva:', error.message);
        showAlert(`Erro ao solicitar reserva: ${error.message}`, 'danger');
    }
});

/**
 * Carrega e exibe as reservas do morador logado.
 */
async function loadMyBookings() {
    myBookingsList.innerHTML = '';
    const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('data_reserva', { ascending: false });

    if (error) {
        console.error('Erro ao carregar minhas reservas:', error.message);
        showAlert('Erro ao carregar suas reservas.', 'danger');
        return;
    }

    if (data.length === 0) {
        myBookingsList.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma reserva solicitada ainda.</td></tr>';
        return;
    }

    data.forEach(booking => {
        const row = myBookingsList.insertRow();
        row.insertCell().textContent = formatDate(booking.data_reserva);
        row.insertCell().textContent = booking.horario;
        const statusCell = row.insertCell();
        statusCell.textContent = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
        statusCell.className = `status-${booking.status}`; // Adiciona classe para estilização

        row.insertCell().textContent = formatDateTime(booking.data_solicitacao);
    });
}

// --- Funções do Painel do Administrador ---

/**
 * Carrega os dados para o painel do administrador.
 */
async function loadAdminDashboard() {
    await loadPendingBookings();
    await loadBlockedDates();
    await loadAllBookingsHistory();
    // Admin também pode ver o calendário
    await loadCalendarEvents();

    // Define a data mínima para o input de bloqueio (a partir de amanhã)
    const today = new Date();
    today.setDate(today.getDate() + 1);
    blockDateInput.min = toInputDateFormat(today);
}

/**
 * Carrega e exibe as solicitações de reserva pendentes.
 */
async function loadPendingBookings() {
    pendingBookingsList.innerHTML = '';
    const { data, error } = await supabase
        .from('reservas')
        .select(`
            id,
            data_reserva,
            horario,
            status,
            data_solicitacao,
            users (id, nome, email)
        `)
        .eq('status', 'pendente')
        .order('data_reserva', { ascending: true });

    if (error) {
        console.error('Erro ao carregar reservas pendentes:', error.message);
        showAlert('Erro ao carregar solicitações pendentes.', 'danger');
        return;
    }

    if (data.length === 0) {
        pendingBookingsList.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma solicitação de reserva pendente.</td></tr>';
        return;
    }

    data.forEach(booking => {
        const row = pendingBookingsList.insertRow();
        row.insertCell().textContent = booking.users ? booking.users.nome : 'N/A';
        row.insertCell().textContent = booking.users ? booking.users.email : 'N/A';
        row.insertCell().textContent = formatDate(booking.data_reserva);
        row.insertCell().textContent = booking.horario;
        const statusCell = row.insertCell();
        statusCell.textContent = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
        row.insertCell().textContent = formatDateTime(booking.data_solicitacao);

        const actionsCell = row.insertCell();
        const approveButton = document.createElement('button');
        approveButton.className = 'btn btn-success btn-sm me-2';
        approveButton.textContent = 'Aprovar';
        approveButton.onclick = () => updateBookingStatus(booking.id, 'aprovado', booking.data_reserva, booking.horario);
        actionsCell.appendChild(approveButton);

        const refuseButton = document.createElement('button');
        refuseButton.className = 'btn btn-danger btn-sm';
        refuseButton.textContent = 'Recusar';
        refuseButton.onclick = () => updateBookingStatus(booking.id, 'recusado');
        actionsCell.appendChild(refuseButton);
    });
}

/**
 * Atualiza o status de uma reserva.
 * @param {string} bookingId - ID da reserva.
 * @param {'aprovado'|'recusado'} newStatus - Novo status.
 * @param {string} bookingDate - Data da reserva (para validação de conflito).
 * @param {string} bookingTime - Horário da reserva (para validação de conflito).
 */
async function updateBookingStatus(bookingId, newStatus, bookingDate = null, bookingTime = null) {
    alertContainer.innerHTML = '';

    // Validação adicional para aprovação: verificar se já existe outra aprovada na mesma data/horário
    if (newStatus === 'aprovado' && bookingDate && bookingTime) {
        const { data: existingApprovedBookings, error: existingApprovedError } = await supabase
            .from('reservas')
            .select('*')
            .eq('data_reserva', bookingDate)
            .eq('horario', bookingTime)
            .eq('status', 'aprovado')
            .not('id', 'eq', bookingId); // Exclui a própria reserva que está sendo verificada

        if (existingApprovedError) {
            console.error('Erro ao verificar reservas existentes:', existingApprovedError.message);
            showAlert('Erro ao verificar conflitos de reserva.', 'danger');
            return;
        }
        if (existingApprovedBookings && existingApprovedBookings.length > 0) {
            showAlert('Não foi possível aprovar. Já existe uma reserva aprovada para esta data e horário.', 'danger');
            return;
        }

         // Verificar se a data está bloqueada
        const { data: blocked, error: blockedError } = await supabase
            .from('datas_bloqueadas')
            .select('*')
            .eq('data_bloqueada', bookingDate);

        if (blockedError) {
            console.error('Erro ao verificar datas bloqueadas:', blockedError.message);
            showAlert('Erro ao verificar datas bloqueadas.', 'danger');
            return;
        }
        if (blocked && blocked.length > 0) {
            showAlert(`Não foi possível aprovar. Esta data está bloqueada: ${blocked[0].motivo}`, 'danger');
            return;
        }
    }


    try {
        const { error } = await supabase
            .from('reservas')
            .update({ status: newStatus })
            .eq('id', bookingId);

        if (error) throw error;

        showAlert(`Reserva ${newStatus === 'aprovado' ? 'aprovada' : 'recusada'} com sucesso!`, 'success');
        await loadAdminDashboard(); // Recarrega o painel do admin
        await loadCalendarEvents(); // Atualiza o calendário
    } catch (error) {
        console.error('Erro ao atualizar status da reserva:', error.message);
        showAlert(`Erro ao atualizar status da reserva: ${error.message}`, 'danger');
    }
}

/**
 * Lida com o bloqueio de uma nova data.
 */
blockDateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const blockDate = blockDateInput.value;
    const blockReason = blockReasonInput.value;

    alertContainer.innerHTML = '';

    if (!blockDate || !blockReason) {
        showAlert('Por favor, preencha a data e o motivo do bloqueio.', 'danger');
        return;
    }

    const selectedDate = new Date(blockDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
        showAlert('Não é possível bloquear datas passadas ou hoje.', 'danger');
        return;
    }

    try {
        // Verificar se a data já está bloqueada
        const { data: existingBlocked, error: existingBlockedError } = await supabase
            .from('datas_bloqueadas')
            .select('*')
            .eq('data_bloqueada', blockDate);

        if (existingBlockedError) throw existingBlockedError;
        if (existingBlocked && existingBlocked.length > 0) {
            showAlert('Esta data já está bloqueada.', 'danger');
            return;
        }

        // Verificar se existem reservas aprovadas ou pendentes na data
        const { data: existingBookings, error: existingBookingsError } = await supabase
            .from('reservas')
            .select('*')
            .eq('data_reserva', blockDate)
            .in('status', ['pendente', 'aprovado']);

        if (existingBookingsError) throw existingBookingsError;

        if (existingBookings && existingBookings.length > 0) {
            const confirmBlock = confirm('Existem reservas pendentes ou aprovadas para esta data. Bloquear esta data irá recusá-las automaticamente. Deseja continuar?');
            if (!confirmBlock) {
                return;
            }
            // Recusa as reservas existentes se o admin confirmar
            for (const booking of existingBookings) {
                await supabase
                    .from('reservas')
                    .update({ status: 'recusado' })
                    .eq('id', booking.id);
            }
        }

        // Inserir a nova data bloqueada
        const { error } = await supabase
            .from('datas_bloqueadas')
            .insert([{ data_bloqueada: blockDate, motivo: blockReason }]);

        if (error) throw error;

        showAlert('Data bloqueada com sucesso!', 'success');
        blockDateForm.reset();
        await loadAdminDashboard(); // Recarrega o painel do admin
        await loadCalendarEvents(); // Atualiza o calendário
    } catch (error) {
        console.error('Erro ao bloquear data:', error.message);
        showAlert(`Erro ao bloquear data: ${error.message}`, 'danger');
    }
});

/**
 * Carrega e exibe as datas bloqueadas.
 */
async function loadBlockedDates() {
    blockedDatesList.innerHTML = '';
    const { data, error } = await supabase
        .from('datas_bloqueadas')
        .select('*')
        .order('data_bloqueada', { ascending: true });

    if (error) {
        console.error('Erro ao carregar datas bloqueadas:', error.message);
        showAlert('Erro ao carregar datas bloqueadas.', 'danger');
        return;
    }

    if (data.length === 0) {
        blockedDatesList.innerHTML = '<tr><td colspan="3" class="text-center">Nenhuma data bloqueada.</td></tr>';
        return;
    }

    data.forEach(blockedDate => {
        const row = blockedDatesList.insertRow();
        row.insertCell().textContent = formatDate(blockedDate.data_bloqueada);
        row.insertCell().textContent = blockedDate.motivo;

        const actionsCell = row.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = 'Desbloquear';
        deleteButton.onclick = () => deleteBlockedDate(blockedDate.id);
        actionsCell.appendChild(deleteButton);
    });
}

/**
 * Exclui uma data bloqueada.
 * @param {string} blockedDateId - ID da data bloqueada.
 */
async function deleteBlockedDate(blockedDateId) {
    if (!confirm('Tem certeza que deseja desbloquear esta data?')) {
        return;
    }
    alertContainer.innerHTML = '';
    try {
        const { error } = await supabase
            .from('datas_bloqueadas')
            .delete()
            .eq('id', blockedDateId);

        if (error) throw error;

        showAlert('Data desbloqueada com sucesso!', 'success');
        await loadAdminDashboard(); // Recarrega o painel do admin
        await loadCalendarEvents(); // Atualiza o calendário
    } catch (error) {
        console.error('Erro ao desbloquear data:', error.message);
        showAlert(`Erro ao desbloquear data: ${error.message}`, 'danger');
    }
}

/**
 * Carrega e exibe o histórico de todas as reservas (para o administrador).
 */
async function loadAllBookingsHistory() {
    allBookingsHistoryList.innerHTML = '';
    const { data, error } = await supabase
        .from('reservas')
        .select(`
            id,
            data_reserva,
            horario,
            status,
            data_solicitacao,
            users (nome, email)
        `)
        .order('data_solicitacao', { ascending: false });

    if (error) {
        console.error('Erro ao carregar histórico de reservas:', error.message);
        showAlert('Erro ao carregar histórico de reservas.', 'danger');
        return;
    }

    if (data.length === 0) {
        allBookingsHistoryList.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma reserva no histórico.</td></tr>';
        return;
    }

    data.forEach(booking => {
        const row = allBookingsHistoryList.insertRow();
        row.insertCell().textContent = booking.users ? booking.users.nome : 'N/A';
        row.insertCell().textContent = booking.users ? booking.users.email : 'N/A';
        row.insertCell().textContent = formatDate(booking.data_reserva);
        row.insertCell().textContent = booking.horario;
        const statusCell = row.insertCell();
        statusCell.textContent = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
        statusCell.className = `status-${booking.status}`;
        row.insertCell().textContent = formatDateTime(booking.data_solicitacao);
    });
}

// --- Inicialização ---

// Verifica o usuário logado ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    checkUserAndRedirect();

    // Adiciona evento de escuta para alterações no estado de autenticação
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
            checkUserAndRedirect();
        }
    });

    // Lógica para navegação entre painéis (para o caso de admin ter acesso ao painel do morador ou vice-versa, se desejado)
    // No nosso caso, estamos exibindo um ou outro, então essa navegação é mais para alternar entre "Home" e o painel ativo.
    document.getElementById('nav-home').addEventListener('click', (e) => {
        e.preventDefault();
        checkUserAndRedirect(); // Redireciona para o painel correto
    });

    document.getElementById('nav-dashboard').addEventListener('click', (e) => {
        e.preventDefault();
        residentDashboard.style.display = 'block';
        adminDashboard.style.display = 'none';
        authSection.style.display = 'none';
        loadResidentDashboard();
    });

    document.getElementById('nav-admin-dashboard').addEventListener('click', (e) => {
        e.preventDefault();
        adminDashboard.style.display = 'block';
        residentDashboard.style.display = 'none';
        authSection.style.display = 'none';
        loadAdminDashboard();
    });

    // Botão de logout do morador
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }

    // Botão de logout do admin
    const logoutBtnAdmin = document.getElementById('logout-btn-admin');
    if (logoutBtnAdmin) {
        logoutBtnAdmin.addEventListener('click', async function() {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
});