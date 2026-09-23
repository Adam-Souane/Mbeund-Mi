# Étape 1: Build
FROM python:3.12-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements.txt
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copier le projet
COPY . .

# Créer répertoire pour les fichiers statiques
RUN mkdir -p /app/staticfiles

# Collecter les fichiers statiques
RUN python manage.py collectstatic --noinput --settings=mbeund_mi_backend.settings.prod || true

# Exposer le port (Cloud Run utilise le port défini par PORT env var, défaut 8080)
EXPOSE 8080

# Commande de démarrage
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8080", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info", \
     "mbeund_mi_backend.wsgi:application"]
