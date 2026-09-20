/**
 * Capa de comunicación con la API de Google Apps Script
 */
const API = {
    /**
     * Petición GET genérica
     */
    async get(action) {
      if (CONFIG.API_URL.includes("AQUÍ_IRÁ")) {
        console.warn("API_URL no configurada todavía. Usando modo simulación/vacío.");
        return { success: false, data: [], message: "URL de API no configurada" };
      }
  
      try {
        var response = await fetch(`${CONFIG.API_URL}?action=${action}`);
        var result = await response.json();
        return result;
      } catch (error) {
        console.error("Error en GET API:", error);
        return { success: false, data: null, message: error.toString() };
      }
    },
  
    /**
     * Petición POST genérica
     */
    async post(action, data) {
      if (CONFIG.API_URL.includes("AQUÍ_IRÁ")) {
        console.warn("API_URL no configurada todavía.");
        return { success: false, message: "URL de API no configurada" };
      }
  
      try {
        var response = await fetch(CONFIG.API_URL, {
          method: "POST",
          body: JSON.stringify({ action: action, data: data }),
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          }
        });
        var result = await response.json();
        return result;
      } catch (error) {
        console.error("Error en POST API:", error);
        return { success: false, message: error.toString() };
      }
    }
  };