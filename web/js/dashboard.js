/* global Auth */
/*
 * Dashboard: total + conteos por nivel/localidad/tipo_servicio.
 * Cálculo client-side sobre 1 página de hasta DASH_LIMIT registros
 * (límite documentado en dashboard.html). No es censo global.
 */
(function () {
  "use strict";
  if (!Auth.requireAuth()) return;
  var logoutEl = document.getElementById("logout");
  if (logoutEl) logoutEl.addEventListener("click", function (e) { e.preventDefault(); Auth.logout(); });

  var DASH_LIMIT = 500;
  window.__DASH_LIMIT__ = DASH_LIMIT;

  function $(id) { return document.getElementById(id); }
  function countBy(rows, key) {
    var m = {};
    rows.forEach(function (r) {
      var k = (r[key] == null || r[key] === "") ? "(sin dato)" : String(r[key]);
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }
  function renderTable(tbodyId, map) {
    var tb = $(tbodyId);
    tb.innerHTML = "";
    Object.keys(map).sort().forEach(function (k) {
      var tr = document.createElement("tr");
      var a = document.createElement("td"); a.textContent = k;
      var b = document.createElement("td"); b.textContent = String(map[k]);
      tr.appendChild(a); tr.appendChild(b); tb.appendChild(tr);
    });
  }

  async function load() {
    var msg = $("dashMsg");
    function setMsg(m) { if (msg) msg.textContent = m || ""; }
    setMsg("");
    try {
      var res = await window.pb.collection("relevamiento").getList(1, DASH_LIMIT, { sort: "-created" });
      var rows = res.items || [];
      $("dashTotal").textContent = String(res.totalItems) + " fichas (" + rows.length + " analizadas)";
      renderTable("tbNivel", countBy(rows, "nivel"));
      renderTable("tbLoc", countBy(rows, "localidad"));
      renderTable("tbTipo", countBy(rows, "tipo_servicio"));
      if (res.totalItems > rows.length) {
        setMsg("Mostrando hasta 500 registros; los totales pueden ser parciales.");
      }
    } catch (_) {
      setMsg("No se pudo cargar. Reintente."); // genérico
    }
  }
  load();
})();
