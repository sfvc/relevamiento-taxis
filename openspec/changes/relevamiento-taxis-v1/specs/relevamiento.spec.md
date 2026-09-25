# Spec: Relevamiento Taxis v1 — `relevamiento`

Fuente: `ficha de relevamiento taxis PDF.pdf` (repo raíz). Leyenda confidencial: "Datos confidenciales. Uso exclusivo para gestión de asistencia."

## Modelo de datos (colección `relevamiento`)

### 1. Datos personales y del servicio

| Campo | Tipo | Regla |
|-------|------|-------|
| `apellido_nombre` | text, required | — |
| `dni` | text, required, unique | Solo dígitos, 7–8 chars; índice único |
| `tel_whatsapp` | text, required | — |
| `edad` | number, required | 18–100 |
| `localidad` | text, required | — |
| `barrio` | text, required | — |
| `tipo_servicio` | select, required | `taxi \| remis \| app \| otro` |
| `tipo_servicio_otro` | text, condicional | Requerido si `tipo_servicio = otro` |
| `vehiculo` | select, required | `propio \| alquila \| chofer` |
| `antiguedad_anios` | number, required | >= 0 |

### 2. Situación del hogar

| Campo | Tipo | Regla |
|-------|------|-------|
| `convivientes_total` | number, required | >= 1 |
| `menores_18` | number, required | 0 <= x <= total |
| `unico_sosten` | bool, required | — |
| `tiene_beneficio` | bool, required | CUD / jubilación / AUH |
| `beneficio_quien` | text, condicional | Requerido si `tiene_beneficio = true` |
| `tipo_vivienda` | select, required | `propia \| alquilada \| prestada \| otra` |
| `tipo_vivienda_otra` | text, condicional | Requerido si `otra` |

### 3. Situación laboral y económica

| Campo | Tipo | Regla |
|-------|------|-------|
| `ingreso_promedio_3m` | number, required | >= 0 |
| `caida_ingresos` | select, required | `mas50 \| 30a50 \| menos30 \| igual` |
| `gastos_fijos` | multiselect | Máx 3 de: `alquiler_auto \| combustible \| seguro_patente \| alquiler_casa \| alimentos \| medicamentos` |
| `deudas` | multiselect | De: `alquiler \| servicios \| tarjeta_prestamo \| obra_social \| ninguna` (`ninguna` excluyente) |

### 4. Indicador de urgencia (auto-score)

4 preguntas, cada una 1–3 (`1 = No, 2 = A veces, 3 = Sí siempre`):

- `u_comida` — dejó de hacer alguna comida por falta de dinero.
- `u_combustible_vs_comida` — eligió entre cargar combustible o comprar alimentos/medicamentos.
- `u_depende_auto` — familia depende 100% de lo recaudado con el auto.
- `u_salud` — problema de salud no atendido por costo.

`puntaje_total = u_comida + u_combustible_vs_comida + u_depende_auto + u_salud` → rango 4–12.
`nivel`: `9–12 = critico`, `5–8 = medio`, `1–4 = bajo` (literal PDF; mínimo real 4).

### 5. Asistencia solicitada + cierre

| Campo | Tipo | Regla |
|-------|------|-------|
| `asistencia` | multiselect, required | Máx 2 de: `bono \| bolson \| kit_gnc \| patente_seguro \| capacitacion \| salud \| licencia \| condonacion \| otro` |
| `asistencia_otro` | text, condicional | Requerido si incluye `otro` |
| `entrevistado_aclaracion` | text, required | Firma en papel; v1 solo aclaración texto (sin archivos) |
| `fecha` | date, required | Default hoy, formato 2026 |
| `entrevistador` | text, required | Aclaración entrevistador |
| `lugar` | text, required | Lugar de relevamiento |

Campos sistema: `origen_personas` (bool, badge autocompletado), `created`, `updated`, `owner`.

## Requerimientos EARS

