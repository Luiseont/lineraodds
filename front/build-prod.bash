#!/usr/bin/env bash

set -eu

# Cargar funciones comunes
source /common/init.bash

# Cargar nvm
load_nvm

# Esperar variables del servicio
wait_for_shared_env

# Validar que APP_ID no esté vacío o null
if [ -z "$VITE_APP_ID" ] || [ "$VITE_APP_ID" = "null" ]; then
    echo "❌ ERROR CRÍTICO: APP_ID recibido está vacío o es null"
    echo "El servicio no generó un APP_ID válido."
    exit 1
fi

echo "✓ APP_ID validado: $VITE_APP_ID"

# Exportar variables
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
echo "Instalando dependencias de pnpm..."
pnpm install

# Build de producción
echo "Construyendo aplicación para producción..."
pnpm build

echo "✓ Build completado exitosamente"
echo "Archivos generados en: /front/dist"

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

while true; do
  sleep 3600
done
