/**
 * =================================================================
 * MEAL PLANNER - ARCHIVO PRINCIPAL JS (V2 - Con Añadir Recetas)
 * =================================================================
 */

// Sistema de Navegación entre Vistas
const AppNav = {
    switchView(viewName) {
      var views = document.querySelectorAll(".view");
      views.forEach(function(v) {
        v.classList.remove("active");
      });
  
      var targetView = document.getElementById(`view-${viewName}`);
      if (targetView) {
        targetView.classList.add("active");
      }
  
      var navItems = document.querySelectorAll(".nav-item");
      navItems.forEach(function(item) {
        item.classList.remove("active");
        if (item.getAttribute("data-target") === viewName) {
          item.classList.add("active");
        }
      });
  
      var mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    }
  };
  
  // Sistema de Gestión de Tema (Dark / Light Mode)
  const AppTheme = {
    init() {
      var themeToggleBtn = document.getElementById("theme-toggle");
      var currentTheme = localStorage.getItem("meal_planner_theme") || "light";
      
      if (currentTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
      }
  
      if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
          var isDark = document.documentElement.getAttribute("data-theme") === "dark";
          if (isDark) {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("meal_planner_theme", "light");
            themeToggleBtn.textContent = "🌙";
          } else {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("meal_planner_theme", "dark");
            themeToggleBtn.textContent = "☀️";
          }
        });
      }
    }
  };
  
  // Gestor de Datos y Renderizado del Dashboard
  const AppData = {
    async loadInitialData() {
      var menusListEl = document.getElementById("today-meals-list");
      
      if (CONFIG.API_URL.includes("AQUÍ_IRÁ")) {
        if (menusListEl) menusListEl.innerHTML = `<div class="card">⚠️ Configura la URL de Apps Script en config.js</div>`;
        return;
      }
  
      try {
        var response = await API.get("getMenus");
        
        if (response && response.success && response.data) {
          State.data.menus = response.data;
          State.saveToLocalStorage();
          this.renderDashboardMeals();
        } else {
          State.loadFromLocalStorage();
          if (State.data.menus.length > 0) {
            this.renderDashboardMeals();
            Utils.showToast("Modo offline: usando datos guardados", "error");
          } else {
            if (menusListEl) menusListEl.innerHTML = `<div class="card">No hay menús registrados para hoy.</div>`;
          }
        }
      } catch (e) {
        console.error("Error cargando datos:", e);
        if (menusListEl) menusListEl.innerHTML = `<div class="card">Error de conexión con Google Sheets.</div>`;
      }
    },
  
    renderDashboardMeals() {
      var menusListEl = document.getElementById("today-meals-list");
      if (!menusListEl) return;
  
      var todayISO = Utils.getTodayFormatted();
      var todayMenus = State.data.menus.filter(function(menu) {
        if (!menu.fecha) return false;
        var menuDate = menu.fecha.toString().split("T")[0];
        return menuDate === todayISO;
      });
  
      if (todayMenus.length === 0) {
        todayMenus = State.data.menus.slice(0, 3);
      }
  
      if (todayMenus.length === 0) {
        menusListEl.innerHTML = `<div class="card">No hay comidas planificadas para hoy. ¡Añade una!</div>`;
        return;
      }
  
      var html = "";
      todayMenus.forEach(function(menu) {
        html += `
          <div class="card meal-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: var(--primary); font-size: 0.85rem; text-transform: uppercase;">${menu.tipoComida || 'Comida'}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${menu.usuario || 'Familiar'}</span>
            </div>
            <h4 style="font-size: 1rem; margin-bottom: 4px;">${menu.nombre || 'Sin nombre'}</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">${menu.descripcion || ''}</p>
            ${menu.ingredientes ? `<div style="font-size: 0.8rem; background: var(--bg-color); padding: 6px 10px; border-radius: 6px;"><strong>Ingredientes:</strong> ${menu.ingredientes}</div>` : ''}
          </div>
        `;
      });
  
      menusListEl.innerHTML = html;
    }
  };
  
  // Módulo de Gestión de Menús (Crear / Modal)
  const AppMenus = {
    openAddModal() {
      var modal = document.getElementById("menu-modal");
      var dateInput = document.getElementById("modal-fecha");
      if (dateInput) {
        dateInput.value = Utils.getTodayFormatted();
      }
      if (modal) modal.style.display = "flex";
    },
  
    closeModal() {
      var modal = document.getElementById("menu-modal");
      if (modal) modal.style.display = "none";
    },
  
    async saveMenu(event) {
      event.preventDefault();
  
      var fecha = document.getElementById("modal-fecha").value;
      var tipoComida = document.getElementById("modal-tipo").value;
      var nombre = document.getElementById("modal-nombre").value;
      var ingredientes = document.getElementById("modal-ingredientes").value;
      var notas = document.getElementById("modal-notas").value;
  
      var newMenu = {
        id: "m_" + new Date().getTime(),
        fecha: fecha,
        tipoComida: tipoComida,
        nombre: nombre,
        descripcion: "",
        ingredientes: ingredientes,
        cantidades: "",
        notas: notas,
        usuario: "Familiar"
      };
  
      State.data.menus.push(newMenu);
      State.saveToLocalStorage();
      
      this.closeModal();
      AppWeek.renderWeeklyView();
      AppData.renderDashboardMeals();
      Utils.showToast("Menú guardado con éxito");
  
      var res = await API.post("saveMenu", newMenu);
      if (res && res.success) {
        console.log("Menú sincronizado con Google Sheets");
      } else {
        Utils.showToast("Guardado localmente", "error");
      }
    }
  };
  
  // Módulo de Gestión del Menú Semanal (Incluye Copiar Semana)
  const AppWeek = {
    offsetWeeks: 0,
  
    init() {
      this.renderWeeklyView();
    },
  
    changeWeek(direction) {
      this.offsetWeeks += direction;
      this.renderWeeklyView();
    },
  
    goToCurrentWeek() {
      this.offsetWeeks = 0;
      this.renderWeeklyView();
    },
  
    getDaysOfCurrentWeek() {
      var now = new Date();
      var dayOfWeek = now.getDay();
      var diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      
      var monday = new Date(now.setDate(diffToMonday + (this.offsetWeeks * 7)));
      var days = [];
      var nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  
      for (var i = 0; i < 7; i++) {
        var d = new Date(monday);
        d.setDate(monday.getDate() + i);
        
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = ("0" + d.getDate()).slice(-2);
        var isoDate = `${year}-${month}-${day}`;
  
        days.push({
          nombre: nombresDias[i],
          fechaIso: isoDate,
          fechaDisplay: `${day}/${month}/${year}`
        });
      }
  
      return days;
    },
  
    renderWeeklyView() {
      var container = document.getElementById("weekly-menu-container");
      var labelWeek = document.getElementById("current-week-label");
      if (!container) return;
  
      var days = this.getDaysOfCurrentWeek();
      
      if (labelWeek && days.length > 0) {
        labelWeek.textContent = `${days[0].fechaDisplay} - ${days[6].fechaDisplay}`;
      }
  
      var menus = State.data.menus || [];
      var html = "";
  
      days.forEach(function(day) {
        var dayMenus = menus.filter(function(m) {
          if (!m.fecha) return false;
          return m.fecha.toString().split("T")[0] === day.fechaIso;
        });
  
        html += `
          <div class="day-card">
            <div class="day-header">
              <h4>${day.nombre}</h4>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${day.fechaDisplay}</span>
            </div>
            <div class="day-meals-summary">
        `;
  
        if (dayMenus.length === 0) {
          html += `<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 4px;">Sin menús planificados.</div>`;
        } else {
          dayMenus.forEach(function(m) {
            html += `
              <div class="meal-slot-item">
                <span class="meal-slot-type">${m.tipoComida || 'Comida'}</span>
                <span class="meal-slot-desc"><strong>${m.nombre}</strong> ${m.descripcion ? '— ' + m.descripcion : ''}</span>
              </div>
            `;
          });
        }
  
        html += `
            </div>
          </div>
        `;
      });
  
      container.innerHTML = html;
    },
  
    async copyPreviousWeek() {
      var daysCurrent = this.getDaysOfCurrentWeek();
      var mondayCurrentIso = daysCurrent[0].fechaIso;
  
      var dCurrent = new Date(mondayCurrentIso);
      dCurrent.setDate(dCurrent.getDate() - 7);
      var year = dCurrent.getFullYear();
      var month = String(dCurrent.getMonth() + 1).padStart(2, '0');
      var day = ("0" + dCurrent.getDate()).slice(-2);
      var mondayPrevIso = `${year}-${month}-${day}`;
  
      if (!confirm(`¿Quieres copiar todos los menús de la semana del ${mondayPrevIso} a esta semana actual?`)) {
        return;
      }
  
      Utils.showToast("Copiando semana anterior...");
  
      var res = await API.post("copyWeek", {
        origenInicio: mondayPrevIso,
        destinoInicio: mondayCurrentIso
      });
  
      if (res && res.success) {
        Utils.showToast("¡Semana copiada con éxito!");
        await AppData.loadInitialData();
        this.renderWeeklyView();
      } else {
        Utils.showToast("No se encontraron menús en la semana anterior", "error");
      }
    }
  };
  
  // Módulo de Gestión de Recetas (Incluye Modal de Añadir)
  const AppRecipes = {
    async init() {
      await this.loadRecipes();
    },
  
    openAddModal() {
      var modal = document.getElementById("recipe-modal");
      if (modal) modal.style.display = "flex";
    },
  
    closeModal() {
      var modal = document.getElementById("recipe-modal");
      if (modal) modal.style.display = "none";
    },
  
    async saveRecipe(event) {
      event.preventDefault();
  
      var nombre = document.getElementById("rec-nombre").value;
      var categoria = document.getElementById("rec-categoria").value;
      var tiempo = document.getElementById("rec-tiempo").value;
      var personas = document.getElementById("rec-personas").value;
      var ingredientes = document.getElementById("rec-ingredientes").value;
      var instrucciones = document.getElementById("rec-instrucciones").value;
  
      var newRecipe = {
        id: "r_" + new Date().getTime(),
        nombre: nombre,
        categoria: categoria,
        tiempo: tiempo,
        personas: personas,
        ingredientes: ingredientes,
        instrucciones: instrucciones,
        favorito: false
      };
  
      State.data.recipes.push(newRecipe);
      State.saveToLocalStorage();
      
      this.closeModal();
      this.renderRecipes(State.data.recipes);
      Utils.showToast("Receta guardada con éxito");
  
      var res = await API.post("saveRecipe", newRecipe);
      if (res && res.success) {
        console.log("Receta sincronizada con Google Sheets");
      } else {
        Utils.showToast("Guardada localmente", "error");
      }
    },
  
    async loadRecipes() {
      var container = document.getElementById("recipes-container");
      if (!container) return;
  
      try {
        var response = await API.get("getRecipes");
        if (response && response.success && response.data) {
          State.data.recipes = response.data;
          State.saveToLocalStorage();
          this.renderRecipes(State.data.recipes);
        } else {
          this.renderRecipes(State.data.recipes || []);
        }
      } catch (e) {
        console.error("Error cargando recetas:", e);
        this.renderRecipes(State.data.recipes || []);
      }
    },
  
    renderRecipes(recipesArray) {
      var container = document.getElementById("recipes-container");
      var countLabel = document.getElementById("recipes-count");
      if (!container) return;
  
      if (countLabel) countLabel.textContent = `${recipesArray.length} recetas`;
  
      if (recipesArray.length === 0) {
        container.innerHTML = `<div class="card">No hay recetas guardadas en el recetario.</div>`;
        return;
      }
  
      var html = "";
      recipesArray.forEach(function(r) {
        var isFav = r.favorito === true || r.favorito === "TRUE" || r.favorito === "true";
        html += `
          <div class="recipe-card">
            <div class="recipe-header">
              <span class="recipe-title">${r.nombre || 'Sin nombre'}</span>
              <span class="recipe-badge-fav">${isFav ? '⭐' : '☆'}</span>
            </div>
            <div class="recipe-meta">
              <span>🏷️ ${r.categoria || 'General'}</span>
              <span>⏱️ ${r.tiempo || '--'}</span>
              <span>👤 ${r.personas || 1} pers.</span>
            </div>
            ${r.ingredientes ? `<div class="recipe-ingredients-box"><strong>Ingredientes:</strong> ${r.ingredientes}</div>` : ''}
            ${r.instrucciones ? `<div style="font-size: 0.8rem; color: var(--text-muted);"><strong>Preparación:</strong> ${r.instrucciones}</div>` : ''}
          </div>
        `;
      });
  
      container.innerHTML = html;
    },
  
    filterRecipes(query) {
      var q = query.toLowerCase().trim();
      var recipes = State.data.recipes || [];
      
      if (!q) {
        this.renderRecipes(recipes);
        return;
      }
  
      var filtered = recipes.filter(function(r) {
        var nombre = (r.nombre || "").toLowerCase();
        var ingredientes = (r.ingredientes || "").toLowerCase();
        var categoria = (r.categoria || "").toLowerCase();
        return nombre.includes(q) || ingredientes.includes(q) || categoria.includes(q);
      });
  
      this.renderRecipes(filtered);
    }
  };
  
  // Módulo de Gestión de la Lista de la Compra
  const AppShopping = {
    async init() {
      await this.loadShoppingList();
    },
  
    async loadShoppingList() {
      var container = document.getElementById("shopping-container");
      if (!container) return;
  
      try {
        var response = await API.get("getShoppingList");
        if (response && response.success && response.data) {
          State.data.shoppingList = response.data;
          State.saveToLocalStorage();
          this.renderShoppingList(State.data.shoppingList);
        } else {
          this.renderShoppingList(State.data.shoppingList || []);
        }
      } catch (e) {
        console.error("Error cargando lista de compra:", e);
        this.renderShoppingList(State.data.shoppingList || []);
      }
    },
  
    renderShoppingList(itemsArray) {
      var container = document.getElementById("shopping-container");
      if (!container) return;
  
      if (itemsArray.length === 0) {
        container.innerHTML = `
          <div class="card" style="text-align: center; padding: 24px;">
            <p style="margin-bottom: 12px; color: var(--text-muted);">Tu lista de la compra está vacía.</p>
            <button class="btn-action" style="margin: 0 auto;" onclick="AppShopping.addSampleItem()">📥 Añadir compra de prueba</button>
          </div>
        `;
        return;
      }
  
      var grouped = {};
      itemsArray.forEach(function(item) {
        var cat = item.categoría || item.categoria || "Otros";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });
  
      var html = "";
      for (var cat in grouped) {
        html += `
          <div class="shopping-category-card">
            <div class="shopping-category-title">${cat}</div>
            <div class="shopping-items-list">
        `;
  
        grouped[cat].forEach(function(item) {
          html += `
            <div class="shopping-item-row">
              <label class="shopping-item-label">
                <input type="checkbox" onchange="AppShopping.toggleItem('${item.id}')">
                <span>${item.producto || 'Producto'}</span>
              </label>
              ${item.cantidad ? `<span class="shopping-item-qty">${item.cantidad}</span>` : ''}
            </div>
          `;
        });
  
        html += `
            </div>
          </div>
        `;
      }
  
      container.innerHTML = html;
    },
  
    async toggleItem(id) {
      State.data.shoppingList = State.data.shoppingList.filter(function(item) {
        return item.id !== id;
      });
      State.saveToLocalStorage();
      this.renderShoppingList(State.data.shoppingList);
      Utils.showToast("¡Comprado y eliminado!");
  
      await API.post("deleteShoppingItem", { id: id });
    },
  
    async addSampleItem() {
      var sampleData = {
        id: "sc_" + new Date().getTime(),
        semana: "2026-W38",
        categoria: "Verdura",
        producto: "Aguacates frescos",
        cantidad: "1 malla",
        comprado: false,
        notas: "Para los desayunos"
      };
  
      var container = document.getElementById("shopping-container");
      if (container) container.innerHTML = `<div class="card skeleton">Añadiendo producto...</div>`;
  
      var res = await API.post("saveShoppingItem", sampleData);
      if (res && res.success) {
        Utils.showToast("Producto añadido con éxito");
        await this.loadShoppingList();
      } else {
        Utils.showToast("Error al añadir producto", "error");
        await this.loadShoppingList();
      }
    },
  
    openAddModal() {
      var prodName = prompt("¿Qué producto quieres añadir a la compra?");
      if (!prodName) return;
      var prodQty = prompt("¿Qué cantidad o notas?", "1 unidad");
      
      var newItem = {
        id: "sc_" + new Date().getTime(),
        semana: "2026-W38",
        categoria: "Otros",
        producto: prodName,
        cantidad: prodQty || "",
        comprado: false,
        notas: ""
      };
  
      State.data.shoppingList.push(newItem);
      State.saveToLocalStorage();
      this.renderShoppingList(State.data.shoppingList);
  
      API.post("saveShoppingItem", newItem).then(function(res) {
        if (res && res.success) {
          Utils.showToast("Guardado en Google Sheets");
        }
      });
    }
  };
  
  // Inicialización Global Unificada
  document.addEventListener("DOMContentLoaded", async function() {
    console.log(`${CONFIG.APP_NAME} v${CONFIG.VERSION} iniciándose...`);
  
    AppTheme.init();
  
    var todayISO = Utils.getTodayFormatted();
    var badgeDate = document.getElementById("current-date-badge");
    var displayDateText = Utils.formatDateDisplay(todayISO);
    if (badgeDate) badgeDate.textContent = displayDateText;
  
    var todayDateSub = document.getElementById("today-formatted-date");
    if (todayDateSub) todayDateSub.textContent = displayDateText;
  
    await AppData.loadInitialData();
    AppWeek.init();
    await AppRecipes.init();
    await AppShopping.init();
  });