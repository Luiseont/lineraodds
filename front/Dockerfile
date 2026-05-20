FROM node:20-slim

# Instalar pnpm globalmente
RUN npm install -g pnpm
RUN mkdir -p /shared && chown node:node /shared

USER node
WORKDIR /front

# Copiar package files para cachear pnpm install
COPY --chown=node:node package.json pnpm-lock.yaml ./

# Instalar dependencias (esta capa se cachea mientras no cambien los package files)
RUN pnpm install --frozen-lockfile

# Exponer puerto dev
EXPOSE 5173
