FROM node:22-slim

WORKDIR /app

# Copia os arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json ./

# Instala todas as dependências (incluindo Tailwind CLI para gerar o CSS)
RUN npm ci

# Copia o código da aplicação (backend, frontend e documentação Wiki)
COPY backend ./backend
COPY frontend ./frontend
COPY docs ./docs

# Compila o CSS do Tailwind e remove dependências apenas de desenvolvimento
RUN npm run build:css && npm prune --omit=dev

# Garante que a pasta de uploads exista
RUN mkdir -p /app/frontend/uploads

EXPOSE 3000

CMD ["npm", "start"]
