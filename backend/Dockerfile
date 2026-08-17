# Image de base Python 3.11 légère
FROM python:3.11-slim

# Évite d'écrire des fichiers .pyc et configure le buffer de sortie Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Répertoire de travail dans le conteneur
WORKDIR /app

# Installation des dépendances système requises pour GeoDjango (GDAL, GEOS, PROJ) et PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    binutils \
    libproj-dev \
    gdal-bin \
    libgdal-dev \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copie et installation des exigences Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copie du reste du code du backend
COPY . /app/

# Port exposé pour Daphne/Django
EXPOSE 8000

# Commande par défaut
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "mbeund_mi_backend.asgi:application"]
