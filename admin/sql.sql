-- =============================================
-- BASE DE DATOS: panel_pia
-- =============================================

CREATE DATABASE IF NOT EXISTS panel_pia;
USE panel_pia;

-- =============================================
-- 1. TABLA: canales
-- =============================================
CREATE TABLE canales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    siglas VARCHAR(20) NOT NULL,
    institucion VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    cantidad INT DEFAULT 0,
    email VARCHAR(150),
    telefono VARCHAR(50),
    protocolo ENUM('Sí', 'No') DEFAULT 'No',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_institucion (institucion),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. TABLA: riesgo
-- =============================================
CREATE TABLE riesgo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    siglas VARCHAR(20) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    estado ENUM('Activo', 'En Proceso', 'Inactivo') DEFAULT 'Inactivo',
    nivel ENUM('Alto', 'Medio', 'Bajo') DEFAULT 'Bajo',
    buenas_practicas JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. TABLA: directorio
-- =============================================
CREATE TABLE directorio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    siglas VARCHAR(20) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    direccion TEXT,
    solicitud_url VARCHAR(500),
    info_url VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. TABLA: tableros (Tu Gobierno en Números)
-- =============================================
CREATE TABLE tableros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_institucion VARCHAR(200) NOT NULL,
    siglas VARCHAR(20) NOT NULL,
    tipo_dependencia VARCHAR(50) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    link_tablero VARCHAR(500) NOT NULL,
    descripcion TEXT,
    estado ENUM('Disponible', 'En construcción', 'No disponible') DEFAULT 'Disponible',
    fecha_actualizacion DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_institucion (nombre_institucion),
    INDEX idx_estado (estado),
    INDEX idx_sector (sector)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. TABLA: usuarios
-- =============================================
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    rol ENUM('Administrador', 'Editor', 'Consulta') DEFAULT 'Consulta',
    permisos JSON,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    ultimo_acceso TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. TABLA: portal
-- =============================================
CREATE TABLE portal (
    id INT PRIMARY KEY AUTO_INCREMENT,
    oficinas_probidad INT DEFAULT 0,
    canales_denuncia INT DEFAULT 0,
    denuncias_penales INT DEFAULT 0,
    plataformas_activas INT DEFAULT 0,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar registro inicial del portal
INSERT INTO portal (oficinas_probidad, canales_denuncia, denuncias_penales, plataformas_activas)
VALUES (8, 127, 12, 5);

-- =============================================
-- 7. TABLA: bitacora
-- =============================================
CREATE TABLE bitacora (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario VARCHAR(150) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    detalles TEXT,
    ip VARCHAR(45),
    user_agent TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario),
    INDEX idx_modulo (modulo),
    INDEX idx_accion (accion),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 8. TABLA: configuracion
-- =============================================
CREATE TABLE configuracion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT,
    descripcion VARCHAR(255),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('version', '4.0', 'Versión del sistema'),
('institucion', 'CNC - Alerta 360', 'Nombre de la institución'),
('ultima_actualizacion', '2026-06-30', 'Fecha de última actualización'),
('usuario_admin', 'deteccionydenuncia', 'Usuario administrador por defecto');