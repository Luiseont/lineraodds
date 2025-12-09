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
export VITE_APP_SERVICE="http://localhost:8081"
# Crear archivo .env para Vite (por si acaso)
echo "Creando archivo .env para Vite..."
cat > /front/.env << EOF
VITE_APP_ID=$VITE_APP_ID
VITE_MAIN_CHAIN_ID=$VITE_MAIN_CHAIN_ID
VITE_FAUCET_URL=https://faucet.testnet-conway.linera.net
VITE_APP_SERVICE="http://localhost:8081"
EOF
echo "✓ Archivo .env creado"

# Instalar dependencias y levantar servidor de desarrollo de Vue
echo "Instalando dependencias de npm..."
npm install

echo "Iniciando servidor de desarrollo de Vue..."
export FRONT_TMP_DIR=$(mktemp -d)
npm run dev > "$FRONT_TMP_DIR/vite.log" 2>&1 &
PID_VITE=$!
sleep 2

echo "Servidor de Vue levantado:"
echo "  PID_VITE=$PID_VITE (puerto 5173)"

cleanup() {
  echo "Deteniendo servidor de Vue..."
  kill "$PID_VITE" 2>/dev/null || true
  wait "$PID_VITE" 2>/dev/null || true
  echo "Limpieza de temporales: $FRONT_TMP_DIR"
  rm -rf "$FRONT_TMP_DIR"
}
trap cleanup INT TERM EXIT

echo "Esperando a que el servidor de Vue termine..."
wait "$PID_VITE"