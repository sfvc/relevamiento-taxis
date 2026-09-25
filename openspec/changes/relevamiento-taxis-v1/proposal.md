# Propuesta: Relevamiento Taxis v1

## Objetivo

Digitalizar la **Ficha de Relevamiento Socioeconómico — Choferes y Taxistas — Catamarca 2026** (PDF del repo) en app web interna para carga, consulta y priorización de fichas, con autocompletado por DNI vía API Personas, score de urgencia automático y dashboard de conteos.

## Alcance v1

### Incluido

- Auth login PocketBase (email/password), rutas protegidas auth-only.
- Formulario 5 secciones mapeado 1:1 del PDF (ver `specs/relevamiento.spec.md`).
- Autocompletado API Personas por DNI, campos editables tras autollenar, badge visible.
- DNI único: bloquea duplicado, ofrece editar existente.
- Score urgencia automático 4–12 + niveles (9–12 Crítico, 5–8 Medio, 1–4 Bajo según PDF).
- Tabla con filtros + export Excel.
- Dashboard con conteos.
- Seguridad mínima: auth-only + CORS.

### Excluido v1

- Subida/gestión de archivos (fotos, PDFs firmados, DNI escaneado).
- Notificaciones (email, push, in-app).
- Roles granulares, auditoría, offline/PWA, multi-ciudad.

## Páginas

1. `login` — acceso.
2. `cargar` — formulario secciones 1–5 + firma/aclaración/fecha/entrevistador/lugar.
3. `tabla` — listado + filtros + export Excel + editar.
4. `dashboard` — conteos.

## Decisiones acordadas

| Tema | Decisión |
|------|----------|
| Uso | Oficina, PC (no móvil en territorio v1) |
| Stack | HTML + JS vanilla + PocketBase |
| Backend URL | `forms.cc.gob.ar` (PocketBase existente) |
| Usuarios | 2 (entrevistadores / carga) |
| Páginas | 3 + login: cargar / tabla / dashboard |
| API Personas | URL + clave pendientes de provisión; integrar con config inyectable, no hardcodear secreto en frontend público |
| Archivos | Sin archivos v1; S3 futuro (cuando exista bucket, agregar campo/file + migración) |
| Notificaciones | Sin notificaciones v1 |
| DNI duplicado | Constraint único en colección; UI bloquea y ofrece editar |
| Score urgencia | Cálculo cliente + recálculo servidor/regla (validación), rango 4–12; niveles según PDF |
| Export Excel | Client-side desde tabla filtrada (ej. SheetJS) |
| Seguridad | Auth-only en todas las páginas salvo login; CORS restringido al origen de la app |
