FROM python:3.12-slim

# Impedir que o Python crie arquivos .pyc e garantir que os logs vão direto pro console (importante pro Cloud Run)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependências do sistema (necessárias pro psycopg2 do Postgres)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiar o restante do código
COPY . /app/

# Coletar arquivos estáticos (necessário para o Django Admin funcionar)
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# O Cloud Run expõe a aplicação na porta especificada pela variável de ambiente $PORT (geralmente 8080)
EXPOSE 8080

# Iniciar o Daphne para suportar WebSockets do seu chat
CMD ["sh", "-c", "daphne -b 0.0.0.0 -p ${PORT:-8080} onematch.asgi:application"]
