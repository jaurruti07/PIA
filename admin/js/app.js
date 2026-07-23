url: https://raw.githubusercontent.com/jaurruti07/PIA/main/admin/js/app.js

// app.js - Controlador principal del panel
import { initDatabaseManager } from './database-manager.js';


document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const { user } = await verifyToken(token);
            showDashboard(user);
        } catch {
            showLogin();
        }
    } else {
        showLogin();
    }

    // Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value;
        try {
            const { token, user } = await login(username, password);
            localStorage.setItem('token', token);
            showDashboard(user);
        } catch (err) {
            document.getElementById('loginError').textContent = err.message;
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Sidebar toggle (móvil)
    const sidebar = document.getElementById('sidebar');
    document.getElementById('sidebarToggleMobile').addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    // Cerrar sidebar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            if (!sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle-mobile')) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Tema oscuro/claro
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');
    let darkMode = localStorage.getItem('adminTheme') === 'dark';
    applyTheme(darkMode);
    themeToggle.addEventLi
stener('click', () => {
        darkMode = !darkMode;
        applyTheme(darkMode);
        localStorage.setItem('adminTheme', darkMode ? 'dark' : 'light');
    });

    function applyTheme(dark) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        themeIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
        themeLabel.textContent = dark ? 'Claro' : 'Oscuro';
    }

    // Navegación por módulos
    document.querySelector('.sidebar-nav').addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        const module = link.dataset.module;
        if (!module) return;
        e.preventDefault();

        // Marcar activo
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Cerrar sidebar en móvil
        if (window.innerWidth <= 992) sidebar.classList.remove('open');

        // Cargar contenido
        await loadModule(module);
    });

    // Cargar menú de módulos
    await loadMenuModules();

    // Dashboard por defecto
    await loadModule('dashboard');
});

// ============================
// FUNCIONES DE CARGA
// ============================

async function loadMenuModules() {
    try {
        const modules = await getModules();
        const container = document.getElementById('menuModules');
        container.innerHTML = '';
        modules.push('database');
        modules.forEach(mod => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.dataset.module = mod;
            a.innerHTML = `<i class="fas fa-cube"></i> <span>${capitalize(mod)}</span>`;
            li.appendChild(a);
            container.appendChild(li);
        });
    } catch (err) {
        console.error('Error cargando módulos:', err);
        showToast('Error al cargar los módulos', 'error');
    }
}

async function loadModule(module) {
  
  const content = document.getElementById('contentArea');
    const title = document.getElementById('pageTitle');

    if (module === 'dashboard') {
        title.textContent = 'Dashboard';
        content.innerHTML = `
            <div id="dashboardContent">
                <div class="stats-grid" id="statsGrid"></div>
                <div class="chart-row">
                    <div class="chart-box"><canvas id="chartModules"></canvas></div>
                    <div class="chart-box"><canvas id="chartAudit"></canvas></div>
                </div>
                <div class="recent-activity" id="recentActivity"></div>
            </div>
        `;
        loadDashboard();
        return;
    }

    if (module === 'files') {
        title.textContent = 'Administrador de Archivos';
        content.innerHTML = `<div id="fileManagerContent">Cargando...</div>`;
        loadFileManager();
        return;
    }

    if (module === 'backup') {
        title.textContent = 'Respaldos';
        content.innerHTML = `<div id="backupContent">Cargando...</div>`;
        loadBackupManager();
        return;
    }

    if (module === 'users') {
        title.textContent = 'Usuarios';
        content.innerHTML = `<div id="usersContent">Cargando...</div>`;
        loadUserManager();
        return;
    }

    if (module === 'config') {
        title.textContent = 'Configuración';
        content.innerHTML = `<div id="configContent">Cargando...</div>`;
        loadConfigManager();
        return;
    }

    // Módulo dinámico (CRUD)
    title.textContent = capitalize(module);
    content.innerHTML = `<div id="crudContent">Cargando...</div>`;
    renderCrud(module);
}

// ============================
// DASHBOARD
// ============================

