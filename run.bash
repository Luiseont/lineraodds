#!/usr/bin/env bash

set -eu

# Cargar nvm para tener npm disponible
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

#limpia el directorio de configuración de linera.. implica que en cada prueba, se debe levantar todo de nuevo
TARGET_DIR="/root/.config/linera"
if [[ -n "$TARGET_DIR" ]]; then
  TARGET_DIR="${TARGET_DIR%/}"
  if [[ "$TARGET_DIR" == "/" ]]; then
    echo "Abortado: no se puede eliminar /"
    exit 1
  fi
  if [[ -d "$TARGET_DIR" ]]; then
    echo "Evaluando directorio: $TARGET_DIR"
    du -sh "$TARGET_DIR" || true
    echo "Eliminando $TARGET_DIR ..."
    rm -rf -- "$TARGET_DIR"
    echo "Directorio eliminado."
  else
    echo "No existe el directorio: $TARGET_DIR (nada que eliminar)"
  fi
fi

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

linera wallet init --faucet "$VITE_LINERA_FAUCET_URL"
export VITE_MAIN_CHAIN=($(linera wallet request-chain --faucet $VITE_LINERA_FAUCET_URL))
export VITE_MAIN_OWNER="${VITE_MAIN_CHAIN[1]}"
export VITE_MAIN_CHAIN_ID="${VITE_MAIN_CHAIN[0]}"
#users wallets
export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$LINERA_TMP_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_TMP_DIR/client_1.db"
export LINERA_WALLET_2="$LINERA_TMP_DIR/wallet_2.json"
export LINERA_KEYSTORE_2="$LINERA_TMP_DIR/keystore_2.json"
export LINERA_STORAGE_2="rocksdb:$LINERA_TMP_DIR/client_2.db"
export LINERA_WALLET_3="$LINERA_TMP_DIR/wallet_3.json"
export LINERA_KEYSTORE_3="$LINERA_TMP_DIR/keystore_3.json"
export LINERA_STORAGE_3="rocksdb:$LINERA_TMP_DIR/client_3.db"

linera -w1 wallet init --faucet "$VITE_LINERA_FAUCET_URL"
linera -w2 wallet init --faucet "$VITE_LINERA_FAUCET_URL"
linera -w3 wallet init --faucet "$VITE_LINERA_FAUCET_URL"

export INFO_1=($(linera --with-wallet 1 wallet request-chain --faucet $VITE_LINERA_FAUCET_URL))
export INFO_2=($(linera --with-wallet 2 wallet request-chain --faucet $VITE_LINERA_FAUCET_URL))
export INFO_3=($(linera --with-wallet 3 wallet request-chain --faucet $VITE_LINERA_FAUCET_URL))

export CHAIN_1="${INFO_1[0]}"
export CHAIN_2="${INFO_2[0]}"
export CHAIN_3="${INFO_3[0]}"
export OWNER_1="${INFO_1[1]}"
export OWNER_2="${INFO_2[1]}"
export OWNER_3="${INFO_3[1]}"


# Deploy management contract  
cd management
cargo build --release --target wasm32-unknown-unknown
export VITE_APP_ID=$(linera publish-and-create target/wasm32-unknown-unknown/release/management_{contract,service}.wasm)
echo "APP_ID: $VITE_APP_ID"
cd ..

#deploy events
export VITE_EVENTS_ID=$(linera publish-data-blob events.json)
echo "EVENTS_ID: $VITE_EVENTS_ID"

echo "Iniciando servicios..."
echo "Logs de servicios en: $LINERA_TMP_DIR/service_*.log"

linera service --port 8081 > "$LINERA_TMP_DIR/service_main.log" 2>&1 &
PID_MAIN=$!
sleep 2

linera --with-wallet 1 service --port 8082 > "$LINERA_TMP_DIR/service_w1.log" 2>&1 &
PID_W1=$!
sleep 2

linera --with-wallet 2 service --port 8083 > "$LINERA_TMP_DIR/service_w2.log" 2>&1 &
PID_W2=$!
sleep 2

linera --with-wallet 3 service --port 8084 > "$LINERA_TMP_DIR/service_w3.log" 2>&1 &
PID_W3=$!
sleep 2

echo "Servicios levantados:"
echo "  PID_MAIN=$PID_MAIN (puerto 8081)"
echo "  PID_W1=$PID_W1 (puerto 8082)"
echo "  PID_W2=$PID_W2 (puerto 8083)"
echo "  PID_W3=$PID_W3 (puerto 8084)" 

echo "MAIN_CHAIN_ID: $VITE_MAIN_CHAIN_ID"
echo "CHAIN_1: $CHAIN_1"
echo "CHAIN_2: $CHAIN_2"
echo "CHAIN_3: $CHAIN_3"
echo "APP_ID: $VITE_APP_ID"
echo "events blob: $VITE_EVENTS_ID"

# Instalar dependencias y levantar servidor de desarrollo de Vue
echo "Instalando dependencias de npm..."
npm install

echo "Iniciando servidor de desarrollo de Vue..."
npm run dev > "$LINERA_TMP_DIR/vite.log" 2>&1 &
PID_VITE=$!
sleep 2

echo "Servidor de Vue levantado:"
echo "  PID_VITE=$PID_VITE (puerto 5173)"

cleanup() {
  echo "Deteniendo servicios..."
  kill "$PID_MAIN" "$PID_W1" "$PID_W2" "$PID_W3" "$PID_VITE" 2>/dev/null || true
  wait "$PID_MAIN" "$PID_W1" "$PID_W2" "$PID_W3" "$PID_VITE" 2>/dev/null || true
  echo "Limpieza de temporales: $LINERA_TMP_DIR"
  rm -rf "$LINERA_TMP_DIR"
}
trap cleanup INT TERM EXIT


while true; do
  if ! wait -n "$PID_MAIN" "$PID_W1" "$PID_W2" "$PID_W3" "$PID_VITE"; then
    echo "Un servicio terminó con error, mostrando logs..."
    echo "=== Log servicio principal ==="
    tail -n 20 "$LINERA_TMP_DIR/service_main.log" 2>/dev/null || echo "No hay log"
    echo "=== Log wallet 1 ==="
    tail -n 20 "$LINERA_TMP_DIR/service_w1.log" 2>/dev/null || echo "No hay log"
    echo "=== Log wallet 2 ==="
    tail -n 20 "$LINERA_TMP_DIR/service_w2.log" 2>/dev/null || echo "No hay log"
    echo "=== Log wallet 3 ==="
    tail -n 20 "$LINERA_TMP_DIR/service_w3.log" 2>/dev/null || echo "No hay log"
    echo "=== Log Vite ==="
    tail -n 20 "$LINERA_TMP_DIR/vite.log" 2>/dev/null || echo "No hay log"
    exit 1
  else
    echo "Un servicio terminó normalmente, saliendo..."
    exit 0
  fi
done