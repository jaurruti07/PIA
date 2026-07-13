// utils.js - Utilidades comunes

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });
}

function getApiBase() {
    // En desarrollo usa localhost; en producción ajusta según entorno
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    // Si el backend está en el mismo dominio pero en un puerto diferente
    return '/api';
}

function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Si se usa en el admin, añadir estilos de toast al CSS
// (se pueden añadir dinámicamente)
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--navy);
        color: #fff;
        padding: 10px 24px;
        border-radius: 50px;
        font-weight: 600;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideUp 0.3s ease;
    }
    .toast-success { background: var(--green); }
    .toast-error { background: var(--red); }
    .toast-info { background: var(--blue-bright); }
    @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(toastStyles);