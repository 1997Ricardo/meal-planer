/**
 * Utilidades generales (Fechas, formato, etc.)
 */
const Utils = {
    /**
     * Obtiene la fecha actual en formato YYYY-MM-DD (zona horaria España)
     */
    getTodayFormatted() {
      return new Date().toISOString().split('T')[0];
    },
  
    /**
     * Formatea una fecha ISO (YYYY-MM-DD) a formato amigable europeo (DD/MM/YYYY)
     */
    formatDateDisplay(dateString) {
      if (!dateString) return "";
      var partes = dateString.split("-");
      if (partes.length !== 3) return dateString;
      return partes[2] + "/" + partes[1] + "/" + partes[0];
    },
  
    /**
     * Muestra notificaciones flotantes sencillas en la UI
     */
    showToast(message, type = "success") {
      var toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(function() {
        toast.classList.add("show");
      }, 100);
  
      setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }
  };