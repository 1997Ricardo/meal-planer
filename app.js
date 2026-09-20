/**
 * =================================================================
 * MEAL PLANNER - ARCHIVO PRINCIPAL JS (V6 - Multi-Semana Filtrable)
 * =================================================================
 */

const AppNav = {
    switchView(viewName) {
      var views = document.querySelectorAll(".view");
      views.forEach(function(v) { v.classList.remove("active"); });
      var targetView = document.getElementById(`view-${viewName}`);
      if (targetView) targetView.classList.add("active");
      var navItems = document.querySelectorAll(".nav-item");
      navItems.forEach(function(item) {
        item.classList.remove("active");
        if (item.getAttribute("data-target") === viewName) item.classList.add("active");
      });
      var mainContent = document.getElementById("main-content");
      if (mainContent) mainContent.scrollTop = 0;
    }
  };
  
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
          AppWeek.init();
          this.renderDashboardMeals();
        } else {
          State.loadFromLocalStorage();
          AppWeek.init();
          this.renderDashboardMeals();
        }
      } catch (e) {
        console.error("Error cargando datos:", e);
        State.loadFromLocalStorage();
        AppWeek.init();
        this.renderDashboardMeals();
      }
    },
  
    renderDashboardMeals() {
      var menusListEl = document.getElementById("today-meals-list");
      if (!menusListEl) return;
      var menus = State.data.menus || [];
      if (menus.length === 0) {
        menusListEl.innerHTML = `<div class="card">No hay menús registrados. Usa "✍️ Texto Menú" para importar tu semana.</div>`;
        return;
      }
      
      // Filtrar por la semana activa actual
      var activeWeek = AppWeek.getCurrentWeekId();
      var weekMenus = menus.filter(m => (m.semana || "").toString().trim() === activeWeek);
      if (weekMenus.length === 0) weekMenus = menus; // fallback si no coincide
  
      var hoyMenu = weekMenus[0];
      menusListEl.innerHTML = `
        <div class="card meal-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: var(--primary); font-size: 0.9rem; text-transform: uppercase;">${hoyMenu.dia}</strong>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Semana: ${hoyMenu.semana || 'Actual'}</span>
          </div>
          <div style="margin-top: 8px; font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px;">
            <div>🍳 <strong>Desayuno:</strong> ${hoyMenu.desayuno || '-'}</div>
            <div>🍚 <strong>Comida:</strong> ${hoyMenu.comida || '-'}</div>
            <div>🥔 <strong>Cena:</strong> ${hoyMenu.cena || '-'}</div>
          </div>
        </div>
      `;
    }
  };
  
  const AppWeek = {
    currentOffset: 0,
  
    init() {
      this.renderWeeklyView();
    },
  
    changeWeek(direction) {
      this.currentOffset += direction;
      this.renderWeeklyView();
    },
  
    goToCurrentWeek() {
      this.currentOffset = 0;
      this.renderWeeklyView();
    },
  
    getCurrentWeekId() {
      // Generar un identificador de semana basado en la fecha actual + offset
      var d = new Date();
      d.setDate(d.getDate() + (this.currentOffset * 7));
      var year = d.getFullYear();
      // Calcular número de semana aproximado
      var onejan = new Date(d.getFullYear(), 0, 1);
      var week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      return `${year}-W${String(week).padStart(2, '0')}`;
    },
  
    renderWeeklyView() {
      var container = document.getElementById("weekly-menu-container");
      var labelWeek = document.getElementById("current-week-label");
      if (!container) return;
  
      var activeWeekId = this.getCurrentWeekId();
      if (labelWeek) labelWeek.textContent = `Semana: ${activeWeekId}`;
  
      var menus = State.data.menus || [];
      var weekMenus = menus.filter(function(m) {
        var sem = (m.semana || "").toString().trim();
        return sem === activeWeekId;
      });
  
      if (weekMenus.length === 0) {
        container.innerHTML = `
          <div class="card" style="text-align: center; padding: 24px;">
            <p style="margin-bottom: 12px; color: var(--text-muted);">No hay menús planificados para la ${activeWeekId}.</p>
            <button class="btn-action" style="margin: 0 auto; background: var(--primary); color: white;" onclick="AppBulkText.openModal('menu')">✍️ Pegar Menú para esta Semana</button>
          </div>
        `;
        return;
      }
  
      var html = "";
      weekMenus.forEach(function(m) {
        html += `
          <div class="day-card" style="margin-bottom: 16px;">
            <div class="day-header" style="background: var(--bg-color); padding: 8px 12px; border-radius: 8px; margin-bottom: 10px;">
              <h4 style="font-size: 1rem; color: var(--primary);">${m.dia}</h4>
            </div>
            <div class="day-meals-summary" style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem;">
              <div style="padding: 6px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color);"><strong>DESAYUNO:</strong> ${m.desayuno || '-'}</div>
              <div style="padding: 6px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color);"><strong>ALMUERZO:</strong> ${m.almuerzo || '-'}</div>
              <div style="padding: 6px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color);"><strong>COMIDA:</strong> ${m.comida || '-'}</div>
              <div style="padding: 6px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color);"><strong>MERIENDA:</strong> ${m.merienda || '-'}</div>
              <div style="padding: 6px; background: var(--surface-color); border-radius: 6px; border: 1px solid var(--border-color);"><strong>CENA:</strong> ${m.cena || '-'}</div>
            </div>
          </div>
        `;
      });
  
      container.innerHTML = html;
    }
  };
  
  const AppBulkText = {
    currentMode: "shopping",
  
    openModal(mode) {
      this.currentMode = mode;
      var modal = document.getElementById("bulk-text-modal");
      var titleEl = document.getElementById("bulk-modal-title");
      var descEl = document.getElementById("bulk-modal-desc");
      var textarea = document.getElementById("bulk-textarea");
  
      if (textarea) textarea.value = "";
  
      if (mode === "shopping") {
        if (titleEl) titleEl.textContent = "Carga Masiva de Compra";
        if (descEl) descEl.textContent = "Pega tu lista de la compra (un producto por línea).";
      } else {
        var activeWeek = AppWeek.getCurrentWeekId();
        if (titleEl) titleEl.textContent = `Importar Menú para (${activeWeek})`;
        if (descEl) descEl.textContent = "Pega tu bloque completo con los días (LUNES, MARTES...) y sus comidas.";
      }
  
      if (modal) modal.style.display = "flex";
    },
  
    closeModal() {
      var modal = document.getElementById("bulk-text-modal");
      if (modal) modal.style.display = "none";
    },
  
    async processAndSave() {
      var textarea = document.getElementById("bulk-textarea");
      if (!textarea) return;
      var text = textarea.value.trim();
      if (!text) { Utils.showToast("El campo está vacío", "error"); return; }
  
      var targetWeek = AppWeek.getCurrentWeekId();
      this.closeModal();
      Utils.showToast(`Guardando para la semana ${targetWeek}...`);
  
      if (this.currentMode === "shopping") {
        var lines = text.split("\n").filter(l => l.trim().length > 0);
        var res = await API.post("saveBulkShopping", { items: lines });
        if (res && res.success) {
          Utils.showToast(`¡${lines.length} productos añadidos!`);
          await AppShopping.loadShoppingList();
        }
      } else {
        var lines = text.split("\n");
        var diasList = [];
        var currentDia = null;
        var currentMealType = null;
  
        var mealMap = { "desayuno": "desayuno", "almuerzo": "almuerzo", "comida": "comida", "merienda": "merienda", "cena": "cena" };
  
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line) continue;
          var upperLine = line.toUpperCase();
          var lowerLine = line.toLowerCase();
  
          if (upperLine.includes("LUNES") || upperLine.includes("MARTES") || upperLine.includes("MIÉRCOLES") || upperLine.includes("MIERCOLES") || upperLine.includes("JUEVES") || upperLine.includes("VIERNES") || upperLine.includes("SÁBADO") || upperLine.includes("SABADO") || upperLine.includes("DOMINGO")) {
            if (currentDia) diasList.push(currentDia);
            currentDia = { dia: line, desayuno: "", almuerzo: "", comida: "", merienda: "", cena: "" };
            currentMealType = null;
            continue;
          }
  
          var matchedMealKey = Object.keys(mealMap).find(k => lowerLine === k);
          if (matchedMealKey) {
            currentMealType = mealMap[matchedMealKey];
            continue;
          }
  
          if (currentDia && currentMealType) {
            currentDia[currentMealType] = line;
            currentMealType = ""; 
          }
        }
        if (currentDia) diasList.push(currentDia);
  
        if (diasList.length === 0) {
          Utils.showToast("No se pudo interpretar el formato del menú", "error");
          return;
        }
  
        var res = await API.post("saveBulkMenusByDay", { dias: diasList, semana: targetWeek });
        if (res && res.success) {
          Utils.showToast("¡Menú de la semana guardado con éxito!");
          await AppData.loadInitialData();
          AppWeek.renderWeeklyView();
        } else {
          Utils.showToast("Error al guardar en Google Sheets", "error");
        }
      }
    }
  };
  
  const AppRecipes = {
    async init() { await this.loadRecipes(); },
    async loadRecipes() {
      var container = document.getElementById("recipes-container");
      if (!container) return;
      try {
        var res = await API.get("getRecipes");
        if (res && res.success && res.data) {
          State.data.recipes = res.data;
          this.renderRecipes(State.data.recipes);
        }
      } catch (e) { console.error(e); }
    },
    renderRecipes(arr) {
      var container = document.getElementById("recipes-container");
      if (!container) return;
      if (arr.length === 0) { container.innerHTML = `<div class="card">No hay recetas guardadas.</div>`; return; }
      var html = "";
      arr.forEach(r => {
        html += `<div class="recipe-card"><div class="recipe-title">${r.nombre}</div><div class="recipe-meta"><span>🏷️ ${r.categoria}</span><span>⏱️ ${r.tiempo}</span></div></div>`;
      });
      container.innerHTML = html;
    },
    filterRecipes(q) {}
  };
  
  const AppShopping = {
    async init() { await this.loadShoppingList(); },
    async loadShoppingList() {
      var container = document.getElementById("shopping-container");
      if (!container) return;
      try {
        var res = await API.get("getShoppingList");
        if (res && res.success && res.data) {
          State.data.shoppingList = res.data;
          this.renderShoppingList(State.data.shoppingList);
        } else {
          container.innerHTML = `<div class="card">Lista de compra vacía.</div>`;
        }
      } catch (e) { console.error(e); }
    },
    renderShoppingList(arr) {
      var container = document.getElementById("shopping-container");
      if (!container) return;
      if (arr.length === 0) { container.innerHTML = `<div class="card">Tu lista está vacía.</div>`; return; }
      var html = "";
      arr.forEach(item => {
        html += `<div class="shopping-item-row"><label class="shopping-item-label"><input type="checkbox" onchange="AppShopping.toggleItem('${item.id}')"><span>${item.producto}</span></label></div>`;
      });
      container.innerHTML = html;
    },
    async toggleItem(id) {
      State.data.shoppingList = State.data.shoppingList.filter(i => i.id !== id);
      this.renderShoppingList(State.data.shoppingList);
      await API.post("deleteShoppingItem", { id: id });
    },
    openAddModal() {
      var prodName = prompt("¿Qué producto quieres añadir a la compra?");
      if (!prodName) return;
      var prodQty = prompt("¿Qué cantidad o notas?", "1 unidad");
      var newItem = { id: "sc_" + new Date().getTime(), semana: "2026-W38", categoria: "Otros", producto: prodName, cantidad: prodQty || "", comprado: false, notas: "" };
      State.data.shoppingList.push(newItem);
      this.renderShoppingList(State.data.shoppingList);
      API.post("saveShoppingItem", newItem);
    }
  };
  
  document.addEventListener("DOMContentLoaded", async function() {
    console.log(`${CONFIG.APP_NAME} v${CONFIG.VERSION} iniciándose...`);
    AppTheme.init();
  
    var todayISO = Utils.getTodayFormatted();
    var badgeDate = document.getElementById("current-date-badge");
    if (badgeDate) badgeDate.textContent = Utils.formatDateDisplay(todayISO);
  
    await AppData.loadInitialData();
    AppWeek.init();
    await AppRecipes.init();
    await AppShopping.init();
  });