# Dokploy Deployment Guide for Nuestra Biblioteca

## Prerequisites
- Dokploy instance running with Traefik
- Git repository pushed to GitHub/GitLab

## Architecture Overview
You will create **2 services** in Dokploy:
1. **MongoDB** - Database service (Dokploy built-in)
2. **App** - Docker Compose service (frontend + backend)

---

## Step 1: Create a New Project
1. Log in to your Dokploy dashboard
2. Click **"Create Project"**
3. Enter project name: `nuestrabiblioteca`

---

## Step 2: Create MongoDB Database Service
1. Inside the project, click **"Add Service"**
2. Select **"Database"** → **"MongoDB"**
3. Configure:
   - **Name**: `nuestrabiblioteca-db`
   - **Database Name**: `nuestrabiblioteca`
4. Click **"Create"**
5. Once created, go to the database service and copy the **Internal Connection String**
   - It will look like: `mongodb://nuestrabiblioteca-db:27017/nuestrabiblioteca`
   - Or with credentials: `mongodb://user:password@nuestrabiblioteca-db:27017/nuestrabiblioteca`

---

## Step 3: Create Docker Compose Service (App)
1. Click **"Add Service"** → **"Docker Compose"**
2. Configure:
   - **Name**: `nuestrabiblioteca-app`
   - **Source**: GitHub/GitLab
   - **Repository**: `luxenherondale/nuestrabiblioteca`
   - **Branch**: `main`
   - **Compose File**: `docker-compose.yml`
3. Click **"Create"**

---

## Step 4: Configure Environment Variables
1. Go to the Docker Compose service (`nuestrabiblioteca-app`)
2. Click **"Environment"** tab
3. Add these variables:
   ```
   DOMAIN=biblioteca.yourdomain.com
   MONGODB_URI=mongodb://nuestrabiblioteca-db:27017/nuestrabiblioteca
   JWT_SECRET=generate_a_strong_random_secret_here
   ```
4. **Important**: 
   - Replace `DOMAIN` with your actual domain
   - Replace `MONGODB_URI` with the connection string from Step 2
   - Generate a strong `JWT_SECRET` (use `openssl rand -base64 32`)
5. Click **"Save"**

---

## Step 5: Deploy
1. Click **"Deploy"**
2. Monitor the build logs
3. Wait for status to show **"Running"**

---

## Step 6: Configure Domain (if not auto-configured)
1. Go to **"Domains"** tab
2. Verify your domain is set up with Traefik
3. SSL should be automatic via Let's Encrypt

---

## Step 7: Verify Deployment
1. Visit `https://biblioteca.yourdomain.com`
2. Test the application:
   - Create an account
   - Add a book
   - Verify data persists after refresh

## Troubleshooting

### Services not starting
- Check logs: Click service → **"Logs"**
- Verify environment variables are set correctly
- Ensure MongoDB is healthy before server starts

### Frontend not connecting to backend
- Check Nginx configuration in `nginx.conf`
- Verify backend is running on port 5000
- Check browser console for API errors

### Database connection errors
- Verify `MONGODB_URI` matches service name: `mongodb://mongodb:27017/nuestrabiblioteca`
- Check MongoDB logs for connection issues
- Ensure health check passes before server starts

### Uploads not persisting
- Verify volume mount: `/app/server/uploads`
- Check volume storage has available space
- Restart service to test persistence

## Auto-Deployment (Optional)
1. Go to **"Settings"** → **"Git"**
2. Enable **"Auto Deploy on Push"**
3. Select branch to watch (e.g., `main`)
4. Now every push to that branch automatically redeploys

## Rollback
1. Go to **"Deployments"** history
2. Click previous deployment
3. Click **"Rollback"** to revert to previous version

## Monitoring
- Check **"Logs"** tab for real-time service logs
- Monitor **"Stats"** for CPU/Memory usage
- Set up alerts in Dokploy settings (if available)

## Production Checklist
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure custom domain with SSL
- [ ] Set up automated backups for MongoDB
- [ ] Configure resource limits (CPU/Memory)
- [ ] Enable auto-restart on failure
- [ ] Set up monitoring/alerts
- [ ] Test database persistence
- [ ] Test file uploads persistence
