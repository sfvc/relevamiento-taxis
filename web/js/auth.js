/* global PocketBase */
(function () {
  "use strict";

  function getPb() {
    var url = (window.APP_CONFIG && window.APP_CONFIG.PB_URL) || "";
    return new PocketBase(url);
  }

  // Guarda instancia global para resto de páginas.
  window.pb = getPb();

  function isAuth() {
    return !!(window.pb.authStore && window.pb.authStore.isValid);
  }

  // Guard: usar en cargar/tabla/dashboard. Sin sesión → login.
  function requireAuth() {
    if (!isAuth()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  // Login email/password. Error genérico (REQ-AUTH-2).
  async function login(email, password) {
    await window.pb.collection("users").authWithPassword(email, password);
  }

  function logout() {
    if (window.pb.authStore) window.pb.authStore.clear();
    window.location.href = "login.html";
  }

  // Si ya hay sesión y estoy en login → ir a cargar.
  function redirectIfAuth() {
    if (isAuth()) window.location.href = "cargar.html";
  }

  window.Auth = { isAuth, requireAuth, login, logout, redirectIfAuth };
})();
