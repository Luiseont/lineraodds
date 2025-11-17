#!/usr/bin/env bash

set -eu

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

export LINERA_FAUCET_URL=http://localhost:8080
export LINERA_TMP_DIR=$(mktemp -d)
echo "Usando LINERA_TMP_DIR=$LINERA_TMP_DIR"
if [[ ! -d "$LINERA_TMP_DIR" ]]; then
  echo "Error: no se creó LINERA_TMP_DIR" >&2
  exit 1
fi

linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# Build and publish your backend
cd management
cargo build --release --target wasm32-unknown-unknown
export APP_ID=$(linera publish-and-create  target/wasm32-unknown-unknown/release/management_{contract,service}.wasm)
echo "APP_ID: $APP_ID"
export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$LINERA_TMP_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_TMP_DIR/client_1.db"
export LINERA_WALLET_2="$LINERA_TMP_DIR/wallet_2.json"
export LINERA_KEYSTORE_2="$LINERA_TMP_DIR/keystore_2.json"
export LINERA_STORAGE_2="rocksdb:$LINERA_TMP_DIR/client_2.db"

linera -w1 wallet init --faucet "$LINERA_FAUCET_URL"
linera -w2 wallet init --faucet "$LINERA_FAUCET_URL"

export INFO_1=($(linera --with-wallet 1 wallet request-chain --faucet $LINERA_FAUCET_URL))
export INFO_2=($(linera --with-wallet 2 wallet request-chain --faucet $LINERA_FAUCET_URL))
export CHAIN_1="${INFO_1[0]}"
export CHAIN_2="${INFO_2[0]}"
export OWNER_1="${INFO_1[1]}"
export OWNER_2="${INFO_2[1]}"

echo "CHAIN_1: $CHAIN_1"
echo "CHAIN_2: $CHAIN_2"

linera service --port 8081 &
PID_MAIN=$!
linera -w1 service --port 8082 &
PID_W1=$!
linera -w2 service --port 8083 &
PID_W2=$!

echo "Servicios levantados:"
echo "  PID_MAIN=$PID_MAIN (puerto 8081)"
echo "  PID_W1=$PID_W1 (puerto 8082)"
echo "  PID_W2=$PID_W2 (puerto 8083)"


cleanup() {
  kill "$PID_MAIN" "$PID_W1" "$PID_W2" 2>/dev/null || true
  wait "$PID_MAIN" "$PID_W1" "$PID_W2" 2>/dev/null || true
  echo "Limpieza de temporales: $LINERA_TMP_DIR"
  rm -rf "$LINERA_TMP_DIR"
}
trap cleanup INT TERM EXIT


while true; do
  if ! wait -n "$PID_MAIN" "$PID_W1" "$PID_W2"; then
    echo "Un servicio terminó con error, saliendo..."
    exit 1
  else
    echo "Un servicio terminó normalmente, saliendo..."
    exit 0
  fi
done

# Build and run your frontend, if any