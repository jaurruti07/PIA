// database-manager.js - Interfaz de administración de bases de datos y datos mock

import { 
  getDbConfig, saveDbConfig, getAllDatabases, addDatabase, 
  updateDatabase, deleteDatabase, assignDatabaseToPage, 
  removePageAssignment, setDefaultDatabase, exportDbConfig, 
  importDbConfig, DB_TYPES, validateDbConfig
} from './database-config.js';

// Pages disponibles en el portal
const AVAILABLE_PAGES = [
  'canales-por-la-integridad',
  'directorio',
  'gobierno_en_numeros',
  'riesgo',
  'vehiculos',
  'index'
];

// Archivos JSON disponibles
const AVAILABLE_JSON_FILES = [
  { path: '/data_portal.json', name: 'data_portal.json', label: 'Portal Principal' },
  { path: '/canales-por-la-integridad/data_directorio.json', name: 'data_directorio.json', label: 'Canales x Integridad' },
  { path: '/directorio/data_acceso.json', name: 'data_acceso.json', label: 'Directorio Ejecutivo' },
  { path: '/gobierno_en_numeros/data_tableros.json', name: 'data_tableros.json', label: 'Gobierno en Números' }
];

let currentDbId = null;
let currentJsonPath = null;

// Inicializar el módulo
export async function initDatabaseManager() {
  renderDatabaseManager();
  setupEventListeners();
  initMockDataTab();
}

// Renderizar la interfaz principal
function renderDatabaseManager() {
  const config = getDbConfig();
  const databases = getAllDatabases();
  
  const html = `
    <div class="db-manager-container">
      <div class="db-header">
        <h2><i class="fas fa-database"></i> Administrador de Bases de Datos</h2>
        <div class="db-actions">
          <button class="btn btn-primary" id="addNewDb"><i class="fas fa-plus"></i> Nueva BD</button>
          <button class="btn btn-secondary" id="exportConfig"><i class="fas fa-download"></i> Exportar</button>
          <button class="btn btn-secondary" id="importConfig"><i class="fas fa-upload"></i> Importar</button>
        </div>
      </div>
      
      <div class="db-tabs">
        <button class="tab-btn active" data-tab="databases"><i class="fas fa-server"></i> Bases de Datos</button>
        <button class="tab-btn" data-tab="assignments"><i class="fas fa-link"></i> Asignaciones</button>
        <button class="tab-btn" data-tab="settings"><i class="fas fa-cog"></i> Configuración</button>
        <button class="tab-btn" data-tab="mockdata"><i class="fas fa-file-code"></i> Datos Mock</button>
      </div>
      
      <div class="tab-content" id="databasesTab">
        <div class="db-list" id="databaseList">
          ${renderDatabaseList(databases, config.defaultDatabase)}
        </div>
      </div>
      
      <div class="tab-content hidden" id="assignmentsTab">
        <div class="assignments-container">
          <h3>Asignar Bases de Datos a Páginas</h3>
          <p class="text-muted">Selecciona qué base de datos usa cada página del portal</p>
          <div class="page-assignments" id="pageAssignments">
            ${renderPageAssignments(config.pageDatabaseMap, databases)}
          </div>
        </div>
      </div>
      
      <div class="tab-content hidden" id="settingsTab">
        <div class="settings-container">
          <h3>Configuración General</h3>
          <div class="form-group">
            <label>Base de datos por defecto</label>
            <select class="form-control" id="defaultDbSelect">
              <option value="">-- Seleccionar --</option>
              ${databases.map(db => `<option value="${db.id}" ${config.defaultDatabase === db.id ? 'selected' : ''}>${db.name} (${db.type})</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      
      <div class="tab-content hidden" id="mockdataTab">
        <div class="mockdata-container">
          <h3>Editar Datos Mock</h3>
          <p class="text-muted">Edita los datos JSON que cada página consume.</p>
          <div class="mock-files" id="mockFiles"></div>
        </div>
      </div>
    </div>
    
    <div class="modal" id="dbModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modalTitle">Nueva Base de Datos</h3>
          <button class="modal-close" id="modalClose">&times;</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary" id="modalSave">Guardar</button>
        </div>
      </div>
    </div>
    
    <div class="modal" id="jsonEditorModal">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3 id="jsonModalTitle">Editar JSON</h3>
          <button class="modal-close" id="jsonModalClose">&times;</button>
        </div>
        <div class="modal-body">
          <div id="jsonEditorContainer"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="jsonModalCancel">Cancelar</button>
          <button class="btn btn-primary" id="jsonModalSave">Guardar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('contentArea').innerHTML = html;
}

