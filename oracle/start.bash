#!/usr/bin/env bash

set -eu

# Cargar nvm para tener npm disponible
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Cargar variables compartidas del contenedor service
echo "Esperando variables compartidas del servicio..."
TIMEOUT=60
ELAPSED=0
while [ ! -f /shared/env.sh ]; do
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "Error: Timeout esperando variables del servicio"
    exit 1
  fi
  echo "Esperando /shared/env.sh... ($ELAPSED/$TIMEOUT segundos)"
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

echo "Cargando variables compartidas..."
source /shared/env.sh

echo "Variables cargadas del servicio:"
echo "  APP_ID: $VITE_APP_ID"

export LINERA_FAUCET=${LINERA_FAUCET:-https://faucet.testnet-conway.linera.net}

# Verificar y generar wallet de Linera si es necesario
LINERA_CONFIG_DIR="$HOME/.config/linera"
WALLET_FILE="$LINERA_CONFIG_DIR/wallet.json"

echo "Verificando configuración de Linera en: $LINERA_CONFIG_DIR"

# Verificar si el directorio existe y contiene archivos
if [[ -d "$LINERA_CONFIG_DIR" ]] && [[ -n "$(ls -A "$LINERA_CONFIG_DIR" 2>/dev/null)" ]]; then
  echo "Wallet de Linera ya existe, reutilizando configuración existente"
  
  # Verificar que el archivo wallet.json existe
  if [[ -f "$WALLET_FILE" ]]; then
    echo "Archivo wallet.json encontrado"
  else
    echo "Advertencia: directorio existe pero falta wallet.json"
  fi
else
  echo "Directorio vacío o inexistente, inicializando nueva wallet de Linera..."
  
  # Crear directorio si no existe
  mkdir -p "$LINERA_CONFIG_DIR"
  
  # Inicializar wallet con el faucet de testnet
  linera wallet init --faucet "$LINERA_FAUCET"
  linera wallet request-chain --faucet "$LINERA_FAUCET"
  
  if [[ $? -eq 0 ]]; then
    echo "Wallet de Linera inicializada exitosamente"
  else
    echo "Error al inicializar wallet de Linera"
    exit 1
  fi
fi
export CHAIN_BALANCE=$(linera query-balance)

# Obtener el Chain ID principal (primera cadena DEFAULT)
export CHAIN_ID=$(linera wallet show 2>/dev/null | grep "Chain ID:" | grep "DEFAULT" | head -n 1 | awk '{print $3}')

# Si no se encontró, intentar obtener cualquier Chain ID
if [[ -z "$CHAIN_ID" ]]; then
  export CHAIN_ID=$(linera wallet show 2>/dev/null | grep "Chain ID:" | head -n 1 | awk '{print $3}')
fi

# Mostrar información de la wallet
echo "Información de la wallet:"
linera wallet show 2>/dev/null || echo "No se pudo mostrar información de la wallet"
echo "Chain ID principal: $CHAIN_ID"
echo "Balance de la wallet: $CHAIN_BALANCE"


#inicia servicio de la wallet 

linera service --port 8090 2>&1 &
PID_MAIN=$!
sleep 2

# run server
export CI=true
pnpm install --no-frozen-lockfile
pnpm exec nodemon --exec ts-node src/index.ts 2>&1 &
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