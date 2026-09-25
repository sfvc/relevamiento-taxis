/* global Auth, Masks */
(function () {
  "use strict";

  if (!Auth.requireAuth()) return;
  var logoutEl = document.getElementById("logout");
  if (logoutEl) logoutEl.addEventListener("click", function (e) { e.preventDefault(); Auth.logout(); });

  function $(id) { return document.getElementById(id); }
  var form = $("fichaForm"), errEl = $("formError"), okEl = $("formOk");
  var sumEl = $("errorSummary"), sumList = $("errorSummaryList");
  var originPersonas = false;
  var editingId = new URLSearchParams(window.location.search).get("id") || null;

  // ---- Stepper: sección activa ----
  document.querySelectorAll(".stepper a").forEach(function (a) {
    a.addEventListener("click", function () {
      document.querySelectorAll(".stepper a").forEach(function (x) { x.classList.remove("active"); });
      a.classList.add("active");
    });
  });

  function checked(name) {
    return Array.prototype.map.call(
      form.querySelectorAll('input[name="' + name + '"]:checked'), function (el) { return el.value; });
  }
  function radioVal(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function radioInt(name) {
    var v = radioVal(name);
    return v === "" ? NaN : parseInt(v, 10);
  }
  function setMsg(el, msg) { if (el) el.textContent = msg || ""; }

  // Fecha default hoy (formato YYYY-MM-DD).
  if ($("fecha") && !$("fecha").value) $("fecha").value = new Date().toISOString().slice(0, 10);

  // Entrevistador = usuario logueado (editable).
  try {
    var me = window.pb && window.pb.authStore && window.pb.authStore.model;
    if (me && $("entrevistador") && !$("entrevistador").value) {
      $("entrevistador").value = me.name || me.username || me.email || "";
    }
  } catch (_) { /* sin bloqueo */ }

  // ============================================================
  // Validación UX: error inline + borde + aria-invalid + resumen.
  // Reglas idénticas al spec (topes 3/2, menores<=total, ninguna
  // excluyente, score 4–12). Reuso de reglas previas de cargar.js.
  // ============================================================
  function fieldError(id, msg) {
    var el = $(id), errP = $("err_" + id);
    if (!el) return;
    if (msg) {
      el.classList.add("is-invalid");
      el.classList.remove("is-valid");
      el.setAttribute("aria-invalid", "true");
      if (errP) { errP.textContent = msg; errP.hidden = false; }
    } else {
      el.classList.remove("is-invalid");
      if (el.value && String(el.value).trim() !== "") el.classList.add("is-valid");
      el.setAttribute("aria-invalid", "false");
      if (errP) { errP.textContent = ""; errP.hidden = true; }
    }
  }

  // Chequeos por campo (id si aplica). Devuelven "" si OK.
  // Radios sin input de id (sí/no): error inline directo en el <p> de estado.
  function groupError(name, msg) {
    var p = $("err_" + name);
    if (p) { p.textContent = msg || ""; p.hidden = !msg; }
  }
  var CHECKS = {
    dni: function () {
      var v = $("dni").value.trim();
      return /^\d{7,8}$/.test(v) ? "" : "DNI inválido: 7–8 dígitos.";
    },
    apellido_nombre: function () { return $("apellido_nombre").value.trim() ? "" : "Falta apellido y nombre."; },
    tel_whatsapp: function () { return $("tel_whatsapp").value.trim() ? "" : "Falta teléfono."; },
    edad: function () {
      var v = num("edad");
      return (v >= 18 && v <= 100) ? "" : "Edad debe ser 18–100.";
    },
    localidad: function () { return $("localidad").value.trim() ? "" : "Falta localidad."; },
    barrio: function () { return $("barrio").value.trim() ? "" : "Falta barrio."; },
    tipo_servicio: function () {
      if (!$("tipo_servicio").value) return "Falta tipo de servicio.";
      if ($("tipo_servicio").value === "otro" && !$("tipo_servicio_otro").value.trim())
        return "Detalle otro servicio (ver campo condicional).";
      return "";
    },
    tipo_servicio_otro: function () {
      return ($("tipo_servicio").value === "otro" && !$("tipo_servicio_otro").value.trim())
        ? "Detalle otro servicio." : "";
    },
    vehiculo: function () { return $("vehiculo").value ? "" : "Falta vehículo."; },
    antiguedad_anios: function () {
      return num("antiguedad_anios") >= 0 ? "" : "Antigüedad debe ser ≥ 0.";
    },
    convivientes_total: function () {
      return num("convivientes_total") >= 0 ? "" : "Convivientes debe ser ≥ 0.";
    },
    menores_18: function () {
      var tot = num("convivientes_total"), men = num("menores_18");
      return (men >= 0 && men <= tot) ? "" : "Menores debe cumplir 0 ≤ x ≤ total.";
    },
    unico_sosten: function () { return radioVal("unico_sosten") ? "" : "Falta único sostén."; },
    tiene_beneficio: function () {
      if (!radioVal("tiene_beneficio")) return "Falta beneficio.";
      if (radioVal("tiene_beneficio") === "true" && !$("beneficio_quien").value.trim())
        return "Detalle quién recibe el beneficio (ver campo condicional).";
      return "";
    },
    beneficio_quien: function () {
      return (radioVal("tiene_beneficio") === "true" && !$("beneficio_quien").value.trim())
        ? "Detalle quién recibe el beneficio." : "";
    },
    tipo_vivienda: function () {
      if (!$("tipo_vivienda").value) return "Falta tipo de vivienda.";
      if ($("tipo_vivienda").value === "otra" && !$("tipo_vivienda_otra").value.trim())
        return "Detalle otra vivienda (ver campo condicional).";
      return "";
    },
    tipo_vivienda_otra: function () {
      return ($("tipo_vivienda").value === "otra" && !$("tipo_vivienda_otra").value.trim())
        ? "Detalle otra vivienda." : "";
    },
    ingreso_promedio_3m: function () {
      return Masks.parseMoney($("ingreso_promedio_3m").value) >= 0 ? "" : "Ingreso debe ser ≥ 0.";
    },
    caida_ingresos: function () { return $("caida_ingresos").value ? "" : "Falta caída de ingresos."; },
    gastos_fijos: function () {
      return checked("gastos_fijos").length > 3 ? "Gastos fijos: máx 3." : "";
    },
    urgencia: function () {
      return ["u_comida", "u_combustible_vs_comida", "u_depende_auto", "u_salud"].every(function (n) {
        return !isNaN(radioInt(n));
      }) ? "" : "Complete las 4 preguntas de urgencia.";
    },
    asistencia: function () {
      var as = checked("asistencia");
      if (as.length < 1 || as.length > 2) return "Asistencia: 1–2 opciones.";
      if (as.indexOf("otro") !== -1 && !$("asistencia_otro").value.trim())
        return "Detalle otra asistencia (ver campo condicional).";
      return "";
    },
    asistencia_otro: function () {
      return (checked("asistencia").indexOf("otro") !== -1 && !$("asistencia_otro").value.trim())
        ? "Detalle otra asistencia." : "";
    },
    entrevistado_aclaracion: function () {
      return $("entrevistado_aclaracion").value.trim() ? "" : "Falta aclaración entrevistado.";
    },
    fecha: function () { return $("fecha").value ? "" : "Falta fecha."; },
    entrevistador: function () { return $("entrevistador").value.trim() ? "" : "Falta entrevistador."; },
    lugar: function () { return $("lugar").value.trim() ? "" : "Falta lugar de relevamiento."; }
  };

  function runCheck(id) { return CHECKS[id] ? CHECKS[id]() : ""; }

  // Validación on-blur para todos los campos con chequeo.
  Object.keys(CHECKS).forEach(function (id) {
    if (id === "urgencia" || id === "gastos_fijos") return; // NOHTML grupos, se validan al cambiar
    var el = $(id);
    if (!el) return;
    el.addEventListener("blur", function () { fieldError(id, runCheck(id)); });
    el.addEventListener("input", function () {
      // Al tipear, limpiar si ahora es válido.
      if (!runCheck(id)) { fieldError(id, ""); if (id === "unico_sosten" || id === "tiene_beneficio") groupError(id, ""); }
    });
  });

function prefixFor(key) {
    if (key === "urgencia") return "Urgencia: ";
    if (key === "gastos_fijos") return "Gastos fijos: ";
    if (key === "asistencia") return "Asistencia: ";
    return "";
}

  // Valida todo; renderiza resumen con anclas a campos. Devuelve lista de errores {id,msg}.
  function validateAll() {
    var errs = [];
    Object.keys(CHECKS).forEach(function (id) {
      var msg = runCheck(id);
    if (msg) errs.push({ id: id, msg: prefixFor(id) + msg });
    if (id === "unico_sosten" || id === "tiene_beneficio") groupError(id, msg);
    else fieldError(id, msg);
    });
    // Resumen con anclas (sin innerHTML: DOM API, sin datos dinámicos).
    sumList.textContent = "";
    if (errs.length) {
      errs.forEach(function (e) {
        if (!e.msg) return;
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = e.id === "urgencia" ? "#sec4" : "#" + e.id;
        a.textContent = e.msg;
        a.addEventListener("click", function () {
          var t = $(e.id) || $("sec4");
          if (t) t.focus();
        });
        li.appendChild(a);
        sumList.appendChild(li);
      });
      sumEl.hidden = false;
    } else {
      sumEl.hidden = true;
    }
    setMsg(errEl, errs.length ? "Revisá los " + errs.length + " errores marcados." : "");
    return errs;
  }

  // ---- Condicionales "otro" ----
  function toggleCond(selectId, wrapId, inputId, matchVal) {
    var sel = $(selectId);
    function upd() {
      var show = sel.value === (matchVal || "otro");
      $(wrapId).hidden = !show;
      $(inputId).required = show;
      if (!show) { $(inputId).value = ""; fieldError(inputId, ""); }
    }
    sel.addEventListener("change", upd); upd();
  }
  toggleCond("tipo_servicio", "wrap_tipo_servicio_otro", "tipo_servicio_otro", "otro");
  toggleCond("tipo_vivienda", "wrap_tipo_vivienda_otra", "tipo_vivienda_otra", "otra");

  // Sí/No ahora con radios (mismo name, ids removidos del markup).
  form.querySelectorAll('input[name="tiene_beneficio"]').forEach(function (r) {
    r.addEventListener("change", function () {
      var show = radioVal("tiene_beneficio") === "true";
      $("wrap_beneficio_quien").hidden = !show;
      $("beneficio_quien").required = show;
      if (!show) { $("beneficio_quien").value = ""; fieldError("beneficio_quien", ""); }
      fieldError("tiene_beneficio", runCheck("tiene_beneficio"));
    });
  });

  ["unico_sosten", "tiene_beneficio"].forEach(function (n) {
    form.querySelectorAll('input[name="' + n + '"]').forEach(function (r) {
      r.addEventListener("change", function () {
        if (radioVal(n)) groupError(n, "");
      });
    });
  });

  function toggleAsistOtro() {
    var show = checked("asistencia").indexOf("otro") !== -1;
    $("wrap_asistencia_otro").hidden = !show;
    $("asistencia_otro").required = show;
    if (!show) { $("asistencia_otro").value = ""; fieldError("asistencia_otro", ""); }
  }

  // ---- §3 topes ----
  form.querySelectorAll('input[name="gastos_fijos"]').forEach(function (box) {
    box.addEventListener("change", function () {
      var n = checked("gastos_fijos").length;
      if (n > 3) {
        box.checked = false;
        setMsg($("gastosMsg"), "Máximo 3 gastos fijos.");
        fieldError("gastos_fijos", "Gastos fijos: máx 3.");
      } else {
        setMsg($("gastosMsg"), "");
        fieldError("gastos_fijos", "");
      }
    });
  });
  form.querySelectorAll('input[name="asistencia"]').forEach(function (box) {
    box.addEventListener("change", function () {
      var n = checked("asistencia").length;
      if (n > 2) {
        box.checked = false;
        setMsg($("asistMsg"), "Máximo 2 asistencias.");
        fieldError("asistencia", "Asistencia: 1–2 opciones.");
      } else {
        setMsg($("asistMsg"), "");
        if (n >= 1) fieldError("asistencia", "");
      }
      toggleAsistOtro();
    });
  });
  // Deudas: `ninguna` excluyente.
  form.querySelectorAll('input[name="deudas"]').forEach(function (box) {
    box.addEventListener("change", function () {
      var boxes = Array.prototype.slice.call(form.querySelectorAll('input[name="deudas"]'));
      if (box.value === "ninguna" && box.checked) {
        boxes.forEach(function (b) { if (b !== box) b.checked = false; });
      } else if (box.checked) {
        boxes.forEach(function (b) { if (b.value === "ninguna") b.checked = false; });
      }
    });
  });

  // ---- §4 score auto ----
  var URG = ["u_comida", "u_combustible_vs_comida", "u_depende_auto", "u_salud"];
  function nivelDe(total) {
    if (total >= 9) return "critico";
    if (total >= 5) return "medio";
    return "bajo";
  }
  function nivelLabel(n) { return n === "critico" ? "Crítico" : n === "medio" ? "Medio" : "Bajo"; }
  function calcScore() {
    // radioInt ahora devuelve el valor seleccionado (radioVal para sí/no),
    // urgencia usa valores 1..3 parseados.
    var vals = URG.map(function (n) {
      var el = form.querySelector('input[name="' + n + '"]:checked');
      return el ? parseInt(el.value, 10) : NaN;
    });
    if (vals.some(isNaN)) { $("scoreTotal").textContent = "—"; $("scoreNivel").textContent = "—"; return null; }
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    var nivel = nivelDe(total); // rango 4–12 garantizado por inputs 1..3
    $("scoreTotal").textContent = String(total);
    $("scoreNivel").textContent = nivelLabel(nivel);
    return { puntaje_total: total, nivel: nivel };
  }
  URG.forEach(function (n) {
    form.querySelectorAll('input[name="' + n + '"]').forEach(function (r) {
      r.addEventListener("change", function () {
        calcScore();
        fieldError("urgencia", runCheck("urgencia"));
      });
    });
  });

  // ---- API Personas por DNI ----
  // ADVERTENCIA: PERSONAS_API_KEY nunca en JS público. Usar proxy server-side.
  function personasURL(dni) {
    var base = (window.APP_CONFIG && window.APP_CONFIG.PERSONAS_API_URL) || "";
    if (!base) return "";
    if (base.indexOf("{dni}") !== -1) return base.replace("{dni}", encodeURIComponent(dni));
    if (base.charAt(base.length - 1) === "/") return base + encodeURIComponent(dni);
    return base + (base.indexOf("?") === -1 ? "?dni=" : "&dni=") + encodeURIComponent(dni);
  }
  function pick(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (obj && obj[keys[i]] !== undefined && obj[keys[i]] !== "") return obj[keys[i]];
    }
    return "";
  }
  function setBadge(on) { $("badgeOrigen").hidden = !on; originPersonas = on; }

  $("btnPersonas").addEventListener("click", async function () {
    var dni = $("dni").value.trim();
    setMsg($("personasNotice"), ""); setMsg(errEl, "");
    if (!/^\d{7,8}$/.test(dni)) { setMsg(errEl, "DNI inválido: 7–8 dígitos."); return; }
    var url = personasURL(dni);
    if (!url) { setMsg($("personasNotice"), "Complete los datos a mano. El padrón no está configurado."); return; }
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 8000);
    try {
      var headers = {};
      var key = window.APP_CONFIG && window.APP_CONFIG.PERSONAS_API_KEY;
      if (key) headers.Authorization = "Bearer " + key; // clave nunca en log
      var res = await fetch(url, { headers: headers, signal: ctrl.signal });
      if (!res.ok) throw new Error("bad status");
      var data = await res.json();
      var rec = (data && (data.persona || data.data || data.result || data)) || {};
      var got = false;
      var v = pick(rec, ["apellido_nombre", "nombre", "fullname", "full_name", "name"]);
      if (v) { $("apellido_nombre").value = v; fieldError("apellido_nombre", ""); got = true; }
      v = pick(rec, ["edad", "age"]); if (v) { $("edad").value = v; got = true; }
      v = pick(rec, ["localidad", "city"]); if (v) { $("localidad").value = v; fieldError("localidad", ""); got = true; }
      v = pick(rec, ["barrio", "neighborhood"]); if (v) { $("barrio").value = v; fieldError("barrio", ""); got = true; }
      setBadge(got);
      setMsg($("personasNotice"), got ? "Los datos se completaron. Revise y edite si es necesario."
        : "No hay datos en el padrón. Complete los datos a mano.");
    } catch (_) {
      setBadge(false);
      setMsg($("personasNotice"), "El servicio no está disponible. Complete los datos a mano.");
    } finally { clearTimeout(timer); }
  });

  // ---- DNI único: pre-chequeo + botón Editar ----
  async function findByDni(dni) {
    if (!/^\d{7,8}$/.test(dni)) return null;
    var dniesa = String(dni).replace(/"/g, '\\"');
    try { return await window.pb.collection("relevamiento").getFirstListItem('dni="' + dniesa + '"'); }
    catch (_) { return null; }
  }
  function showDup(rec) {
    $("dupWarn").hidden = false;
    $("editExisting").href = "cargar.html?id=" + rec.id;
  }
  function hideDup() { $("dupWarn").hidden = true; }
  $("dni").addEventListener("blur", async function () {
    hideDup();
    var dni = $("dni").value.trim();
    if (!/^\d{7,8}$/.test(dni)) return;
    var rec = await findByDni(dni);
    if (rec && rec.id !== editingId) showDup(rec);
  });

  // ---- Payload ----
  function num(id) {
    var v = $(id).value.trim();
    return v === "" ? NaN : Number(v);
  }
  function collect(score) {
    var deudas = checked("deudas");
    if (deudas.indexOf("ninguna") !== -1) deudas = ["ninguna"]; // excluyente
    return {
      apellido_nombre: $("apellido_nombre").value.trim(),
      dni: $("dni").value.trim(),
      tel_whatsapp: $("tel_whatsapp").value.trim(),
      edad: Number($("edad").value),
      localidad: $("localidad").value.trim(),
      barrio: $("barrio").value.trim(),
      tipo_servicio: $("tipo_servicio").value,
      tipo_servicio_otro: $("tipo_servicio_otro").value.trim(),
      vehiculo: $("vehiculo").value,
      antiguedad_anios: Number($("antiguedad_anios").value),
      convivientes_total: Number($("convivientes_total").value),
      menores_18: Number($("menores_18").value),
      unico_sosten: radioVal("unico_sosten") === "true",
      tiene_beneficio: radioVal("tiene_beneficio") === "true",
      beneficio_quien: $("beneficio_quien").value.trim(),
      tipo_vivienda: $("tipo_vivienda").value,
      tipo_vivienda_otra: $("tipo_vivienda_otra").value.trim(),
      ingreso_promedio_3m: Masks.parseMoney($("ingreso_promedio_3m").value), // valor puro, sin puntos
      caida_ingresos: $("caida_ingresos").value,
      gastos_fijos: checked("gastos_fijos"),
      deudas: deudas,
      u_comida: (function () { var e = form.querySelector('input[name="u_comida"]:checked'); return e ? parseInt(e.value, 10) : NaN; })(),
      u_combustible_vs_comida: (function () { var e = form.querySelector('input[name="u_combustible_vs_comida"]:checked'); return e ? parseInt(e.value, 10) : NaN; })(),
      u_depende_auto: (function () { var e = form.querySelector('input[name="u_depende_auto"]:checked'); return e ? parseInt(e.value, 10) : NaN; })(),
      u_salud: (function () { var e = form.querySelector('input[name="u_salud"]:checked'); return e ? parseInt(e.value, 10) : NaN; })(),
      puntaje_total: score.puntaje_total,
      nivel: score.nivel,
      asistencia: checked("asistencia"),
      asistencia_otro: $("asistencia_otro").value.trim(),
      entrevistado_aclaracion: $("entrevistado_aclaracion").value.trim(),
      fecha: $("fecha").value,
      entrevistador: $("entrevistador").value.trim(),
      lugar: $("lugar").value.trim(),
      origen_personas: originPersonas
    };
  }

  function isDupError(e) {
    var s = "";
    try { s = JSON.stringify(e && (e.data || e.response || e.message || e)); } catch (_) { s = String(e); }
    return /unique|exists|duplicate|already/i.test(s);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setMsg(errEl, ""); setMsg(okEl, ""); hideDup();
    var score = calcScore(); // revalidación pre-envío, no confía solo en display
    var errs = validateAll();
    if (errs.length) {
      // anclar arriba del formulario para que se lea el resumen
      sumEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    var payload = collect(score);
    try {
      var dup = await findByDni(payload.dni);
      if (dup && dup.id !== editingId) { showDup(dup); setMsg(errEl, "DNI ya registrado. Use Editar existente."); return; }
      if (editingId) {
        await window.pb.collection("relevamiento").update(editingId, payload);
        setMsg(okEl, "Ficha actualizada.");
      } else {
        var rec = await window.pb.collection("relevamiento").create(payload);
        editingId = rec.id;
        $("btnSave").textContent = "Actualizar ficha";
        setMsg(okEl, "Ficha guardada.");
      }
    } catch (ex) {
      if (isDupError(ex)) {
        var again = await findByDni(payload.dni);
        if (again) showDup(again);
        setMsg(errEl, "DNI ya registrado. Use Editar existente.");
      } else {
        setMsg(errEl, "No se pudo guardar. Reintente."); // genérico, sin filtrar datos
      }
    }
  });

  // ---- Modo edición (?id=) ----
  async function loadForEdit(id) {
    try {
      var r = await window.pb.collection("relevamiento").getOne(id);
      ["apellido_nombre", "dni", "tel_whatsapp", "edad", "localidad", "barrio",
        "tipo_servicio_otro", "antiguedad_anios", "beneficio_quien", "tipo_vivienda_otra",
        "ingreso_promedio_3m", "asistencia_otro", "entrevistado_aclaracion",
        "fecha", "entrevistador", "lugar"].forEach(function (k) {
        if (r[k] !== undefined) {
          $(k).value = r[k];
          // Dispara máscara para formatear (miles, dígitos).
          $(k).dispatchEvent(new Event("input", { bubbles: true }));
          $(k).dispatchEvent(new Event("blur", { bubbles: false }));
        }
      });
      ["tipo_servicio", "tipo_vivienda", "caida_ingresos"].forEach(function (k) {
        var v = r[k]; if (v !== undefined) $(k).value = v;
      });
      // Sí/No economía hoy con radios.
      ["unico_sosten", "tiene_beneficio"].forEach(function (n) {
        var b = form.querySelector('input[name="' + n + '"][value="' + (r[n] === true ? "true" : "false") + '"]');
        if (b) b.checked = true;
      });
      form.querySelectorAll('input[name="tiene_beneficio"]:checked').forEach(function (b) {
        b.dispatchEvent(new Event("change", { bubbles: false }));
      });
      ["tipo_servicio", "tipo_vivienda"].forEach(function (k) {
        $(k).dispatchEvent(new Event("change"));
      });
      ["menores_18", "convivientes_total"].forEach(function (k) {
        if (r[k] !== undefined) {
          $(k).value = r[k];
          $(k).dispatchEvent(new Event("input", { bubbles: true }));
          $(k).dispatchEvent(new Event("blur", { bubbles: false }));
        }
      });
      ["gastos_fijos", "deudas", "asistencia"].forEach(function (n) {
        (r[n] || []).forEach(function (v) {
          var b = form.querySelector('input[name="' + n + '"][value="' + v + '"]');
          if (b) b.checked = true;
        });
      });
      toggleAsistOtro();
      URG.forEach(function (n) {
        if (r[n] !== undefined) {
          var b = form.querySelector('input[name="' + n + '"][value="' + r[n] + '"]');
          if (b) b.checked = true;
        }
      });
      calcScore();
      setBadge(!!r.origen_personas);
      $("btnSave").textContent = "Actualizar ficha";
    } catch (_) {
      setMsg(errEl, "No se pudo cargar la ficha. Reintente."); // genérico
    }
  }
  if (editingId) loadForEdit(editingId);
})();
