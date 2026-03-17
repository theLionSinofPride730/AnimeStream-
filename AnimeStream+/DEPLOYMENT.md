# 🚀 AnimeStream+ Deployment Guide

Complete guide to deploy your anime streaming platform to production.

## 🎯 Deployment Options

Choose one of these hosting platforms based on your needs:

### 1. **Vercel** (Recommended - Easiest) ⭐
### 2. **Docker** (Self-hosted)
### 3. **AWS EC2** (Cloud)
### 4. **Railway** (Managed Platform)
### 5. **Render** (Simple Deployment)

---

## ✨ Option 1: Vercel (Recommended)

### Why Vercel?
- ✅ Built specifically for Next.js
- ✅ Automatic deployments from Git
- ✅ Zero-config setup
- ✅ Free tier available
- ✅ Serverless functions
- ✅ Global CDN

### Setup Steps

**Step 1: Create Vercel Account**
```bash
# Visit https://vercel.com/signup
# Sign up with GitHub/GitLab/Bitbucket
```

**Step 2: Create Git Repository**
```bash
git init
git add .
git commit -m "Initial commit: AnimeStream+ complete"
git branch -M main
git remote add origin https://github.com/yourusername/animestream.git
git push -u origin main
```

**Step 3: Import to Vercel**
```bash
npm i -g vercel
vercel login
vercel
```

**Step 4: Set Environment Variables**
```bash
vercel env add DATABASE_URL
# Paste: postgresql://user:password@host:port/dbname
vercel env add NEXT_PUBLIC_API_URL
# Paste: https://yourdomain.com
```

**Step 5: Deploy**
```bash
vercel --prod
```

### Production Environment Variables
```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
NEXT_PUBLIC_API_URL=https://animestream.example.com
NODE_ENV=production
```

