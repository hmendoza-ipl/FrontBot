# Frontbot Hotel — Guía de despliegue en Coolify

## Stack

- **App**: Next.js 14 · Node.js runtime (`next start`)
- **DB**: PostgreSQL 15 (Coolify resource)
- **ORM**: Prisma 5 con migraciones automáticas al boot

---

## 1. Crear el recurso PostgreSQL en Coolify

1. Coolify → **Resources** → **New Resource** → **PostgreSQL**
2. Nombre sugerido: `frontbot-postgres`
3. Base de datos: `frontbot`
4. Usuario: `frontbot_user`
5. Anotar el **hostname interno** (lo necesitas en `DATABASE_URL`)

---

## 2. Crear la aplicación en Coolify

1. **New Application** → conecta tu repo (GitHub/GitLab/Gitea)
2. **Build Pack**: `Node.js` (NO Docker, NO Nixpacks — usa Node runtime puro)
3. **Build Command**:
   ```
   npm ci && npx prisma generate && npm run build
   ```
4. **Start Command**:
   ```
   npm run db:migrate && ( [ "$SEED_ON_BOOT" = "true" ] && npm run db:seed || true ) && npm run start
   ```

---

## 3. Variables de entorno (Coolify → App → Environment)

```
DATABASE_URL=postgresql://frontbot_user:PASSWORD@frontbot-postgres:5432/frontbot?schema=public
NODE_ENV=production
SEED_ON_BOOT=true
```

> ⚠️ `frontbot-postgres` es el hostname **interno** del servicio en Coolify.
> No uses la IP pública si app y DB están en el mismo servidor.

### Opcionales

```
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM=Frontbot Hotel <noreply@tudominio.com>
N8N_AI_WEBHOOK_URL=https://tu-n8n.com/webhook/xxxxx
```

---

## 4. Qué hace el Start Command paso a paso

```bash
npm run db:migrate
```
→ Ejecuta `prisma migrate deploy` (aplica migraciones pendientes, crea tablas si no existen).

```bash
[ "$SEED_ON_BOOT" = "true" ] && npm run db:seed || true
```
→ Si `SEED_ON_BOOT=true`, carga los datos demo (idempotente: si ya hay datos, hace skip).

```bash
npm run start
```
→ Levanta `next start -p ${PORT:-3000}`. Coolify inyecta `PORT` automáticamente.

---

## 5. Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env
# editar .env con tu DATABASE_URL local

# 3. Aplicar migraciones
npx prisma migrate dev --name init

# 4. Cargar datos demo
npx prisma db seed

# 5. Correr en dev
npm run dev
```

### Con Docker local (PostgreSQL)

```bash
docker run -d \
  --name frontbot-pg \
  -e POSTGRES_USER=frontbot_user \
  -e POSTGRES_PASSWORD=localpassword \
  -e POSTGRES_DB=frontbot \
  -p 5432:5432 \
  postgres:15

# .env
# DATABASE_URL="postgresql://frontbot_user:localpassword@localhost:5432/frontbot?schema=public"
```

---

## 6. Migraciones (flujo en producción)

| Situación | Comando |
|-----------|---------|
| Primera vez (crear tablas) | El Start Command lo hace automático |
| Nuevo campo en schema.prisma | `npx prisma migrate dev --name add_campo` (local) → push → redeploy en Coolify |
| Reset completo demo | `npm run db:reset` (¡destruye datos!) + `npm run db:seed` |

---

## 7. Checklist antes del primer deploy

- [ ] Recurso PostgreSQL Running en Coolify
- [ ] `DATABASE_URL` con hostname interno correcto
- [ ] `SEED_ON_BOOT=true` para primera vez
- [ ] Build Command incluye `npx prisma generate`
- [ ] Start Command incluye `npm run db:migrate`

---

## 8. Archivos clave agregados

```
prisma/
  schema.prisma     ← Todas las entidades (RoomType, Room, Reservation, F&B, Concierge…)
  seed.ts           ← Datos demo (idempotente)

lib/
  prisma.ts         ← Singleton PrismaClient
  hotelDb.ts        ← Hotel PMS (async/await Prisma)
  demoDb.ts         ← Concierge IA (async/await Prisma)

.env.example        ← Variables requeridas
DEPLOY.md           ← Esta guía
```

---

## 9. Troubleshooting

**Error: `PrismaClientInitializationError`**
→ Revisar `DATABASE_URL`. El hostname debe ser el interno de Coolify, no IP pública.

**Error: `@prisma/client did not initialize yet`**
→ Asegúrate que el Build Command incluye `npx prisma generate`.

**Las tablas no se crean**
→ El Start Command debe correr antes de `next start`. Verificar logs de Coolify.

**El seed no carga**
→ Verificar `SEED_ON_BOOT=true` en env. Revisar logs de boot.
→ Si ya hay datos, el seed hace skip (idempotente). Para forzar: `npm run db:reset`.
