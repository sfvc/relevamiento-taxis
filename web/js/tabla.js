/* global Auth */
/* Tabla: listado paginado + filtros. Colección `relevamiento`. */
(function () {
  "use strict";
  if (!Auth.requireAuth()) return;
  var logoutEl = document.getElementById("logout");
  if (logoutEl) logoutEl.addEventListener("click", function (e) { e.preventDefault(); Auth.logout(); });

  function $(id) { return document.getElementById(id); }
  var state = { page: 1, perPage: 20, totalPages: 1, filter: "", sort: "-created" };
  // Cache última página filtrada para export rápido; export.js re-consulta todo si hace falta.
  window.__TABLA_ROWS__ = [];

  function esc(v) { return String(v || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"'); }

  function buildFilter() {
    var parts = [];
    var loc = $("fLoc").value.trim();
    var ts = $("fTipo").value;
    var niv = $("fNivel").value;
    var desde = $("fDesde").value;
    var hasta = $("fHasta").value;
    var q = $("fQ").value.trim();
    if (loc) parts.push('localidad ~ "' + esc(loc) + '"');
    if (ts) parts.push('tipo_servicio = "' + esc(ts) + '"');
    if (niv) parts.push('nivel = "' + esc(niv) + '"');
    if (desde) parts.push('fecha >= "' + esc(desde) + '"');
    if (hasta) parts.push('fecha <= "' + esc(hasta) + '"');
    if (q) parts.push('(dni ~ "' + esc(q) + '" || apellido_nombre ~ "' + esc(q) + '")');
    return parts.join(" && ");
  }

  function setMsg(m) { var el = $("tablaMsg"); if (el) el.textContent = m || ""; }

  function rowHtml(r) {
    function td(v) { var d = document.createElement("td"); d.textContent = v == null ? "" : String(v); return d; }
    var tr = document.createElement("tr");
    tr.appendChild(td(r.fecha || ""));
    tr.appendChild(td(r.dni || ""));
    tr.appendChild(td(r.apellido_nombre || ""));
    tr.appendChild(td(r.localidad || ""));
    tr.appendChild(td(r.tipo_servicio || ""));
    tr.appendChild(td(r.nivel || ""));
    tr.appendChild(td(r.puntaje_total != null ? r.puntaje_total : ""));
    tr.appendChild(td(r.entrevistador || ""));
    var tdEdit = document.createElement("td");
    var a = document.createElement("a");
    a.href = "cargar.html?id=" + encodeURIComponent(r.id);
    a.textContent = "Editar";
    tdEdit.appendChild(a);
    tr.appendChild(tdEdit);
    return tr;
  }

  async function load() {
    setMsg("");
    state.filter = buildFilter();
    var tbody = $("tablaBody");
    tbody.innerHTML = "";
    try {
      var res = await window.pb.collection("relevamiento").getList(state.page, state.perPage, {
        filter: state.filter,
        sort: state.sort
      });
      window.__TABLA_ROWS__ = res.items || [];
      // Expone filtro vigente para export.js (re-consulta todas las páginas).
      window.__TABLA_FILTER__ = state.filter;
      window.__TABLA_SORT__ = state.sort;
      window.__TABLA_TOTAL__ = res.totalItems;
      (res.items || []).forEach(function (r) { tbody.appendChild(rowHtml(r)); });
      state.totalPages = res.totalPages || 1;
      $("pageInfo").textContent = "Pág " + res.page + "/" + state.totalPages + " — " + res.totalItems + " fichas";
      $("btnPrev").disabled = res.page <= 1;
      $("btnNext").disabled = res.page >= state.totalPages;
      if (!res.items.length) setMsg("No hay fichas con esos filtros.");
    } catch (_) {
      window.__TABLA_ROWS__ = [];
      setMsg("No se pudo cargar. Reintente.");
    }
  }

  $("filtros").addEventListener("submit", function (e) { e.preventDefault(); state.page = 1; load(); });
  $("btnClear").addEventListener("click", function () {
    $("filtros").reset(); state.page = 1; load();
  });
  $("btnPrev").addEventListener("click", function () { if (state.page > 1) { state.page--; load(); } });
  $("btnNext").addEventListener("click", function () { if (state.page < state.totalPages) { state.page++; load(); } });

  load();
})();