function renderDatabaseList(databases, defaultDbId) {
  if (databases.length === 0) {
    return '<p class="text-muted">No hay bases de datos configuradas.</p>';
  }
  
  return databases.map(db => {
    const typeInfo = DB_TYPES[db.type] || { name: db.type, icon: 'fa-database' };
    return `
      <div class="db-card" data-id="${db.id}">
        <div class="db-card-header">
          <div class="db-info">
            <i class="fas ${typeInfo.icon}"></i>
            <div>
              <strong>${db.name}</strong>
              <span class="db-type">${typeInfo.name}</span>
            </div>
          </div>
          <div class="db-actions">
            <button class="btn-icon edit-db" data-id="${db.id}" title="Editar"><i class="fas fa-pen"></i></button>
            <button class="btn-icon delete-db" data-id="${db.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
            ${defaultDbId === db.id ? '<span class="badge badge-success">Por defecto</span>' : ''}
          </div>
        </div>
        <div class="db-card-body">
          <div class="db-details">
            <div><strong>Host:</strong> ${db.host || 'N/A'}</div>
            <div><strong>Puerto:</strong> ${db.port || 'N/A'}</div>
            <div><strong>Base de datos:</strong> ${db.database || 'N/A'}</div>
          </div>
          <div class="db-status">
            <span class="status-indicator"></span>
            <span>Estado: Configurada</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderPageAssignments(pageMap, databases) {
  return AVAILABLE_PAGES.map(page => {
    const dbId = pageMap[page];
    return `
      <div class="page-assignment" data-page="${page}">
        <div class="page-info">
          <i class="fas fa-file-alt"></i>
          <span>${page}</span>
        </div>
        <div class="assignment-select">
          <select class="form-control page-db-select" data-page="${page}">
            <option value="">-- Sin asignar --</option>
            ${databases.map(db => `<option value="${db.id}" ${dbId === db.id ? 'selected' : ''}>${db.name} (${db.type})</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  }).join('');
}

function renderMockFiles() {
  const container = document.getElementById('mockFiles');
  const mockData = JSON.parse(localStorage.getItem('pia_mock_data') || '{}');
  
  const html = AVAILABLE_JSON_FILES.map(f => {
    const hasData = mockData[f.path] !== undefined;
    const preview = hasData ? JSON.stringify(mockData[f.path]).substring(0, 100) + '...' : 'Usa datos originales';
    
    return `
      <div class="mock-file-card" data-path="${f.path}">
        <div class="mock-file-header">
          <div class="mock-file-info">
            <i class="fas fa-file-code"></i>
            <div>
              <strong>${f.name}</strong>
              <span class="mock-file-type">${f.label}</span>
            </div>
          </div>
          <div class="mock-file-actions">
            <button class="btn btn-secondary edit-json-btn" data-path="${f.path}" title="Editar">
              <i class="fas fa-pen"></i> Editar
            </button>
            <button class="btn btn-danger clear-json-btn" data-path="${f.path}" title="Restablecer">
              <i class="fas fa-undo"></i> Restablecer
            </button>
          </div>
        </div>
        <div class="mock-file-preview">
          <pre>${preview}</pre>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
  
  document.querySelectorAll('.edit-json-btn').forEach(btn => {
    btn.addEventListener('click', () => openJsonEditor(btn.dataset.path));
  });
  
  document.querySelectorAll('.clear-json-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Restablecer a datos originales?')) clearMockData(btn.dataset.path);
    });
  });
}

function setupEventListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab + 'Tab';
      document.getElementById(tabId).classList.remove('hidden');
    });
  });
  
  document.getElementById('addNewDb').addEventListener('click', () => openDbModal());
  document.getElementById('exportConfig').addEventListener('click', exportConfig);
  document.getElementById('importConfig').addEventListener('click', importConfig);
  
  document.getElementById('defaultDbSelect').addEventListener('change', (e) => {
    const dbId = e.target.value;
    if (dbId) {
      setDefaultDatabase(dbId);
      showToast('Base de datos por defecto actualizada', 'success');
      renderDatabaseManager();
    }
  });
  
  document.addEventListener('click', (e) => {
    if (e.target.closest('.edit-db')) {
      const dbId = e.target.closest('.edit-db').dataset.id;
      openDbModal(dbId);
    }
    if (e.target.closest('.delete-db')) {
      const dbId = e.target.closest('.delete-db').dataset.id;
      deleteDbHandler(dbId);
    }
    if (e.target.closest('.page-db-select')) {
      const select = e.target;
      const page = select.dataset.page;
      const dbId = select.value;
      if (dbId) {
        assignDatabaseToPage(page, dbId);
        showToast('Asignación actualizada para ' + page, 'success');
      } else {
        removePageAssignment(page);
        showToast('Asignación removida para ' + page, 'success');
      }
    }
  });
  
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalSave').addEventListener('click', saveDbHandler);
  document.getElementById('dbModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  
  document.getElementById('jsonModalClose').addEventListener('click', closeJsonModal);
  document.getElementById('jsonModalCancel').addEventListener('click', closeJsonModal);
  document.getElementById('jsonModalSave').addEventListener('click', saveJsonEditor);
  document.getElementById('jsonEditorModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeJsonModal();
  });
}

function openDbModal(dbId = null) {
  currentDbId = dbId;
  const databases = getAllDatabases();
  const db = dbId ? databases.find(d => d.id === dbId) : null;
  
  const formHtml = `
    <form id="dbForm">
      <div class="form-group">
        <label for="dbName">Nombre *</label>
        <input type="text" class="form-control" id="dbName" value="${db ? db.name : ''}" required />
      </div>
      
      <div class="form-group">
        <label for="dbType">Tipo de Base de Datos *</label>
        <select class="form-control" id="dbType" required>
          ${Object.entries(DB_TYPES).map(([key, info]) => `<option value="${key}" ${db && db.type === key ? 'selected' : ''}>${info.name}</option>`).join('')}
        </select>
      </div>
      
      <div id="dbFieldsContainer">
        ${renderDbFields(db)}
      </div>
      
      <div class="form-group">
        <label for="dbPages">Páginas que usan esta BD</label>
        <select class="form-control" id="dbPages" multiple>
          ${AVAILABLE_PAGES.map(page => `<option value="${page}" ${db && db.pages && db.pages.includes(page) ? 'selected' : ''}>${page}</option>`).join('')}
        </select>
        <small class="text-muted">Mantén Ctrl/Cmd para seleccionar múltiples</small>
      </div>
    </form>
  `;
  
  document.getElementById('modalTitle').textContent = db ? 'Editar Base de Datos' : 'Nueva Base de Datos';
  document.getElementById('modalBody').innerHTML = formHtml;
  document.getElementById('dbModal').style.display = 'flex';
  
  document.getElementById('dbType').addEventListener('change', () => {
    const type = document.getElementById('dbType').value;
    document.getElementById('dbFieldsContainer').innerHTML = renderDbFields({ type });
  });
}

function renderDbFields(db) {
  const type = db ? db.type : 'postgresql';
  const typeInfo = DB_TYPES[type];
  if (!typeInfo) return '';
  
  return typeInfo.fields.map(field => {
    const label = field.charAt(0).toUpperCase() + field.slice(1);
    const value = db ? db[field] : '';
    const inputType = field === 'password' ? 'password' : 'text';
    const fieldId = `db${field.charAt(0).toUpperCase() + field.slice(1)}`;
    
    if (field === 'ssl') {
      return `
        <div class="form-group form-check">
          <input type="checkbox" class="form-check-input" id="${fieldId}" ${value ? 'checked' : ''} />
          <label class="form-check-label" for="${fieldId}">Usar SSL</label>
        </div>
      `;
    }
    
    return `
      <div class="form-group">
        <label for="${fieldId}">${label} ${!['password', 'ssl', 'collectionPrefix'].includes(field) ? '*' : ''}</label>
        <input type="${inputType}" class="form-control" id="${fieldId}" value="${value}" />
      </div>
    `;
  }).join('');
}