async function loadDashboard() {
    try {
        // Obtener estadísticas del backend
        const res = await fetch(`${getApiBase()}/dashboard/stats`, { headers: getHeaders() });
        const stats = await res.json();

        const grid = do
cument.getElementById('statsGrid');
        grid.innerHTML = Object.entries(stats).map(([key, value]) => `
            <div class="stat-card">
                <div class="label">${capitalize(key)}</div>
                <div class="value">${value}</div>
            </div>
        `).join('');

        // Gráficos simples (ejemplo)
        const ctx1 = document.getElementById('chartModules').getContext('2d');
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Módulos', 'Registros', 'Usuarios'],
                datasets: [{
                    label: 'Cantidad',
                    data: [stats.modulos || 0, stats.registros || 0, stats.usuarios || 0],
                    backgroundColor: ['#2B82C9', '#22C55E', '#F97316']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const ctx2 = document.getElementById('chartAudit').getContext('2d');
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Creados', 'Actualizados', 'Eliminados'],
                datasets: [{
                    data: [stats.creados || 0, stats.actualizados || 0, stats.eliminados || 0],
                    backgroundColor: ['#22C55E', '#2B82C9', '#EF4444']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Actividad reciente
        const activity = document.getElementById('recentActivity');
        activity.innerHTML = `<h3>Actividad reciente</h3><div id="activityList">Cargando...</div>`;
        const auditRes = await fetch(`${getApiBase()}/dashboard/audit`, { headers: getHeaders() });
        const audit = await auditRes.json();
        const list = document.getElementById('activityList');
        if (audit.length === 0) {
            list.innerHTML = '<p class="text-muted">No hay actividad reciente</p>';
        } else {
            list.innerHTML = audit.s
lice(0, 10).map(item => `
                <div class="activity-item">
                    <span><span class="activity-user">${item.user}</span> ${item.action} en ${item.module}</span>
                    <span class="activity-time">${formatDate(item.timestamp)}</span>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error cargando dashboard:', err);
        showToast('Error al cargar el dashboard', 'error');
    }
}

// ============================
// CRUD DINÁMICO
// ============================

let currentModule = '';
let currentPage = 1;
const perPage = 10;

async function renderCrud(module) {
    currentModule = module;
    currentPage = 1;
    await fetchAndRenderTable();
}

async function fetchAndRenderTable() {
    try {
        const data = await getModuleData(currentModule);
        const container = document.getElementById('crudContent');
        if (!container) return;

        // Generar tabla
        const headers = data.length ? Object.keys(data[0]).filter(k => k !== 'id') : ['Sin datos'];
        const totalPages = Math.ceil(data.length / perPage);
        const start = (currentPage - 1) * perPage;
        const pageData = data.slice(start, start + perPage);

        let html = `
            <div class="table-toolbar">
                <div class="left">
                    <button class="btn-primary" id="btnNewRecord"><i class="fas fa-plus"></i> Nuevo</button>
                    <button class="btn-secondary" id="btnExportJson"><i class="fas fa-download"></i> Exportar JSON</button>
                    <button class="btn-secondary" id="btnImportJson"><i class="fas fa-upload"></i> Importar JSON</button>
                </div>
                <div class="right">
                    <input type="text" id="searchInput" placeholder="Buscar..." class="form-control" style="width:200px;" />
                </div>
            </div>
            <div class="table-wrapper">
                <table>
             
       <thead><tr>${headers.map(h => `<th>${capitalize(h)}</th>`).join('')}<th>Acciones</th></tr></thead>
                    <tbody>
                `;
        if (pageData.length === 0) {
            html += `<tr><td colspan="${headers.length+1}" style="text-align:center;">No hay registros</td></tr>`;
        } else {
            pageData.forEach(row => {
                html += `<tr>`;
                headers.forEach(h => {
                    let val = row[h] !== undefined ? row[h] : '';
                    if (typeof val === 'boolean') val = val ? '✅' : '❌';
                    if (typeof val === 'object') val = JSON.stringify(val);
                    if (val && val.length > 50) val = val.substring(0, 50) + '...';
                    html += `<td>${val}</td>`;
                });
                html += `<td>
                    <div class="table-actions">
                        <button class="edit-btn" data-id="${row.id}"><i class="fas fa-pen"></i></button>
                        <button class="delete-btn" data-id="${row.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td></tr>`;
            });
        }
        html += `</tbody></table></div>`;
        html += `<div class="pagination">`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += `</div>`;
        container.innerHTML = html;

        // Eventos
        document.getElementById('btnNewRecord').addEventListener('click', () => openCreateModal());
        document.getElementById('btnExportJson').addEventListener('click', () => exportJson(data));
        document.getElementById('btnImportJson').addEventListener('click', () => importJson());
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        document.querySelectorAll('.delete-b
tn').forEach(btn => {
            btn.addEventListener('click', () => deleteRecordHandler(btn.dataset.id));
        });
        document.querySelectorAll('.pagination button').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.dataset.page);
                fetchAndRenderTable();
            });
        });
        document.getElementById('searchInput').addEventListener('input', (e) => {
            // Búsqueda simple en el frontend (se puede implementar backend)
            const term = e.target.value.toLowerCase();
            const filtered = data.filter(row => {
                return Object.values(row).some(v => String(v).toLowerCase().includes(term));
            });
            // Re-render con filtro
            renderFilteredTable(filtered);
        });

    } catch (err) {
        console.error(err);
        showToast('Error al cargar los datos', 'error');
    }
}

