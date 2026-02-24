# 🤖 Frontbot Demo — Qubica.AI

Conserje inteligente para hoteles con IA + Tickets por área + Chat en tiempo real.

## 🚀 Instalación local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus valores

# 3. Correr en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📦 Deploy en servidor (VPS / DigitalOcean / Contabo)

### Opción A: PM2 + Nginx

```bash
# En el servidor
git clone tu-repo
cd frontbot-demo
npm install
npm run build

# Instalar PM2 globalmente
npm install -g pm2

# Iniciar con PM2
pm2 start npm --name "frontbot" -- start
pm2 startup
pm2 save
```

**nginx config** (`/etc/nginx/sites-available/frontbot`):
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

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
ln -s /etc/nginx/sites-available/frontbot /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL con Certbot
certbot --nginx -d tu-dominio.com
```

### Opción B: Deploy en Vercel (más fácil)

```bash
npm install -g vercel
vercel
```

Agrega las variables de entorno en el dashboard de Vercel.

### Opción C: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t frontbot .
docker run -p 3000:3000 --env-file .env.local frontbot
```

## ⚙️ Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `N8N_AI_WEBHOOK_URL` | Webhook de n8n para respuestas IA | No (usa fallback) |
| `RESEND_API_KEY` | API key de Resend para emails | No |
| `MAIL_FROM` | Email remitente | No |
| `MAIL_PROVIDER` | Proveedor email (resend) | No |

## 🏗️ Estructura del proyecto

```
frontbot-demo/
├── app/
│   ├── page.tsx              # Landing
│   ├── demo-login/           # Selector de rol demo
│   ├── demo/                 # Módulo huésped
│   │   ├── page.tsx          # Home huésped
│   │   ├── chat/             # Chat con IA
│   │   ├── tickets/          # Solicitudes
│   │   ├── nearby/           # Lugares cercanos
│   │   └── checkout/         # Checkout express
│   ├── admin/                # Módulo admin
│   │   ├── page.tsx          # Dashboard
│   │   ├── conversations/    # Chat + takeover
│   │   └── tickets/          # Cola operativa
│   └── api/
│       ├── demo/             # APIs locales
│       ├── n8n/ai/           # Webhook n8n
│       └── mail/send/        # Envío de emails
├── components/
│   ├── Shell.tsx             # Layout + nav
│   └── ChatPanel.tsx         # Chat en tiempo real
└── lib/
    ├── demoAuth.ts           # Auth localStorage
    └── demoDb.ts             # DB en memoria
```

## 📡 Conectar con n8n

El endpoint `/api/n8n/ai` envía al webhook:

```json
{
  "hotelId": "hotel_demo_1",
  "guestId": "guest_demo",
  "conversationId": "uuid",
  "messages": [
    { "sender": "guest", "content": "Necesito toallas", "createdAt": "..." }
  ]
}
```

Espera respuesta:
```json
{ "reply": "Entendido, envío housekeeping en 20 min." }
```

## 🔒 Producción

Para producción, añade:
- Supabase o PostgreSQL en lugar de memoria
- NextAuth.js para autenticación real
- Rate limiting en APIs
- Validación de inputs con Zod

---

Hecho con ❤️ por Qubica.AI
