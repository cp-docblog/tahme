# Docker Deployment Guide for Tashweesh

This guide provides detailed instructions for deploying the Tashweesh application using Docker.

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)
- Environment variables configured

## Quick Start

### Using Docker Compose (Recommended)

1. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

2. **Build and run**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   
   Open your browser to `http://localhost:3000`

## Detailed Instructions

### Building the Docker Image

The Dockerfile uses a multi-stage build process:

1. **Stage 1 (Builder)**: Builds the React application
2. **Stage 2 (Production)**: Serves the built files with nginx

#### Build with environment variables:

```bash
docker build \
  --build-arg REACT_APP_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg REACT_APP_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg REACT_APP_BACKEND_WEBHOOK=https://aibackend.cyiper.com/webhook \
  -t tashweesh:latest .
```

### Running the Container

#### Basic run:
```bash
docker run -d -p 3000:80 --name tashweesh tashweesh:latest
```

#### With custom port:
```bash
docker run -d -p 8080:80 --name tashweesh tashweesh:latest
```

### Docker Compose Configuration

The `docker-compose.yml` file includes:
- Automatic environment variable injection from `.env`
- Port mapping (3000:80)
- Health checks
- Restart policy

#### Common Docker Compose commands:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check service status
docker-compose ps

# Restart a service
docker-compose restart
```

## Configuration Files

### Dockerfile
- Multi-stage build for optimized image size
- Node.js 18 Alpine for building
- Nginx Alpine for serving
- Health check endpoint at `/health`

### nginx.conf
- React Router support (SPA routing)
- Gzip compression enabled
- Security headers configured
- Static asset caching (1 year)
- Health check endpoint

### .dockerignore
Excludes unnecessary files from the build context:
- `node_modules`
- `.git`
- `.env` files
- Build artifacts
- IDE configurations

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `REACT_APP_BACKEND_WEBHOOK` | Backend webhook URL | `https://aibackend.cyiper.com/webhook` |

## Health Checks

The application includes health checks at two levels:

1. **Docker health check**: Runs every 30 seconds
2. **Nginx health endpoint**: Available at `/health`

Check health status:
```bash
docker inspect --format='{{.State.Health.Status}}' tashweesh
```

## Production Deployment

### Best Practices

1. **Use specific tags**: Instead of `latest`, use version tags
   ```bash
   docker build -t tashweesh:1.0.0 .
   ```

2. **Set resource limits**:
   ```yaml
   services:
     tashweesh:
       deploy:
         resources:
           limits:
             cpus: '0.5'
             memory: 512M
   ```

3. **Use secrets for sensitive data**: Don't commit `.env` to version control

4. **Enable HTTPS**: Use a reverse proxy like Traefik or nginx

### Example Production docker-compose.yml

```yaml
version: '3.8'

services:
  tashweesh:
    image: tashweesh:1.0.0
    restart: always
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs tashweesh

# Check if port is already in use
lsof -i :3000
```

### Build fails
```bash
# Clear Docker cache and rebuild
docker-compose build --no-cache
```

### Health check failing
```bash
# Test health endpoint manually
curl http://localhost:3000/health
```

### Permission issues
```bash
# Ensure Docker has proper permissions
sudo usermod -aG docker $USER
```

## Monitoring

### View container stats
```bash
docker stats tashweesh
```

### View logs
```bash
# Follow logs
docker logs -f tashweesh

# Last 100 lines
docker logs --tail 100 tashweesh

# With timestamps
docker logs -t tashweesh
```

## Cleanup

### Remove containers and images
```bash
# Stop and remove container
docker-compose down

# Remove images as well
docker-compose down --rmi all

# Remove volumes (if any)
docker-compose down -v
```

### Clean up Docker system
```bash
# Remove unused containers, networks, images
docker system prune -a
```

## CI/CD Integration

### Example GitHub Actions workflow

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build \
            --build-arg REACT_APP_SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
            --build-arg REACT_APP_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }} \
            --build-arg REACT_APP_BACKEND_WEBHOOK=${{ secrets.BACKEND_WEBHOOK }} \
            -t tashweesh:${{ github.sha }} .
```

## Support

For issues or questions, please refer to the main [README.md](README.md) or contact the development team.