function saveDbHandler() {
  const dbData = {
    name: document.getElementById('dbName').value,
    type: document.getElementById('dbType').value,
    pages: Array.from(document.getElementById('dbPages').selectedOptions).map(opt => opt.value)
  };
  
  const typeInfo = DB_TYPES[dbData.type];
  typeInfo.fields.forEach(field => {
    const fieldId = `db${field.charAt(0).toUpperCase() + field.slice(1)}`;
    const element = document.getElementById(fieldId);
    if (element) {
      dbData[field] = element.type === 'checkbox' ? element.checked : element.value;
    }
  });
  
  const errors = validateDbConfig(dbData);
  if (errors.length > 0) {
    showToast(errors.join(', '), 'error');
    return;
  }
  
  try {
    if (currentDbId) {
      updateDatabase(currentDbId, dbData);
      showToast('Base de datos actualizada', 'success');
    } else {
      addDatabase(dbData);
      showToast('Base de datos creada', 'success');
    }
    closeModal();
    renderDatabaseManager();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function deleteDbHandler(dbId) {
  if (!confirm('Eliminar esta base de datos?')) return;
  try {
    deleteDatabase(dbId);
    showToast('Base de datos eliminada', 'success');
    renderDatabaseManager();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function exportConfig() {
  const config = exportDbConfig();
  const blob = new Blob([config], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pia-db-config-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Configuración exportada', 'success');
}

function importConfig() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (importDbConfig(ev.target.result)) {
        showToast('Configuración importada', 'success');
        renderDatabaseManager();
      } else {
        showToast('Error al importar', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function closeModal() {
  document.getElementById('dbModal').style.display = 'none';
  currentDbId = null;
}

// MOCK DATA FUNCTIONS

function openJsonEditor(path) {
  currentJsonPath = path;
  const mockData = JSON.parse(localStorage.getItem('pia_mock_data') || '{}');
  const currentData = mockData[path] || {};
  const f = AVAILABLE_JSON_FILES.find(x => x.path === path);
  
  const html = `
    <div class="json-editor">
      <div class="form-group">
        <label>Archivo: <strong>${f.name}</strong> (${f.label})</label>
        <textarea id="jsonEditorTextarea" class="form-control" rows="15" style="font-family: monospace; white-space: pre;">${JSON.stringify(currentData, null, 2)}</textarea>
      </div>
      <div class="form-group form-check">
        <input type="checkbox" id="jsonUseOriginal" ${!mockData[path] ? 'checked' : ''} />
        <label for="jsonUseOriginal" class="form-check-label">Usar datos originales</label>
        <small class="text-muted">Si está marcado, se cargarán los datos del archivo original.</small>
      </div>
    </div>
  `;
  
  document.getElementById('jsonModalTitle').textContent = 'Editar ' + f.name;
  document.getElementById('jsonEditorContainer').innerHTML = html;
  document.getElementById('jsonEditorModal').style.display = 'flex';
}

function saveJsonEditor() {
  const textarea = document.getElementById('jsonEditorTextarea');
  const useOriginal = document.getElementById('jsonUseOriginal').checked;
  
  const mockData = JSON.parse(localStorage.getItem('pia_mock_data') || '{}');
  
  if (useOriginal) {
    delete mockData[currentJsonPath];
  } else {
    try {
      mockData[currentJsonPath] = JSON.parse(textarea.value);
    } catch (e) {
      showToast('Error: JSON inválido', 'error');
      return;
    }
  }
  
  localStorage.setItem('pia_mock_data', JSON.stringify(mockData));
  
  if (typeof updateMockData === 'function') {
    updateMockData(currentJsonPath, mockData[currentJsonPath]);
  }
  
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_MOCK_DATA',
      payload: { [currentJsonPath]: mockData[currentJsonPath] }
    });
  }
  
  closeJsonModal();
  renderMockFiles();
  showToast('Datos mock actualizados', 'success');
}

function clearMockData(path) {
  const mockData = JSON.parse(localStorage.getItem('pia_mock_data') || '{}');
  delete mockData[path];
  localStorage.setItem('pia_mock_data', JSON.stringify(mockData));
  
  if (typeof updateMockData === 'function') {
    updateMockData(path, undefined);
  }
  
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_MOCK_DATA',
      payload: { [path]: undefined }
    });
  }
  
  renderMockFiles();
  showToast('Datos restablecidos', 'success');
}

function closeJsonModal() {
  document.getElementById('jsonEditorModal').style.display = 'none';
  currentJsonPath = null;
}

function initMockDataTab() {
  const tabBtn = document.querySelector('.tab-btn[data-tab="mockdata"]');
  if (tabBtn) {
    tabBtn.addEventListener('click', () => renderMockFiles());
  }
}

// Toast
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
