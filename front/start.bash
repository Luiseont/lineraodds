#!/usr/bin/env bash

set -eu

# Cargar funciones comunes
source /common/init.bash

# Cargar nvm para tener node/pnpm disponible
load_nvm

# Esperar variables compartidas del servicio
wait_for_shared_env

# Exportar variables como variables de entorno para que Vite las use
export VITE_APP_ID
export VITE_MAIN_CHAIN_ID
export VITE_FAUCET_URL="https://faucet.testnet-conway.linera.net"
export VITE_APP_SERVICE="http://localhost:8081"

# Crear archivo .env para Vite
echo "Creando archivo .env para Vite..."
cat > /front/.env << EOF
VITE_APP_ID=$VITE_APP_ID
VITE_MAIN_CHAIN_ID=$VITE_MAIN_CHAIN_ID
VITE_FAUCET_URL=https://faucet.testnet-conway.linera.net
VITE_APP_SERVICE="http://localhost:8081"
EOF
echo "✓ Archivo .env creado"

# Instalar dependencias y levantar servidor de desarrollo
echo "Instalando dependencias de pnpm..."
pnpm install

echo "Iniciando servidor de desarrollo de Vue..."
pnpm dev &
PID_VITE=$!
sleep 2

echo "Servidor de Vue levantado:"
echo "  PID_VITE=$PID_VITE (puerto 5173)"

cleanup() {
  echo "Deteniendo servidor de Vue..."
  kill "$PID_VITE" 2>/dev/null || true
  wait "$PID_VITE" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Esperando a que el servidor de Vue termine..."
wait "$PID_VITE"