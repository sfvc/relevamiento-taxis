/*
 * Máscaras de input vanilla (sin dependencias). Se activan por data-mask:
 *   data-mask="dni"      — solo dígitos, máx 8
 *   data-mask="digits"   — solo dígitos (con máx opcional data-max="3")
 *   data-mask="phone"    — dígitos, guiones, espacios y "+"
 *   data-mask="money"    — miles con "." en pantalla; valor puro via parseMoney()
 */
(function () {
  "use strict";

  function digits(v) {
    return String(v).replace(/\D+/g, "");
  }

  function apply(el) {
    var kind = el.getAttribute("data-mask");
    if (!kind) return;
    var max = parseInt(el.getAttribute("data-max") || "0", 10);
    var raw = el.value;
    var out = raw;
    if (kind === "dni") {
      out = digits(raw).slice(0, 8);
    } else if (kind === "digits") {
      out = digits(raw).slice(0, max > 0 ? max : 4);
    } else if (kind === "phone") {
      // Permite + inicial, dígitos, espacios y guiones.
      out = raw.replace(/[^\d+\-\s]/g, "").replace(/(?!^)\+/g, "").slice(0, 20);
    } else if (kind === "money") {
      var d = digits(raw).slice(0, 12);
      // Separa miles con punto (1.234.567)
      out = d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    if (out !== raw) {
      var caret = el.selectionStart;
      var diff = raw.length - out.length;
      el.value = out;
      try { el.setSelectionRange(Math.max(0, caret - diff), Math.max(0, caret - diff)); } catch (_) { /* type=number */ }
    } else {
      el.value = out;
    }
  }

  // Valor puro para enviar a PocketBase (guarda número, sin puntos).
  function parseMoney(v) {
    var d = digits(v);
    return d === "" ? NaN : Number(d);
  }

  function init(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-mask]").forEach(function (el) {
      if (el.dataset.maskBound) return;
      el.dataset.maskBound = "1";
      // Si type=number, no permite formatear; forzar texto + inputmode numérico.
      if (el.getAttribute("type") === "number") el.setAttribute("type", "text");
      el.setAttribute("inputmode", el.getAttribute("data-mask") === "phone" ? "tel" : "numeric");
      el.addEventListener("input", function () { apply(el); });
      el.addEventListener("blur", function () { apply(el); });
    });
  }

  window.Masks = { init: init, parseMoney: parseMoney, apply: apply };
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", function () { init(); });
})();
