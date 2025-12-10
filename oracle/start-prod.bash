#!/bin/bash
set -e

echo "🚀 Iniciando Oracle en modo PRODUCCIÓN..."

# Cargar nvm para tener pnpm y node disponibles
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Cargar variables del servicio
if [ -f /shared/env.sh ]; then
    echo "Cargando variables del servicio..."
    source /shared/env.sh
else
    echo "⚠️  Esperando variables del servicio..."
    while [ ! -f /shared/env.sh ]; do
        sleep 2
    done
    source /shared/env.sh
fi

echo "✓ Variables cargadas:"
echo "  APPID: $APPID"
echo "  CHAIN_ID: $CHAIN_ID"

cd /oracle

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    pnpm install
fi

# Iniciar aplicación en modo producción (sin nodemon)
echo "🎯 Iniciando aplicación..."
exec pnpm exec ts-node src/index.ts
