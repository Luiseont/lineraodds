# ---- Stage 1: Build Linera tools ----
FROM rust:1.86-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config protobuf-compiler clang make curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN cargo install --locked linera-service@0.15.11 linera-storage-service@0.15.11

RUN rustup target add wasm32-unknown-unknown

# ---- Stage 2: Runtime ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates libssl3 protobuf-compiler clang make pkg-config git \
    && rm -rf /var/lib/apt/lists/*

# Copiar binarios de Linera desde el builder
COPY --from=builder /usr/local/cargo/bin/linera-server /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/linera /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/linera-storage-server /usr/local/bin/

# Copiar toolchain de Rust (necesario para compilar contratos wasm en runtime)
COPY --from=builder /usr/local/rustup /usr/local/rustup
COPY --from=builder /usr/local/cargo /usr/local/cargo
ENV PATH="/usr/local/cargo/bin:${PATH}"
ENV RUSTUP_HOME="/usr/local/rustup"
ENV CARGO_HOME="/usr/local/cargo"

# Instalar Node.js y pnpm globalmente
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Usuario no-root
RUN useradd -m -s /bin/bash appuser

# Cambiar owner de toolchain de rust para que appuser pueda compilar
RUN chown -R appuser:appuser /usr/local/cargo /usr/local/rustup

ENV HOME=/home/appuser
RUN mkdir -p /shared && chown appuser:appuser /shared
USER appuser

WORKDIR /build