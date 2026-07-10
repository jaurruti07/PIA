#!/bin/bash
# backup.sh - Respaldo diario de la base de datos

FECHA=$(date +%Y%m%d)
BACKUP_DIR="/backups/panel_pia"
DB_NAME="panel_pia"
DB_USER="tu_usuario"
DB_PASS="tu_contraseña"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$FECHA.sql

# Comprimir
gzip $BACKUP_DIR/backup_$FECHA.sql

# Eliminar backups de más de 30 días
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completado: $FECHA"