# Stage 1: Build the React frontend PWA
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
# Bypass peer dependency conflicts on React 19
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the production Python environment
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

# Copy static frontend assets built in Stage 1
COPY --from=frontend-builder /frontend/dist ./static

# Expose port (Cloud Run dynamically sets $PORT environment variable)
ENV PORT=8080
EXPOSE 8080

# Execute server using dynamically bound port
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
