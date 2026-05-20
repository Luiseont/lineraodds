#!/usr/bin/env bash

# ============================================
# Funciones compartidas para los contenedores
# ============================================

# Cargar nvm para tener node/npm/pnpm disponible
load_nvm() {
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
  elif [ -s "/home/appuser/.nvm/nvm.sh" ]; then
    source "/home/appuser/.nvm/nvm.sh"
  elif [ -s "/root/.nvm/nvm.sh" ]; then
    source "/root/.nvm/nvm.sh"
  fi
}

# Esperar a que el servicio exporte sus variables a /shared/env.sh
wait_for_shared_env() {
  local timeout=${1:-60}
  local elapsed=0
  
  echo "Esperando variables compartidas del servicio..."
  while [ ! -f /shared/env.sh ]; do
    if [ $elapsed -ge $timeout ]; then
      echo "✗ Error: Timeout esperando variables del servicio"
      exit 1
    fi
    echo "  Esperando /shared/env.sh... ($elapsed/$timeout segundos)"
    sleep 2
    elapsed=$((elapsed + 2))
  done
  
  echo "✓ Cargando variables compartidas..."
  source /shared/env.sh
  echo "  APP_ID: $VITE_APP_ID"
  echo "  MAIN_CHAIN_ID: ${VITE_MAIN_CHAIN_ID:-N/A}"
}

# Inicializar wallet de Linera si no existe
init_linera_wallet() {
  local faucet_url=${1:-https://faucet.testnet-conway.linera.net}
  local config_dir="$HOME/.config/linera"
  local wallet_file="$config_dir/wallet.json"

  echo "Verificando configuración de Linera en: $config_dir"

  if [[ -d "$config_dir" ]] && [[ -n "$(ls -A "$config_dir" 2>/dev/null)" ]]; then
    echo "Wallet de Linera ya existe, reutilizando configuración existente"
    if [[ -f "$wallet_file" ]]; then
      echo "Archivo wallet.json encontrado"
    else
      echo "Advertencia: directorio existe pero falta wallet.json"
    fi
  else
    echo "Directorio vacío o inexistente, inicializando nueva wallet de Linera..."
    mkdir -p "$config_dir"
    linera wallet init --faucet "$faucet_url"
    linera wallet request-chain --faucet "$faucet_url"
    if [[ $? -eq 0 ]]; then
      echo "Wallet de Linera inicializada exitosamente"
    else
      echo "Error al inicializar wallet de Linera"
      exit 1
    fi
  fi
}

# Obtener Chain ID principal
get_chain_id() {
  local chain_id
  chain_id=$(linera wallet show 2>/dev/null | grep "Chain ID:" | grep "DEFAULT" | head -n 1 | awk '{print $3}')
  if [[ -z "$chain_id" ]]; then
    chain_id=$(linera wallet show 2>/dev/null | grep "Chain ID:" | head -n 1 | awk '{print $3}')
  fi
  echo "$chain_id"
}
