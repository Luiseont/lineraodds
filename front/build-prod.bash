#!/usr/bin/env bash

set -eu

# Cargar nvm para tener npm disponible
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Cargar variables compartidas del servicio
echo "Esperando variables compartidas del servicio..."
TIMEOUT=60
ELAPSED=0
while [ ! -f /shared/env.sh ]; do
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "✗ Error: Timeout esperando variables del servicio"
    exit 1
  fi
  echo "  Esperando /shared/env.sh... ($ELAPSED/$TIMEOUT segundos)"
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

echo "✓ Cargando variables compartidas..."
source /shared/env.sh

echo "Variables cargadas del servicio:"
echo "  APP_ID: $VITE_APP_ID"
echo "  MAIN_CHAIN_ID: $VITE_MAIN_CHAIN_ID"

# Exportar variables como variables de entorno para que Vite las use
export VITE_APP_ID
export VITE_MAIN_CHAIN_ID
export VITE_FAUCET_URL="https://faucet.testnet-conway.linera.net"
export VITE_APP_SERVICE="https://api.lineraodds.bet"

# Crear archivo .env para Vite
echo "Creando archivo .env para Vite..."
cat > /front/.env << EOF
VITE_APP_ID=$VITE_APP_ID
VITE_MAIN_CHAIN_ID=$VITE_MAIN_CHAIN_ID
VITE_FAUCET_URL=https://faucet.testnet-conway.linera.net
VITE_APP_SERVICE=https://api.lineraodds.bet
EOF
echo "✓ Archivo .env creado"


# Instalar dependencias
echo "Instalando dependencias de npm..."
npm install

# Build de producción
echo "Construyendo aplicación para producción..."
npm run build

echo "✓ Build completado exitosamente"
echo "Archivos generados en: /front/dist"

# Copiar archivos al volumen compartido
if [ -d "/front/dist" ]; then
  echo "Build completado. Los archivos están en /front/dist"
  echo "Contenido del directorio dist:"
  ls -lah /front/dist
else
  echo "✗ Error: El directorio dist no fue creado"
  exit 1
fi

echo "✓ Proceso de build completado"

# Mantener el contenedor corriendo indefinidamente para que el deploy pueda copiar los archivos
echo "Manteniendo contenedor activo para copia de archivos..."
echo "Contenedor listo para docker cp"

# Loop infinito para mantener el contenedor vivo
while true; do
  sleep 3600  # Dormir 1 hora a la vez
done
