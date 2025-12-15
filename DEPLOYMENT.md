# Deployment Guide

This guide covers deploying the Timetable Management System to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup Strategy](#backup-strategy)

## Prerequisites

### Server Requirements

**Minimum:**
- 2 CPU cores
- 2 GB RAM
- 20 GB storage
- Ubuntu 20.04+ or similar Linux distribution

**Recommended:**
- 4 CPU cores
- 4 GB RAM
- 50 GB storage
- Ubuntu 22.04 LTS

### Software Requirements

- Node.js 16+ with npm
- MongoDB 5.0+
- Nginx (for reverse proxy)
- PM2 (for process management)
- Certbot (for SSL certificates)

## Backend Deployment

### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone and Setup

```bash
# Create application directory
sudo mkdir -p /var/www/timetable-app
sudo chown -R $USER:$USER /var/www/timetable-app

# Clone repository
cd /var/www/timetable-app
git clone https://github.com/yourusername/timetable-management-system.git .

# Install backend dependencies
cd backend
npm install --production
```

### 3. Environment Configuration

```bash
# Create production environment file
nano .env
```

Add the following:
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://username:password@localhost:27017/timetable_production?authSource=admin

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_very_long_and_secure_random_secret_key_here

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/var/www/timetable-app/uploads

# CORS (your frontend domain)
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### 4. PM2 Process Management

Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'timetable-backend',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

Start the application:
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command

# Monitor
pm2 monit

# View logs
pm2 logs timetable-backend
```

### 5. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/timetable-backend
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # File upload size
    client_max_body_size 6M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/timetable-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Frontend Deployment

### Flutter Web Deployment

#### 1. Build Flutter Web

```bash
cd flutter_app

# Build for production
flutter build web --release --web-renderer html

# Output will be in build/web/
```

#### 2. Nginx Configuration for Frontend

```bash
sudo nano /etc/nginx/sites-available/timetable-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/timetable-app/flutter_app/build/web;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/timetable-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 3. Deploy Build Files

```bash
# Copy build files
sudo mkdir -p /var/www/timetable-app/frontend
sudo cp -r build/web/* /var/www/timetable-app/frontend/
sudo chown -R www-data:www-data /var/www/timetable-app/frontend
```

### Flutter Mobile App

For Android/iOS deployment, follow standard app store guidelines:

**Android (Google Play):**
```bash
flutter build appbundle --release
# Upload to Google Play Console
```

**iOS (App Store):**
```bash
flutter build ios --release
# Use Xcode to upload to App Store Connect
```

## Database Setup

### MongoDB Production Configuration

#### 1. Install MongoDB

```bash
# Import MongoDB public key
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Install
sudo apt update
sudo apt install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 2. Secure MongoDB

```bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "your_secure_password_here",
  roles: ["root"]
})

# Create application user
db.createUser({
  user: "timetable_user",
  pwd: "another_secure_password",
  roles: [{ role: "readWrite", db: "timetable_production" }]
})

# Exit
exit
```

Enable authentication:
```bash
sudo nano /etc/mongod.conf
```

Add:
```yaml
security:
  authorization: enabled

net:
  bindIp: 127.0.0.1
  port: 27017
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

#### 3. Initialize Database

```bash
cd /var/www/timetable-app/backend

# Run seed data (if needed)
node sample_data.js
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Obtain SSL certificate for backend API
sudo certbot --nginx -d api.yourdomain.com

# Obtain SSL certificate for frontend
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

## Monitoring and Logging

### 1. Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/timetable-app
```

```
/var/www/timetable-app/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload timetable-backend
    endscript
}
```

### 2. PM2 Monitoring

```bash
# Install PM2 monitoring (optional)
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 3. System Monitoring

Consider using monitoring tools:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Performance monitoring**: New Relic, DataDog
- **Log aggregation**: ELK Stack, Graylog

## Backup Strategy

### 1. Database Backup

Create backup script:
```bash
sudo nano /usr/local/bin/backup-mongodb.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="timetable_production"

mkdir -p $BACKUP_DIR

mongodump --username admin --password your_password \
  --authenticationDatabase admin \
  --db $DB_NAME \
  --out $BACKUP_DIR/$DATE

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

# Compress
tar -czf $BACKUP_DIR/$DATE.tar.gz $BACKUP_DIR/$DATE
rm -rf $BACKUP_DIR/$DATE
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-mongodb.sh
```

Schedule with cron:
```bash
sudo crontab -e

# Add this line (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

### 2. Application Backup

```bash
# Backup application code
tar -czf /var/backups/timetable-app-$(date +%Y%m%d).tar.gz /var/www/timetable-app

# Backup to remote server (optional)
rsync -avz /var/backups/ user@backup-server:/backups/timetable-app/
```

## Performance Optimization

### 1. Database Indexing

```javascript
// Run in MongoDB shell
use timetable_production

// Create indexes
db.timetables.createIndex({ section: 1, day: 1 })
db.timetables.createIndex({ room: 1, day: 1, startTime: 1 })
db.timetables.createIndex({ faculty: 1 })
db.sections.createIndex({ name: 1 })
db.rooms.createIndex({ number: 1 })
```

### 2. Node.js Optimization

- Use clustering (configured in PM2)
- Enable gzip compression (configured in Nginx)
- Optimize database queries
- Implement caching (Redis recommended)

## Troubleshooting

### Check Service Status

```bash
# PM2
pm2 status
pm2 logs

# Nginx
sudo systemctl status nginx
sudo nginx -t

# MongoDB
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ping')"
```

### Common Issues

**Backend not accessible:**
```bash
# Check if running
pm2 status

# Check logs
pm2 logs timetable-backend --lines 100

# Restart
pm2 restart timetable-backend
```

**Database connection error:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection
mongosh "mongodb://username:password@localhost:27017/timetable_production?authSource=admin"
```

## Post-Deployment Checklist

- [ ] Backend API is accessible via HTTPS
- [ ] Frontend is accessible via HTTPS
- [ ] Database backups are running
- [ ] SSL certificates are configured and auto-renewing
- [ ] PM2 is managing the backend process
- [ ] Logs are being rotated
- [ ] Monitoring is configured
- [ ] Environment variables are secure
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Security headers are set
- [ ] Test all features work in production

## Support

For deployment issues, contact:
- **Email**: [support@example.com]
- **Documentation**: Check all README files in the repository

---

**Last Updated**: December 14, 2025
