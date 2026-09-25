/* global Auth */
/* Export Excel client-side de filas filtradas (SheetJS via CDN). */
(function () {
  "use strict";

  // Columnas §§1–5 + score/sistema, en orden del spec.
  var COLS = [
    "fecha", "dni", "apellido_nombre", "tel_whatsapp", "edad",
    "localidad", "barrio", "tipo_servicio", "tipo_servicio_otro", "vehiculo", "antiguedad_anios",
    "convivientes_total", "menores_18", "unico_sosten", "tiene_beneficio", "beneficio_quien",
    "tipo_vivienda", "tipo_vivienda_otra", "ingreso_promedio_3m", "caida_ingresos",
    "gastos_fijos", "deudas",
    "u_comida", "u_combustible_vs_comida", "u_depende_auto", "u_salud",
    "puntaje_total", "nivel", "asistencia", "asistencia_otro",
    "entrevistado_aclaracion", "entrevistador", "lugar", "origen_personas"
  ];

  function flat(r) {
    var o = {};
    COLS.forEach(function (k) {
      var v = r[k];
      o[k] = Array.isArray(v) ? v.join(",") : (v == null ? "" : v);
    });
    return o;
  }

  async function fetchAllFiltered(filter, sort) {
    var out = [];
    var page = 1, perPage = 200;
    for (var i = 0; i < 25 && page; i++) { // tope 5000 filas
      var res = await window.pb.collection("relevamiento").getList(page, perPage, { filter: filter, sort: sort });
      out = out.concat(res.items || []);
      page = res.page < res.totalPages ? res.page + 1 : 0;
    }
    return out;
  }

  function stamp() { return new Date().toISOString().slice(0, 10); }

  async function exportFiltered() {
    var msgEl = document.getElementById("tablaMsg");
    function msg(m) { if (msgEl) msgEl.textContent = m || ""; }
    try {
      if (!window.XLSX) { msg("No se puede acceder al generador de reportes. Reintente."); return; }
      var filter = window.__TABLA_FILTER__ || "";
      var sort = window.__TABLA_SORT__ || "-created";
      var rows = await fetchAllFiltered(filter, sort);
      if (!rows.length) { msg("No hay datos para exportar con esos filtros."); return; }
      var ws = window.XLSX.utils.json_to_sheet(rows.map(flat), { header: COLS });
      var wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "fichas");
      window.XLSX.writeFile(wb, "relevamiento_" + stamp() + ".xlsx");
      msg("Exportadas " + rows.length + " filas.");
    } catch (_) {
      msg("No se pudo exportar. Reintente."); // genérico
    }
  }

  window.ExportExcel = { exportFiltered: exportFiltered };
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("btnExport");
    if (b) b.addEventListener("click", exportFiltered);
  });
})();