- REQ-AUTH-1: El sistema DEBE exigir autenticación PocketBase en cargar/tabla/dashboard; SI no hay sesión, DEBE redirigir a login.
- REQ-AUTH-2: El sistema DEBE usar email/password contra `forms.cc.gob.ar`; CUANDO las credenciales son inválidas, DEBE mostrar error sin detallar qué campo falló.
- REQ-FORM-1: El formulario DEBE presentar las 5 secciones con todos los campos del modelo; DONDE haya opción "otro", DEBE mostrar campo texto condicional.
- REQ-FORM-2: SI `gastos_fijos` supera 3 selecciones, EL SISTEMA DEBE bloquear la 4.ª con mensaje.
- REQ-FORM-3: SI `asistencia` supera 2 selecciones, EL SISTEMA DEBE bloquear la 3.ª con mensaje.
- REQ-FORM-4: SI `deudas` incluye `ninguna` junto a otras, EL SISTEMA DEBE desmarcar las demás (excluyente).
- REQ-PERSONAS-1: CUANDO el operador ingresa DNI y dispara búsqueda, EL SISTEMA DEBE consultar API Personas (URL+clave configurables, pendientes) y prellenar apellido_nombre, edad, localidad, barrio si existen.
- REQ-PERSONAS-2: Los campos autocompletados DEBEN quedar editables; SI hubo autocompletado, DEBE mostrarse badge "Autocompletado" y setear `origen_personas = true`.
- REQ-PERSONAS-3: SI la API falla o no trae datos, EL SISTEMA DEBE permitir carga manual completa sin bloquear.
- REQ-DNI-1: El campo `dni` DEBE ser único; CUANDO se intenta guardar un DNI existente, EL SISTEMA DEBE bloquear y ofrecer "Editar existente" (link a ficha).
- REQ-SCORE-1: El sistema DEBE calcular `puntaje_total` y `nivel` automáticamente al cambiar cualquier pregunta de urgencia y mostrarlos antes de guardar.
- REQ-SCORE-2: El sistema DEBE revalidar score/nivel al guardar (no confiar solo en cliente).
- REQ-TABLA-1: La tabla DEBE listar fichas con filtros por localidad, tipo_servicio, nivel y rango de fechas, más búsqueda por DNI/nombre.
- REQ-TABLA-2: CUANDO hay filtros activos, EL SISTEMA DEBE exportar a Excel solo las filas filtradas.
- REQ-DASH-1: El dashboard DEBE mostrar: total fichas, conteo por nivel, por localidad, por tipo_servicio.
- REQ-NOFILES-1: v1 NO DEBE incluir subida de archivos; el cierre (firmas) se registra solo como texto aclaratorio.
- REQ-NONOTIF-1: v1 NO DEBE enviar notificaciones de ningún tipo.
- REQ-SEC-1: Todas las lecturas/escrituras a PocketBase DEBEN ir autenticadas; las reglas de la colección DEBEN denegar acceso no autenticado.
- REQ-SEC-2: El CORS del PocketBase DEBE restringirse al origen de la app; la clave de API Personas NO DEBE exponerse en JS público (proxy o inyección servidor cuando esté disponible).

## Criterios de aceptación (Given/When/Then)

- AUTH-OK: Given sesión inexistente, When abro `/cargar`, Then redirige a login.
- AUTH-LOGIN: Given credenciales válidas de los 2 usuarios, When hago login, Then entro a cargar y persiste sesión.
- AUTH-FAIL: Given credenciales inválidas, When intento login, Then veo error genérico y no entro.
- FORM-SEC1-5: Given login, When cargo ficha completa con cada `tipo_servicio` y `otra` variantes, Then guarda sin errores y lista en tabla.
- FORM-GASTOS: Given formulario, When marco 4 gastos, Then el 4.º se bloquea con mensaje.
- FORM-ASIST: Given formulario, When marco 3 asistencias, Then la 3.ª se bloquea con mensaje.
- FORM-DEUDA: Given marco `ninguna` con otras deudas, When guardo, Then solo queda `ninguna`.
- PERSONAS-OK: Given DNI con datos en API, When busco, Then precarga campos, muestra badge, `origen_personas=true`, y puedo editarlos.
- PERSONAS-FALLA: Given API caída/sin datos, When busco, Then aviso no bloqueante y carga manual habilitada.
- DNI-DUP: Given DNI ya cargado, When guardo duplicado, Then bloquea con mensaje + botón "Editar existente" que abre la ficha.
- SCORE: Given respuestas (3,3,2,1), When cambian, Then total=9 y nivel=Crítico visible antes de guardar; backend lo revalida.
- SCORE-NIVELES: Given combinaciones borde (4→Bajo, 5→Medio, 8→Medio, 9→Crítico, 12→Crítico), When calculo, Then nivel correcto.
- TABLA-FILTROS: Given 10 fichas variadas, When filtro por localidad+tipo+nivel+rango fecha+texto DNI, Then solo filas coincidentes.
- TABLA-EXCEL: Given filtro activo con N filas, When exporto, Then Excel con esas N filas y columnas de las 5 secciones.
- DASH: Given fichas cargadas, When abro dashboard, Then totales por nivel/localidad/tipo cuadran con tabla.
- NOFILES: Given formulario, When inspecciono, Then no existe input file.
- NONOTIF: Given guardo ficha, When completo, Then no se dispara email/push y no hay código de notificaciones.
- SEC: Given sin sesión, When llamo directo a API PocketBase, Then 401/403; CORS solo permite origen app.
