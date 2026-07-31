# Use official Python 3.10 slim image as base
FROM python:3.10-slim

# Set environment variables for Python performance & cloud compatibility
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8080

# Set workspace directory
WORKDIR /app

# Install minimal OS packages required by OpenCV and curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code into container
COPY . .

# Expose server port (Cloud Run defaults to 8080, Render to 10000/PORT)
EXPOSE 8080

# Health check to ensure service is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/ || exit 1

# Start the Flask backend using Gunicorn with gunicorn.conf.py configuration
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
