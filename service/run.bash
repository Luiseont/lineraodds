#!/usr/bin/env bash

set -eu

# Si necesitas resetear la wallet, elimina manualmente: rm -rf /root/.config/linera

eval "$(linera net helper)"
linera_spawn linera net up --with-faucet --faucet-port 8080 &
sleep 5

export VITE_LINERA_FAUCET_URL=http://localhost:8080
export LINERA_TMP_DIR=$(mktemp -d)
echo "Usando LINERA_TMP_DIR=$LINERA_TMP_DIR"
if [[ ! -d "$LINERA_TMP_DIR" ]]; then
  echo "Error: no se creó LINERA_TMP_DIR" >&2
  exit 1
fi

# Build and publish your backend

# Verificar y generar wallet de Linera si es necesario
LINERA_CONFIG_DIR="$HOME/.config/linera"
WALLET_FILE="$LINERA_CONFIG_DIR/wallet.json"

echo "Verificando configuración de Linera en: $LINERA_CONFIG_DIR"

# Verificar si el directorio existe y contiene archivos
if [[ -d "$LINERA_CONFIG_DIR" ]] && [[ -n "$(ls -A "$LINERA_CONFIG_DIR" 2>/dev/null)" ]]; then
  echo "✓ Wallet de Linera ya existe, reutilizando configuración existente"
  
  # Verificar que el archivo wallet.json existe
  if [[ -f "$WALLET_FILE" ]]; then
    echo "✓ Archivo wallet.json encontrado"
  else
    echo "⚠ Advertencia: directorio existe pero falta wallet.json"
  fi
else
  echo "⚙ Directorio vacío o inexistente, inicializando nueva wallet de Linera..."
  
  # Crear directorio si no existe
  mkdir -p "$LINERA_CONFIG_DIR"
  
  # Inicializar wallet con el faucet
  linera wallet init --faucet "$VITE_LINERA_FAUCET_URL"
  linera wallet request-chain --faucet "$VITE_LINERA_FAUCET_URL"
  
  if [[ $? -eq 0 ]]; then
    echo "✓ Wallet de Linera inicializada exitosamente"
  else
    echo "✗ Error al inicializar wallet de Linera"
    exit 1
  fi
fi

# Obtener el Chain ID principal (primera cadena DEFAULT)
export VITE_MAIN_CHAIN_ID=$(linera wallet show 2>/dev/null | grep "Chain ID:" | grep "DEFAULT" | head -n 1 | awk '{print $3}')

# Si no se encontró, intentar obtener cualquier Chain ID
if [[ -z "$VITE_MAIN_CHAIN_ID" ]]; then
  export VITE_MAIN_CHAIN_ID=$(linera wallet show 2>/dev/null | grep "Chain ID:" | head -n 1 | awk '{print $3}')
fi

# Obtener el Owner principal
export VITE_MAIN_OWNER=$(linera wallet show 2>/dev/null | grep "Owner:" | head -n 1 | awk '{print $2}')

# Mostrar información de la wallet
echo "Información de la wallet del servicio:"
linera wallet show 2>/dev/null || echo "No se pudo mostrar información de la wallet"
echo "Chain ID principal: $VITE_MAIN_CHAIN_ID"
echo "Owner principal: $VITE_MAIN_OWNER"

# Deploy management contract  
cd contracts/management
cargo build --release --target wasm32-unknown-unknown
export VITE_APP_ID=$(linera publish-and-create target/wasm32-unknown-unknown/release/management_{contract,service}.wasm)
echo "APP_ID: $VITE_APP_ID"

echo "Iniciando servicios..."
echo "Logs de servicios en: $LINERA_TMP_DIR/service_*.log"

linera service --port 8081 > "$LINERA_TMP_DIR/service_main.log" 2>&1 &
PID_MAIN=$!
sleep 2

export VITE_APP_SERVICE="http://localhost:8081"

echo "Servicios levantados:"
echo "PID_MAIN=$PID_MAIN (puerto 8081)"
echo "MAIN_CHAIN_ID: $VITE_MAIN_CHAIN_ID"
echo "APP_ID: $VITE_APP_ID"
echo "APP_SERVICE: $VITE_APP_SERVICE"

# Exportar variables al volumen compartido para que otros contenedores las usen
echo "Exportando variables al volumen compartido..."
mkdir -p /shared
cat > /shared/env.sh << EOF
export VITE_APP_ID="$VITE_APP_ID"
export VITE_MAIN_CHAIN_ID="$VITE_MAIN_CHAIN_ID"
export VITE_APP_SERVICE="http://localhost:8081"
EOF
echo "✓ Variables exportadas a /shared/env.sh"

cleanup() {
  echo "Deteniendo servicios..."
  kill "$PID_MAIN" 2>/dev/null || true
  wait "$PID_MAIN" 2>/dev/null || true
  echo "Limpieza de temporales: $LINERA_TMP_DIR"
  rm -rf "$LINERA_TMP_DIR"
}
trap cleanup INT TERM EXIT


while true; do
  if ! wait -n "$PID_MAIN"; then
    echo "Un servicio terminó con error, mostrando logs..."
    exit 1
  else
    echo "Un servicio terminó normalmente, saliendo..."
    exit 0
  fi
done