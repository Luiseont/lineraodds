#!/bin/bash
set -eu

echo "🚀 Iniciando Oracle en modo PRODUCCIÓN..."

# Cargar funciones comunes
source /common/init.bash

# Cargar nvm
load_nvm

# Esperar variables del servicio
wait_for_shared_env

export LINERA_FAUCET=${LINERA_FAUCET:-https://faucet.testnet-conway.linera.net}

# Inicializar wallet de Linera
init_linera_wallet "$LINERA_FAUCET"

export CHAIN_BALANCE=$(linera query-balance)

# Obtener Chain ID principal
export CHAIN_ID=$(get_chain_id)

# Mostrar información de la wallet
echo "Información de la wallet:"
linera wallet show 2>/dev/null || echo "No se pudo mostrar información de la wallet"
echo "Chain ID principal: $CHAIN_ID"
echo "Balance de la wallet: $CHAIN_BALANCE"

# Iniciar servicio de la wallet Linera
echo "Iniciando servicio Linera en puerto 8090..."
linera service --port 8090 2>&1 &
PID_MAIN=$!
sleep 2

# Instalar dependencias de Node.js
cd /oracle
export CI=true
echo "Instalando dependencias de Node.js..."
pnpm install --no-frozen-lockfile

# Iniciar aplicación en modo producción (sin nodemon)
echo "🎯 Iniciando aplicación Oracle..."
pnpm exec ts-node src/index.ts 2>&1 &
ORACLE_PID=$!

cleanup() {
  echo "Deteniendo servicios..."
  kill "$PID_MAIN" "$ORACLE_PID" 2>/dev/null || true
  wait "$PID_MAIN" "$ORACLE_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

while true; do
  if ! wait -n "$PID_MAIN" "$ORACLE_PID"; then
    echo "Un servicio terminó con error, mostrando logs..."
    exit 1
  else
    echo "Un servicio terminó normalmente, saliendo..."
    exit 0
  fi
done
