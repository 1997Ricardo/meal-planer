/**
 * Gestión del estado global de la aplicación y persistencia local (LocalStorage)
 */
const State = {
    data: {
      menus: [],
      recipes: [],
      shoppingList: [],
      categories: [],
      currentDate: new Date().toISOString().split('T')[0]
    },
  
    /**
     * Guarda una copia en localStorage para velocidad y soporte offline
     */
    saveToLocalStorage() {
      try {
        localStorage.setItem("meal_planner_state", JSON.stringify(this.data));
      } catch (e) {
        console.error("No se pudo guardar en localStorage", e);
      }
    },
  
    /**
     * Carga el estado desde localStorage si existe
     */
    loadFromLocalStorage() {
      try {
        var saved = localStorage.getItem("meal_planner_state");
        if (saved) {
          var parsed = JSON.parse(saved);
          this.data = Object.assign({}, this.data, parsed);
        }
      } catch (e) {
        console.error("No se pudo leer localStorage", e);
      }
    }
  };