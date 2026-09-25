# Tareas: Relevamiento Taxis v1

Convención subagente: `investigator` (localiza), `builder` (edita 1–2 archivos), `reviewer` (revisa diff).

1. [PB] Crear colección `relevamiento` en forms.cc.gob.ar con schema §§1–5 + índice único `dni` + reglas auth-only — `builder`
2. [PB] Configurar CORS origen app + 2 usuarios + probar login/logout — `builder`
3. [WEB] Scaffold HTML+JS vanilla (login/cargar/tabla/dashboard + router guard auth-only) — `builder`
4. [WEB] Login email/password contra forms.cc.gob.ar + manejo error genérico + persistencia sesión — `builder`
5. [WEB] Form §1 (datos personales/servicio + `otro` condicional + validaciones) — `builder`
6. [WEB] Form §2 (hogar + condicionales beneficio/vivienda + validación menores<=total) — `builder`
7. [WEB] Form §3 (ingresos + gastos máx3 + deudas excluyente `ninguna`) — `builder`
8. [WEB] Form §4 (4 preguntas 1–3 + score auto 4–12 + nivel visible) — `builder`
9. [WEB] Form §5 (asistencia máx2 + `otro` + cierre entrevistado/fecha/entrevistador/lugar) — `builder`
10. [WEB] Integración API Personas por DNI (config URL+clave inyectable, pendiente) + badge + editable + fallback manual — `builder`
11. [WEB] DNI único: pre-chequeo + manejo error constraint + botón "Editar existente" — `builder`
12. [WEB] Guardar/editar ficha con revalidación score/nivel pre-envío — `builder`
13. [WEB] Tabla: listado + filtros (localidad, tipo_servicio, nivel, fecha rango, texto DNI/nombre) — `builder`
14. [WEB] Export Excel client-side de filas filtradas (SheetJS) — `builder`
15. [WEB] Dashboard: total + conteos por nivel/localidad/tipo_servicio — `builder`
16. [SEC] Endurecer: sin input file, sin código notificaciones, reglas PB deniegan anónimo, CORS restringido, clave Personas no expuesta — `reviewer`
17. [QA] Verificar todos los criterios Given/When/Then del spec contra deploy + corregir — `reviewer`
