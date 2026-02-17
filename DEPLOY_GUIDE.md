# 🚀 GUÍA MAESTRA DE DEPLOY: PROTOCOL (VPS HOSTINGER)
Esta guía contiene todos los comandos exactos para tomar tu proyecto local y ponerlo en vivo en tu VPS de Hostinger.

---

## 🏗️ 1. Preparar el Servidor (Ubuntu 22.04)

Conéctate a tu VPS como root:
```bash
ssh root@<TU_IP_DEL_VPS>
```

Actualiza el sistema e instala las herramientas base:
```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx build-essential
```

Instala Node.js (v20 LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Instala PM2 (Gestor de procesos para mantener el Backend vivo):
```bash
npm install -g pm2
```

---

## 📦 2. Subir tu Proyecto al VPS

Tienes dos opciones. **Opción A (Git)** es la recomendada. **Opción B (SCP)** si no quieres usar Git.

### Opción A: Usando Git (Recomendado)
Sube tu código a GitHub/GitLab (privado o público). Luego en el VPS:
```bash
cd /var/www
git clone https://github.com/TU_USUARIO/TrackYourself.git protocol
cd protocol
```

### Opción B: Usando SCP (Directo desde tu PC Windows)
Abre una terminal PowerShell en la carpeta de tu proyecto (`C:\Proyectos\TrackYourself`) y corre:
*(Reemplaza `<IP>` con la IP de tu VPS)*
```powershell
# Sube todo EXCEPTO node_modules y .git
scp -r src backend public package.json tsconfig.json vite.config.ts index.html postcss.config.js tailwind.config.js root@<IP>:/var/www/protocol
```
*Nota: Tendrás que crear la carpeta `/var/www/protocol` primero en el VPS.*

---

## ⚙️ 3. Configurar el Backend (API)

En el VPS, ve a la carpeta del backend e instala:
```bash
cd /var/www/protocol/backend
npm install
```

Configura las variables de entorno:
```bash
# Crea el archivo .env
nano .env
# Pega esto dentro:
# PORT=4000
# JWT_SECRET="TU_SECRETO_SUPER_SEGURO"
# DATABASE_URL="file:./dev.db"
```
*(Guarda con Ctrl+O, Enter, Ctrl+X)*

Prepara la Base de Datos y Compila:
```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

Arranca el Backend con PM2:
```bash
pm2 start dist/index.js --name "protocol-api"
pm2 save
pm2 startup
```
*(Ahora tu API está viva en el puerto 4000)*

---

## 🎨 4. Configurar el Frontend (React)

En el VPS, ve a la raíz del proyecto y construye la app:
```bash
cd /var/www/protocol
npm install

# Crea el archivo .env para el frontend (Requerido para la API de Ejercicios)
nano .env
# Pega: VITE_RAPIDAPI_KEY="TU_CLAVE_DE_RAPIDAPI"
# (Si no tienes clave, la app usará datos de prueba, pero es mejor ponerla vacía o real)

npm run build
```
*Esto generará una carpeta `dist` con tu app optimizada.*

---

## 🌐 5. Configurar Nginx (Reverse Proxy)

Vamos a decirle a Nginx que sirva tu Frontend y redirija las peticiones `/api` al Backend.

Crea el archivo de configuración:
```bash
nano /etc/nginx/sites-available/protocol
```

Pega el siguiente contenido (reemplaza `tu-dominio.com` por tu dominio real, o usa `_` si solo tienes IP):

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    root /var/www/protocol/dist;
    index index.html;

    # Frontend (React SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend (API Proxy)
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activa el sitio y recarga Nginx:
```bash
ln -s /etc/nginx/sites-available/protocol /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Borra el default si existe
nginx -t # Verifica que no haya errores
systemctl restart nginx
```

---

## 🔒 6. Dominio y SSL (El Candadito Verde)

1.  **DNS**: Ve a tu proveedor de dominios (Namecheap, GoDaddy, Hostinger) y crea un **A Record**:
    *   Host: `@`
    *   Value: `TU_IP_DEL_VPS`

2.  **SSL (HTTPS)**:
    En el VPS, corre:
    ```bash
    certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
    ```
    *Sigue las instrucciones y selecciona la opción "2" (Redirect) si te pregunta.*

---

## ✅ ¡LISTO!
Tu app **Protocol** debería estar accesible en `https://tu-dominio.com`.

### 🛠️ Comandos Útiles de Mantenimiento

*   **Ver logs del Backend**: `pm2 logs protocol-api`
*   **Reiniciar Backend**: `pm2 restart protocol-api`
*   **Ver estado servicios**: `pm2 status`
*   **Actualizar cambios Frontend**:
    1.  `git pull` (o subir archivos nuevos)
    2.  `npm run build`