### Database Setup (PostgreSQL)
Use one of these PostgreSQL providers:
- **Vercel Postgres** (integrated)
- **Neon** (https://neon.tech)
- **Railway** (https://railway.app)
- **AWS RDS**

**Example with Vercel Postgres:**
```bash
vercel postgres create animestream-db
# Copy connection string to DATABASE_URL
```

---

## 🐳 Option 2: Docker (Self-Hosted)

### Create Dockerfile
File: `Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
```

### Create Docker Compose
File: `docker-compose.yml`
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/anime
      NEXT_PUBLIC_API_URL: http://localhost:3000
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: anime_user
      POSTGRES_PASSWORD: secure_password_here
      POSTGRES_DB: anime
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
# Build image
docker build -t animestream:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host/db" \
  -e NEXT_PUBLIC_API_URL="https://yourdomain.com" \
  animestream:latest

# Or use Docker Compose
docker-compose up -d
```

### Deploy to Server
```bash
# SSH into your server
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourusername/animestream.git
cd animestream

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

---

## ☁️ Option 3: AWS EC2

### 1. Launch EC2 Instance
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.medium (minimum)
- Storage: 20GB gp3

### 2. SSH and Install
```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

### 3. Setup Environment
```bash
cd /var/www
sudo git clone https://github.com/yourusername/animestream.git
cd animestream
sudo npm install
sudo npm run build
```

### 4. Create .env.production
```bash
sudo nano .env.production
```

Add:
```env
DATABASE_URL=postgresql://anime:password@localhost:5432/anime
NEXT_PUBLIC_API_URL=https://yourdomain.com
NODE_ENV=production
```

### 5. Start with PM2
```bash
sudo pm2 start npm --name "animestream" -- start
sudo pm2 startup
sudo pm2 save
```

### 6. Setup Nginx
File: `/etc/nginx/sites-available/animestream`
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/animestream /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Setup SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🚄 Option 4: Railway

### 1. Create Railway Account
Visit: https://railway.app

### 2. Connect Repository
- Click "New Project"
- Select "Deploy from GitHub"
- Select your repository

### 3. Configure Services
- **Service 1**: Next.js App
  - Build command: `npm run build`
  - Start command: `npm start`

- **Service 2**: PostgreSQL
  - Railway will auto-configure this

### 4. Set Environment Variables
Railway Dashboard → Variables:
```
DATABASE_URL=[auto-generated by PostgreSQL service]
NEXT_PUBLIC_API_URL=https://animestream.up.railway.app
NODE_ENV=production
```

### 5. Deploy
Push to GitHub → Railway automatically deploys

---

## 🎨 Option 5: Render

### 1. Create Account
Visit: https://render.com

### 2. Create New Web Service
- Select "Build and deploy from a Git repository"
- Connect your GitHub repository
- Select your AnimeStream repo

### 3. Configure
- **Name**: animestream
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Starter (free) or higher

### 4. Database
- Create PostgreSQL database in Render
- Copy connection string

### 5. Environment Variables
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://animestream.onrender.com
NODE_ENV=production
```

### 6. Deploy
Click "Create Web Service" → Render automatically deploys

---

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database created and tested
- [ ] Build runs without errors: `npm run build`
- [ ] No TypeScript errors: `npm run build`
- [ ] All .env variables set
- [ ] Git repository created (for auto-deploy options)
- [ ] Domain name obtained (optional)
- [ ] SSL certificate ready (auto with Vercel/Render)

---

## 🔧 Post-Deployment

### Monitor Logs
```bash
# Vercel
vercel logs

# Docker
docker-compose logs -f app

# PM2
pm2 logs animestream
```

### Update Code
```bash
git add .
git commit -m "Update code"
git push origin main
# Automatically redeploys on Vercel/Railway/Render
```

### Database Backups
- Vercel Postgres: Auto-backups
- PostgreSQL: Manual backups
  ```bash
  pg_dump -h host -U user anime > backup.sql
  ```

### Scale Up
- **Vercel**: Upgrade plan
- **AWS EC2**: Change instance type
- **Railway**: Upgrade plan
- **Docker**: Add load balancer

---

## 🚨 Troubleshooting Deployments

### Deployment Fails
```bash
# Check build logs
npm run build

# Check TypeScript
npm run build

# Check environment
echo $DATABASE_URL
```

### Database Connection Error
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Prisma
npx prisma db push
```

### Port Issues
- Vercel: Automatically sets port via environment
- Self-hosted: Use port 3000 or change in start command

### Out of Memory
- Increase server RAM
- Enable compression in next.config.ts

---

## 📊 Performance Optimization for Production

### 1. Image Optimization
```typescript
// next.config.ts
export default {
  images: {
    unoptimized: false, // Enable Next.js Image Optimization
    minimumCacheTTL: 31536000, // 1 year cache
  }
}
```

### 2. Database
```bash
# Create indexes for better performance
npx prisma migrate dev --create-only
# Add your custom SQL indexes
```

### 3. Caching
```typescript
// Cache API responses
export const revalidate = 3600 // 1 hour ISR
```

### 4. Monitoring
```bash
# Add monitoring service
npm install @sentry/nextjs
```

---

## 📈 Scaling Strategies

### Phase 1: Single Server (0-10K users)
- Vercel/Railway free tier
- PostgreSQL free tier
- Sufficient for MVP

### Phase 2: Multiple Servers (10K-100K users)
- Load balancer (Nginx/AWS ALB)
- Read replicas for database
- CDN for static assets

### Phase 3: Global Scale (100K+ users)
- Multiple regions
- Database clustering
- Redis caching layer
- Content delivery network

---

## 🔐 Production Security

### Essential
- [ ] Enable HTTPS/SSL
- [ ] Set strong database password
- [ ] Hide environment variables
- [ ] Enable Prisma query logs (set to error only)
- [ ] Configure CORS properly
- [ ] Rate limit API endpoints

### Recommended
- [ ] Setup monitoring (Sentry)
- [ ] Enable backups
- [ ] Use Web Application Firewall
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Commands
```bash
# Update dependencies safely
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 💡 Tips for Success

1. **Test Locally First**
   ```bash
   npm run build
   npm run start
   # Test at http://localhost:3000
   ```

2. **Use Environment Secrets**
   ```bash
   # Never commit .env files
   echo ".env" >> .gitignore
   ```

3. **Monitor Performance**
   - Vercel: Built-in analytics
   - Self-hosted: Use services like New Relic

4. **Regular Backups**
   - Database backups: Daily
   - Code backups: Git repository

5. **Update Dependencies**
   ```bash
   npm outdated
   npm update
   ```

---

## 📞 Getting Help

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **AWS Docs**: https://docs.aws.amazon.com
- **Docker Docs**: https://docs.docker.com
- **Next.js Docs**: https://nextjs.org/docs

---

**Happy Deploying! 🎉**

Your AnimeStream+ platform is now ready for the world to enjoy!
