#!/bin/bash
# ============================================
# Galmudug Times - Hetzner Server Setup Script
# Run this on your fresh Hetzner Ubuntu server
# ============================================

set -e

echo "🔧 Updating system..."
apt update && apt upgrade -y

echo "📦 Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "📦 Installing Nginx..."
apt install -y nginx

echo "📦 Installing PM2 (process manager)..."
npm install -g pm2

echo "📦 Installing Git..."
apt install -y git

echo "👤 Creating app user..."
useradd -m -s /bin/bash galmudug || true

echo "📂 Cloning repository..."
cd /home/galmudug
sudo -u galmudug git clone https://github.com/Fardowza-omar/galmudug-times.git app || {
    echo "Repository already exists, pulling latest..."
    cd /home/galmudug/app
    sudo -u galmudug git pull origin main
    cd /home/galmudug
}

echo "📦 Installing Node dependencies..."
cd /home/galmudug/app/api
sudo -u galmudug npm install --production

echo "🔐 Setting up environment..."
if [ ! -f /home/galmudug/app/api/.env ]; then
    cat > /home/galmudug/app/api/.env << 'ENVFILE'
NODE_ENV=production
PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_THIS_PASSWORD
ADMIN_EMAIL=admin@galmudug-times.com
ENVFILE
    chown galmudug:galmudug /home/galmudug/app/api/.env
    echo "⚠️  IMPORTANT: Edit /home/galmudug/app/api/.env and change the admin password!"
fi

echo "🔧 Configuring Nginx..."
cp /home/galmudug/app/nginx.conf /etc/nginx/sites-available/galmudug-times
ln -sf /etc/nginx/sites-available/galmudug-times /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Update server_name with your actual domain
echo "⚠️  Edit /etc/nginx/sites-available/galmudug-times and replace 'galmudug-times.com' with your actual domain"

nginx -t && systemctl restart nginx
systemctl enable nginx

echo "🚀 Starting application with PM2..."
cd /home/galmudug/app
sudo -u galmudug pm2 start ecosystem.config.cjs
sudo -u galmudug pm2 save

# Set PM2 to start on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u galmudug --hp /home/galmudug

echo "🔒 Setting up firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "============================================"
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit /home/galmudug/app/api/.env — change admin password"
echo "2. Edit /etc/nginx/sites-available/galmudug-times — set your domain"
echo "3. Set up Cloudflare DNS (see below)"
echo "4. Restart: sudo -u galmudug pm2 restart all"
echo "============================================"
