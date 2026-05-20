#!/usr/bin/env bash
set -euo pipefail

# Script de despliegue en VPS
# Ejecutado en el VPS por GitHub Actions

echo "🚀 Iniciando proceso de despliegue en el VPS..."

# Variables de entorno requeridas: GITHUB_TOKEN, GITHUB_ACTOR, API_KEY
if [[ -z "${GITHUB_TOKEN:-}" || -z "${GITHUB_ACTOR:-}" || -z "${API_KEY:-}" ]]; then
  echo "✗ ERROR: Faltan variables de entorno requeridas (GITHUB_TOKEN, GITHUB_ACTOR, API_KEY)"
  exit 1
fi

# 1. Crear archivo .env con API_KEY
echo "Configurando variables de entorno (.env)..."
cat > .env << EOF
API_KEY=${API_KEY}
EOF
echo "✓ Environment configurado"

# 2. Login en GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
echo "${GITHUB_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin

# 3. Descargar las últimas imágenes
echo "Descargando las últimas imágenes desde GHCR..."
docker compose -f compose.yaml -f compose.prod.yaml pull

# 4. Limpiar artefactos del frontend anteriores
echo "Limpiando artefactos previos del frontend..."
rm -rf front/dist
rm -rf front/node_modules/.vite

echo "Limpiando directorio web de Nginx..."
sudo rm -rf /var/www/html/*

echo "Limpiando caché de Nginx..."
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true

# 5. Desplegar los servicios
echo "Desplegando servicios con docker compose..."
docker compose -f compose.yaml -f compose.prod.yaml down || true

# Remover volumen antiguo si existe
docker volume rm main_frontend-dist 2>/dev/null || true

# Levantar con recreación forzada
docker compose -f compose.yaml -f compose.prod.yaml up -d --force-recreate

# 6. Esperar inicialización
echo "Esperando a que los servicios inicialicen (10s)..."
sleep 10

# Verificar status del front
echo "Verificando contenedor frontend..."
docker compose -f compose.yaml -f compose.prod.yaml ps front

# Esperar a que el build de producción del front termine de compilar
echo "Esperando a que se complete el build de producción del frontend..."
RETRIES=0
MAX_RETRIES=12
FRONT_CONTAINER=$(docker compose -f compose.yaml -f compose.prod.yaml ps -q front)

while [ $RETRIES -lt $MAX_RETRIES ]; do
  if [ -z "$FRONT_CONTAINER" ]; then
    echo "⚠ Contenedor del frontend no encontrado, reintentando..."
    sleep 5
    FRONT_CONTAINER=$(docker compose -f compose.yaml -f compose.prod.yaml ps -q front)
    RETRIES=$((RETRIES + 1))
    continue
  fi
  
  # Verificar si existe /front/dist y tiene archivos
  if docker exec "$FRONT_CONTAINER" test -d /front/dist 2>/dev/null; then
    FILE_COUNT=$(docker exec "$FRONT_CONTAINER" find /front/dist -type f | wc -l)
    if [ "$FILE_COUNT" -gt 0 ]; then
      echo "✓ Directorio build encontrado con $FILE_COUNT archivos!"
      docker exec "$FRONT_CONTAINER" ls -lah /front/dist
      break
    else
      echo "⚠ El directorio build existe pero está vacío..."
    fi
  fi
  
  echo "Esperando build... (intento $((RETRIES + 1))/$MAX_RETRIES)"
  sleep 10
  RETRIES=$((RETRIES + 1))
done

# 7. Copiar archivos estáticos del front compilado a Nginx en VPS
if [ -n "$FRONT_CONTAINER" ]; then
  echo "Preparando para copiar archivos del frontend..."
  
  sudo mkdir -p /var/www/html
  sudo chmod 755 /var/www/html
  
  echo "Archivos para copiar del contenedor:"
  docker exec "$FRONT_CONTAINER" find /front/dist -type f | head -20
  
  echo "Copiando archivos del contenedor a /var/www/html..."
  if docker cp "$FRONT_CONTAINER":/front/dist/. /var/www/html/; then
    echo "✓ Archivos copiados exitosamente"
    
    # Ajustar permisos
    sudo chown -R www-data:www-data /var/www/html
    sudo find /var/www/html -type d -exec chmod 755 {} \;
    sudo find /var/www/html -type f -exec chmod 644 {} \;
    
    # Verificar copiado
    echo "Verificando despliegue de frontend..."
    ls -lah /var/www/html/ | head -20
    
    FILE_COUNT=$(find /var/www/html -type f | wc -l)
    echo "Total de archivos copiados: $FILE_COUNT"
    
    if [ -f "/var/www/html/index.html" ]; then
      echo "✓ Frontend desplegado exitosamente"
      echo "Tamaño de index.html: $(stat -c%s /var/www/html/index.html) bytes"
    else
      echo "✗ ERROR: ¡No se encontró index.html después de la copia!"
      echo "Logs del contenedor front:"
      docker logs front --tail 50
      exit 1
    fi
  else
    echo "✗ ERROR: Falló la copia de archivos"
    echo "Información de depuración:"
    echo "Contenedor ID: $FRONT_CONTAINER"
    echo "Estado de contenedor:"
    docker inspect "$FRONT_CONTAINER" --format='{{.State.Status}}'
    echo "Logs del contenedor front:"
    docker logs front --tail 100
    exit 1
  fi
else
  echo "✗ ERROR: Contenedor frontend no encontrado tras reintentos"
  docker compose -f compose.yaml -f compose.prod.yaml ps
  docker compose -f compose.yaml -f compose.prod.yaml logs front
  exit 1
fi

# 8. Reiniciar Nginx
echo "Reiniciando Nginx..."
sudo systemctl restart nginx || true
sleep 2
sudo systemctl status nginx --no-pager || true
echo "✓ Nginx reiniciado"

# 9. Verificar estado final
echo ""
echo "=== Estado de Despliegue ==="
docker compose -f compose.yaml -f compose.prod.yaml ps
echo "============================"

sleep 5
curl -f http://127.0.0.1:8081 > /dev/null 2>&1 && echo "✓ Service API OK" || echo "⚠ API de servicio no responde"
curl -f http://127.0.0.1:9999/health > /dev/null 2>&1 && echo "✓ Oracle API OK" || echo "⚠ API de oráculo no responde"

echo ""
echo "✅ ¡Despliegue completado!"