function renderFilteredTable(filtered) {
    // Implementación similar a fetchAndRenderTable pero con datos filtrados
    // (por brevedad, se omite; se puede extender)
}

// ============================
// MODALES CRUD
// ============================

let currentEditId = null;
let currentSchema = null;

async function openCreateModal() {
    currentEditId = null;
    // Obtener un registro ejemplo para inferir el esquema
    const data = await getModuleData(currentModule);
    const schema = data.length > 0 ? data[0] : {};
    currentSchema = schema;
    showModal('Nuevo registro', generateForm(schema));
}

async function openEditModal(id) {
    currentEditId = id;
    const record = await getRecord(currentModule, id);
    const schema = record;
    currentSchema = schema;
    showModal('Editar registro', generateForm(schema, record));
}

function showModal(title, formHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = formHtml;
    document.getElementById('modalOve
rlay').style.display = 'flex';
    // Inicializar editores
    initEditors();
    // Configurar guardado
    document.getElementById('modalSave').onclick = () => saveRecord();
    document.getElementById('modalCancel').onclick = closeModal;
    document.getElementById('modalClose').onclick = closeModal;
    // Cerrar al hacer clic fuera
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('modalBody').innerHTML = '';
}

async function saveRecord() {
    const form = document.querySelector('#modalBody form') || document.querySelector('#modalBody');
    const data = getFormData(form);
    try {
        if (currentEditId) {
            await updateRecord(currentModule, currentEditId, data);
            showToast('Registro actualizado', 'success');
        } else {
            await createRecord(currentModule, data);
            showToast('Registro creado', 'success');
        }
        closeModal();
        fetchAndRenderTable();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteRecordHandler(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
        await deleteRecord(currentModule, id);
        showToast('Eliminado correctamente', 'success');
        fetchAndRenderTable();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ============================
// EXPORTAR / IMPORTAR JSON
// ============================

function exportJson(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentModule}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importJson() {
    const input = document.createElem
ent('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!Array.isArray(data)) throw new Error('El archivo debe contener un array');
                // Sobrescribir todos los datos (se podría implementar merge)
                for (const item of data) {
                    await createRecord(currentModule, item);
                }
                showToast('Importación completa', 'success');
                fetchAndRenderTable();
            } catch (err) {
                showToast('Error en el archivo: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================
// FUNCIONES PARA OTROS MÓDULOS
// (file-manager, backup, users, config)
// ============================

function loadFileManager() {
    // Se puede implementar un explorador de archivos usando el file-manager.js
    const content = document.getElementById('fileManagerContent');
    content.innerHTML = `
        <div class="file-upload-area">
            <input type="file" id="fileInput" multiple />
            <button class="btn-primary" id="uploadBtn">Subir archivos</button>
        </div>
        <div id="fileList">Cargando...</div>
    `;
    // Implementar listado y subida con las funciones de file-manager.js
    // (por brevedad se deja como placeholder)
}

function loadBackupManager() {
    const content = document.getElementById('backupContent');
    content.innerHTML = `
        <button class="btn-primary" id="createBackupBtn"><i class="fas fa-plus"></i> Crear respaldo</button>
        <div id="backupList">Cargando...</div>
    `;
    // Llamar a API de respaldos
}

function loadUserManager() {
    const content = document.get
ElementById('usersContent');
    content.innerHTML = `<p>Gestión de usuarios (pendiente)</p>`;
}

function loadConfigManager() {
    const content = document.getElementById('configContent');
    content.innerHTML = `<p>Configuración general (pendiente)</p>`;
}

// ============================
// AJUSTES FINALES
// ============================

// Exponer funciones globales para los modales
window.closeModal = closeModal;
window.saveRecord = saveRecord;