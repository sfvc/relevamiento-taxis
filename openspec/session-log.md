# Bitácora de sesiones

## 2026-09-24 — Relevamiento taxis v1
- Hallazgo: repo solo contenía el PDF; sin código previo ni CLI openspec (artefactos creados manuales).
- Decisión: HTML+JS vanilla + colección `relevamiento` en forms.cc.gob.ar; DNI único bloquea+editar; Personas autocompleta editable con badge; sin archivos ni notificaciones v1.
- Estado: build local listo (pb/schema + web 4 páginas). QA estático PASS, live bloqueado (falta import PB + usuarios). Seguridad 0🔴, 7🟡 corregidas.
- Siguiente: manual en prod → importar colección, crear 2 usuarios, CORS, deploy estático+Pangolin, pasar URL Personas (vía proxy), prueba E2E con credenciales.

## 2026-09-24 (tarde) — E2E navegador real
- Hallazgo: E2E con Chromium halló 4 bugs que los checks estáticos no vieron (SRI sin prefijo, validateAll 27 errores, sin created/updated, required≠0).
- Decisión: convivientes/otros numéricos required:false en PB (frontend valida); created/updated autodate agregados; UI estilo Poncho azul/naranja sin jerga.
- Estado: E2E PASS completo. Prod con 1 registro prueba (DNI 11222333) por borrar.
- Siguiente: borrar prueba, rotar clave admin, definir dominio deploy + proxy Personas.
