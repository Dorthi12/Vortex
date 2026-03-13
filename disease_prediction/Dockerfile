FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libgeos-dev \
    libproj-dev \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create directories
RUN mkdir -p models/saved data/raw data/processed

# Pre-train model at build time
RUN python -c "
import sys; sys.path.insert(0, '.')
from services.symptom_classifier import symptom_classifier
metrics = symptom_classifier.train()
symptom_classifier.save()
print('Model trained. Accuracy:', metrics['ensemble_accuracy'])
"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
