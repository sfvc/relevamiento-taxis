# PocketBase — Relevamiento Taxis v1 (manual, NO tocar prod sin credenciales)

Instancia productiva: `https://forms.cc.gob.ar`. Procedimiento solo manual desde UI admin.
Nada aquí se conecta solo a producción.

## 1. Importar colección

1. Entrar a admin UI: `https://forms.cc.gob.ar/_/`.
2. Settings > Import collections > pegar contenido de `relevamiento.collections.json`.
3. Confirmar: colección `relevamiento`, índice único `idx_relevamiento_dni` sobre `dni`.
4. Verificar reglas auth-only en las 5 operaciones:
   `list / view / create / update / delete = @request.auth.id != ""`.
5. Probar sin sesión: `GET https://forms.cc.gob.ar/api/collections/relevamiento/records` → debe dar 401/403.

## 2. CORS

1. Settings > Application > CORS / Allowed origins.
2. Agregar SOLO origen app (ej. `https://relevamiento.cc.gob.ar`), sin `*`.
3. Guardar y re-probar preflight desde origen app.

## 3. Crear 2 usuarios

1. Collections > `users` (o colección auth usada) > New record.
2. Crear usuario 1 y usuario 2 con email/password provistos por responsable (no commitear credenciales).
3. Probar login/logout con cada uno desde `web/login.html`:
   login OK → redirige a `cargar.html`; logout → vuelve a `login.html`.

## 4. Notas seguridad

- Clave API Personas: NUNCA en JS público. Inyectar por servidor/proxy cuando URL+clave estén disponibles
  (ver `web/js/config.js`: `PERSONAS_API_URL` / `PERSONAS_API_KEY` vacíos por defecto).
- Headers de respuesta HTTP desde PocketBase:
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Condicionales (`tipo_servicio_otro`, `beneficio_quien`, `tipo_vivienda_otra`, `asistencia_otro`)
  y validaciones cruzadas (menores<=total, gastos máx3, asistencia máx2, deudas `ninguna` excluyente,
  score revalidado) se aplican en cliente; DNI único lo garantiza índice + pre-chequeo.
- Deploy: exponer solo el proxy server-side (Node/Express) que llama a la API Personas con la clave guardada en variables de entorno; el frontend nunca ve la clave.

## 5. Deploy

- Build/prod: `npm run build` o equivalente.
- Verificar: `node --check web/js/cargar.js` y `curl -I http://localhost:8090` debe dar HTTP 200.
- Producir reporte de headers con `curl -I https://tudominio/`.
