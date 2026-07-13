# Production Python environment for backend hosting
FROM python:3.11-slim
WORKDIR /app

# Install build dependencies for cryptography/bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI codebase
COPY backend/app ./app

# Expose port (Render sets $PORT environment variable automatically)
ENV PORT=8080
EXPOSE 8080

# Execute server using dynamically bound port
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
