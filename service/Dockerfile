FROM rust:1.86-slim

SHELL ["bash", "-c"]

RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    curl

# Instalar Linera tools
RUN cargo install --locked linera-service@0.15.11 linera-storage-service@0.15.11

# Instalar Node.js y pnpm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.40.3/install.sh | bash \
    && . ~/.nvm/nvm.sh \
    && nvm install lts/krypton \
    && npm install -g pnpm

# Agregar target wasm32 para compilación de contratos
RUN rustup target add wasm32-unknown-unknown

WORKDIR /build