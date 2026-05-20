# ---- Stage 1: Build Linera tools ----
FROM rust:1.86-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config protobuf-compiler clang make curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN cargo install --locked linera-service@0.15.11 linera-storage-service@0.15.11

# ---- Stage 2: Runtime ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo los binarios necesarios de Linera
COPY --from=builder /usr/local/cargo/bin/linera-server /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/linera /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/linera-storage-server /usr/local/bin/

# Instalar Node.js y pnpm globalmente
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Usuario no-root
RUN useradd -m -s /bin/bash appuser
RUN mkdir -p /shared && chown appuser:appuser /shared
RUN mkdir -p /home/appuser/.config/linera && chown appuser:appuser /home/appuser/.config/linera

ENV HOME=/home/appuser
USER appuser

WORKDIR /oracle

HEALTHCHECK CMD ["curl", "-s", "http://localhost:9999"]