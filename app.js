const STORAGE_KEY = "offline_task_manager_v3";
const DEFAULT_CATEGORY = "未分類";

let tasks = loadTasks();
let editingTaskId = null;
let currentPage = "add";
let currentView = "list";
let currentCalendarDate = new Date();
let selectedCalendarDate = "";
let categories = loadCategories();

const el = {
  title: document.getElementById("title"),
  due: document.getElementById("due"),
  priority: document.getElementById("priority"),
  memo: document.getElementById("memo"),
  addBtn: document.getElementById("addBtn"),

  pageTitle: document.getElementById("pageTitle"),
  pageDescription: document.getElementById("pageDescription"),
  addTaskSection: document.getElementById("addTaskSection"),
  taskViewSection: document.getElementById("taskViewSection"),
  backupSection: document.getElementById("backupSection"),

  menuAddTaskBtn: document.getElementById("menuAddTaskBtn"),
  menuTaskViewBtn: document.getElementById("menuTaskViewBtn"),
  menuBackupBtn: document.getElementById("menuBackupBtn"),

  showListViewBtn: document.getElementById("showListViewBtn"),
  showCalendarViewBtn: document.getElementById("showCalendarViewBtn"),
  filterPanel: document.getElementById("filterPanel"),
  listViewSection: document.getElementById("listViewSection"),
  calendarViewSection: document.getElementById("calendarViewSection"),

  searchText: document.getElementById("searchText"),
  statusFilter: document.getElementById("statusFilter"),
  priorityFilter: document.getElementById("priorityFilter"),
  sortOrder: document.getElementById("sortOrder"),

  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  clearCompletedBtn: document.getElementById("clearCompletedBtn"),
  clearDateFilterBtn: document.getElementById("clearDateFilterBtn"),

  summary: document.getElementById("summary"),
  taskList: document.getElementById("taskList"),

  calendarTitle: document.getElementById("calendarTitle"),
  calendarGrid: document.getElementById("calendarGrid"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  todayMonthBtn: document.getElementById("todayMonthBtn"),

  editModal: document.getElementById("editModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  saveEditBtn: document.getElementById("saveEditBtn"),
  editTitle: document.getElementById("editTitle"),
  editDue: document.getElementById("editDue"),
  editPriority: document.getElementById("editPriority"),
  editCategory: document.getElementById("editCategory"),
  editMemo: document.getElementById("editMemo"),

  category: document.getElementById("category"),
  newCategory: document.getElementById("newCategory"),
  addCategoryBtn: document.getElementById("addCategoryBtn"),
  categoryFilter: document.getElementById("categoryFilter"),
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((task)=>({
      ...task,
      category:normalizeCategory(task.category)
    }));

  } catch {
    alert("保存データの読み込みに失敗しました。");
    return [];
  }
}

function loadCategories() {
  const taskCategories = loadTasks()
    .map((task) => normalizeCategory(task.category));

  const uniqueCategories = [...new Set(taskCategories)];

  if (!uniqueCategories.includes(DEFAULT_CATEGORY)) {
    uniqueCategories.unshift(DEFAULT_CATEGORY);
  }

  return uniqueCategories.sort((a, b) => {
    if (a === DEFAULT_CATEGORY) return -1;
    if (b === DEFAULT_CATEGORY) return 1;
    return a.localeCompare(b, "ja");
  });
}

function rebuildCategoriesFromTasks() {
  const taskCategories = tasks.map((task) => normalizeCategory(task.category));
  const merged = [...new Set([DEFAULT_CATEGORY, ...categories, ...taskCategories])];

  categories = merged.sort((a, b) => {
    if (a === DEFAULT_CATEGORY) return -1;
    if (b === DEFAULT_CATEGORY) return 1;
    return a.localeCompare(b, "ja");
  });
}

function normalizeCategory(category) {
  const value = String(category || "").trim();
  return value || DEFAULT_CATEGORY;
}

function getCategoryList() {
  const categories = tasks.map((task) => normalizeCategory(task.category));
  const uniqueCategories = [...new Set(categories)];
  uniqueCategories.sort((a, b) => a.localeCompare(b, "ja"));

  if (!uniqueCategories.includes(DEFAULT_CATEGORY)) {
    uniqueCategories.unshift(DEFAULT_CATEGORY);
  }

  return uniqueCategories;
}

function updateCategorySelectOptions() {
  rebuildCategoriesFromTasks();

  const selectedAddCategory = el.category.value || DEFAULT_CATEGORY;
  const selectedEditCategory = el.editCategory.value || DEFAULT_CATEGORY;
  const selectedFilterCategory = el.categoryFilter.value || "all";

  const addOptions = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  const filterOptions = [
    `<option value="all">すべて</option>`,
    ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
  ].join("");

  el.category.innerHTML = addOptions;
  el.editCategory.innerHTML = addOptions;
  el.categoryFilter.innerHTML = filterOptions;

  if (categories.includes(selectedAddCategory)) {
    el.category.value = selectedAddCategory;
  } else {
    el.category.value = DEFAULT_CATEGORY;
  }

  if (categories.includes(selectedEditCategory)) {
    el.editCategory.value = selectedEditCategory;
  } else {
    el.editCategory.value = DEFAULT_CATEGORY;
  }

  if (selectedFilterCategory === "all" || categories.includes(selectedFilterCategory)) {
    el.categoryFilter.value = selectedFilterCategory;
  } else {
    el.categoryFilter.value = "all";
  }
}

function addCategory() {
  const newCategory = normalizeCategory(el.newCategory.value);

  if (newCategory === DEFAULT_CATEGORY) {
    el.newCategory.value = "";
    el.category.value = DEFAULT_CATEGORY;
    return;
  }

  if (!categories.includes(newCategory)) {
    categories.push(newCategory);
    categories.sort((a, b) => {
      if (a === DEFAULT_CATEGORY) return -1;
      if (b === DEFAULT_CATEGORY) return 1;
      return a.localeCompare(b, "ja");
    });
  }

  updateCategorySelectOptions();
  el.category.value = newCategory;
  el.newCategory.value = "";
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getPriorityOrder(priority) {
  if (priority === "高") return 3;
  if (priority === "中") return 2;
  return 1;
}

function getPriorityClass(priority) {
  if (priority === "高") return "priority-high";
  if (priority === "中") return "priority-medium";
  return "priority-low";
}

function createTask(title, dueDate, priority, category, memo) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`,
    title: title.trim(),
    dueDate: dueDate || "",
    priority,
    category: normalizeCategory(category),
    memo: memo.trim(),
    done: false,
    createdAt: now,
    updatedAt: now
  };
}

function isOverdue(task) {
  if (!task.dueDate || task.done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dateStr) {
  return dateStr || "期限なし";
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthMatrix(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startDay);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    cells.push(date);
  }
  return cells;
}

function getTasksByDate(dateKey) {
  return tasks.filter((task) => task.dueDate === dateKey);
}

function setMainPage(page) {
  currentPage = page;

  const pages = {
    add: {
      section: el.addTaskSection,
      title: "タスク追加",
      desc: "新しいタスクを登録します。",
      button: el.menuAddTaskBtn
    },
    tasks: {
      section: el.taskViewSection,
      title: "タスク一覧",
      desc: "一覧表示とカレンダー表示を切り替えて管理できます。",
      button: el.menuTaskViewBtn
    },
    backup: {
      section: el.backupSection,
      title: "バックアップ",
      desc: "JSONバックアップの出力と読込を行います。",
      button: el.menuBackupBtn
    }
  };

  [el.addTaskSection, el.taskViewSection, el.backupSection].forEach((section) => {
    section.classList.add("hidden-view");
  });

  [el.menuAddTaskBtn, el.menuTaskViewBtn, el.menuBackupBtn].forEach((button) => {
    button.classList.remove("active");
  });

  const current = pages[page];
  current.section.classList.remove("hidden-view");
  current.button.classList.add("active");
  el.pageTitle.textContent = current.title;
  el.pageDescription.textContent = current.desc;

  if (page === "tasks") {
    if (currentView === "calendar") {
      renderCalendar();
    } else {
      render();
    }
  }
}

function setView(view) {
  currentView = view;
  if (view === "list") {
    el.listViewSection.classList.remove("hidden-view");
    el.calendarViewSection.classList.add("hidden-view");
    el.filterPanel.classList.remove("hidden-view");
    el.showListViewBtn.classList.remove("secondary");
    el.showCalendarViewBtn.classList.add("secondary");
  } else {
    el.listViewSection.classList.add("hidden-view");
    el.calendarViewSection.classList.remove("hidden-view");
    el.filterPanel.classList.add("hidden-view");
    el.showListViewBtn.classList.add("secondary");
    el.showCalendarViewBtn.classList.remove("secondary");
    renderCalendar();
  }
}

function addTask() {
  const title = el.title.value.trim();
  const dueDate = el.due.value;
  const priority = el.priority.value;
  const category = normalizeCategory(el.category.value);
  const memo = el.memo.value.trim();

  if (!title) {
    alert("タスク名を入力してください。");
    el.title.focus();
    return;
  }

  tasks.unshift(createTask(title, dueDate, priority, category, memo));
  saveTasks();
  clearAddForm();
  render();
}

function clearAddForm() {
  el.title.value = "";
  el.due.value = "";
  el.priority.value = "中";
  el.category.value = DEFAULT_CATEGORY;
  el.memo.value = "";
  el.title.focus();
}

function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  task.updatedAt = new Date().toISOString();
  saveTasks();
  render();
}

function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  if (!confirm(`「${task.title}」を削除しますか？`)) return;
  tasks = tasks.filter((item) => item.id !== id);
  saveTasks();
  render();
}

function clearCompletedTasks() {
  const completedCount = tasks.filter((task) => task.done).length;
  if (completedCount === 0) {
    alert("完了タスクはありません。");
    return;
  }
  if (!confirm(`完了タスク ${completedCount} 件を削除しますか？`)) return;
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  render();
}

function clearSelectedCalendarDate() {
  selectedCalendarDate = "";
  render();
}

function openEditModal(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  editingTaskId = id;
  el.editTitle.value = task.title;
  el.editDue.value = task.dueDate || "";
  el.editPriority.value = task.priority;
  el.editCategory.value = normalizeCategory(task.category);
  el.editMemo.value = task.memo || "";

  el.editModal.classList.remove("hidden");
  el.editModal.setAttribute("aria-hidden", "false");
  el.editTitle.focus();
}

function closeEditModal() {
  editingTaskId = null;
  el.editModal.classList.add("hidden");
  el.editModal.setAttribute("aria-hidden", "true");
}

function saveEdit() {
  if (!editingTaskId) return;
  const task = tasks.find((item) => item.id === editingTaskId);
  if (!task) return;
  const title = el.editTitle.value.trim();
  if (!title) {
    alert("タスク名を入力してください。");
    el.editTitle.focus();
    return;
  }
  task.title = title;
  task.dueDate = el.editDue.value;
  task.priority = el.editPriority.value;
  task.category = normalizeCategory(el.editCategory.value);
  task.memo = el.editMemo.value.trim();
  task.updatedAt = new Date().toISOString();
  saveTasks();
  closeEditModal();
  render();
}

function exportJson() {
  const backup = {
    app: "offline-task-manager",
    version: 5,
    exportedAt: new Date().toISOString(),
    tasks
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fileName = `tasks-backup-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      const imported = Array.isArray(parsed) ? parsed : Array.isArray(parsed.tasks) ? parsed.tasks : null;
      if (!imported) throw new Error("JSON形式が不正です。");
      const normalized = imported
        .map((task) => ({
          id: task.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`),
          title: String(task.title || "").trim(),
          dueDate: String(task.dueDate || ""),
          priority: ["高", "中", "低"].includes(task.priority) ? task.priority : "中",
          category: normalizeCategory(task.category),
          memo: String(task.memo || ""),
          done: Boolean(task.done),
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString()
        }))
        .filter((task) => task.title);
      if (normalized.length === 0) {
        alert("有効なタスクが見つかりませんでした。");
        return;
      }
      if (!confirm(`現在のタスクを上書きして ${normalized.length} 件を読み込みますか？`)) return;
      tasks = normalized;
      saveTasks();
      render();
      alert("JSONバックアップを読み込みました。");
    } catch {
      alert("JSON読込に失敗しました。ファイル内容を確認してください。");
    } finally {
      el.importFile.value = "";
    }
  };
  reader.readAsText(file, "UTF-8");
}

function selectCalendarDate(dateKey) {
  selectedCalendarDate = selectedCalendarDate === dateKey ? "" : dateKey;
  setView("list");
  render();
}

function getFilteredAndSortedTasks() {
  const keyword = el.searchText.value.trim().toLowerCase();
  const status = el.statusFilter.value;
  const priorityFilter = el.priorityFilter.value;
  const sortOrder = el.sortOrder.value;
  const categoryFilter = el.categoryFilter.value;

  const filtered = tasks.filter((task) => {
    const matchesKeyword = task.title.toLowerCase().includes(keyword) || task.memo.toLowerCase().includes(keyword);
    const matchesStatus = status === "all" || (status === "open" && !task.done) || (status === "done" && task.done);
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || normalizeCategory(task.category) === categoryFilter;
    const matchesSelectedDate = !selectedCalendarDate || task.dueDate === selectedCalendarDate;
    return matchesKeyword && matchesStatus && matchesPriority && matchesCategory && matchesSelectedDate;
  });

  filtered.sort((a, b) => {
    switch (sortOrder) {
      case "created_asc":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "created_desc":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "due_asc":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      case "due_desc":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return b.dueDate.localeCompare(a.dueDate);
      case "priority_desc":
        return getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
      case "priority_asc":
        return getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
      case "title_asc":
        return a.title.localeCompare(b.title, "ja");
      case "title_desc":
        return b.title.localeCompare(a.title, "ja");
      default:
        return 0;
    }
  });

  return filtered;
}

function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const todayKey = toDateKey(new Date());
  el.calendarTitle.textContent = `${year}年${month + 1}月`;
  const cells = getMonthMatrix(currentCalendarDate);

  el.calendarGrid.innerHTML = cells.map((date) => {
    const dateKey = toDateKey(date);
    const dayTasks = getTasksByDate(dateKey);
    const isCurrentMonth = date.getMonth() === month;
    const isToday = dateKey === todayKey;
    const isSelected = selectedCalendarDate === dateKey;
    const day = date.getDay();
    const dateClass = ["calendar-date", day === 0 ? "calendar-date-sunday" : "", day === 6 ? "calendar-date-saturday" : ""].join(" ").trim();
    const cellClass = ["calendar-cell", !isCurrentMonth ? "other-month" : "", isToday ? "today" : "", isSelected ? "selected-date" : ""].join(" ").trim();
    const visibleTasks = dayTasks.slice(0, 4);
    const moreCount = dayTasks.length - visibleTasks.length;

    return `
      <div class="${cellClass}" onclick="selectCalendarDateFromUI('${dateKey}')">
        <div class="calendar-date-row">
          <div class="${dateClass}">${date.getDate()}</div>
        </div>
        <div class="calendar-task-list">
          ${visibleTasks.map((task) => `
            <div class="calendar-task ${getPriorityClass(task.priority)} ${task.done ? "done" : ""} ${isOverdue(task) ? "overdue" : ""}"
                 title="${escapeHtml(task.title)}"
                 onclick="openEditFromCalendarUI(event, '${task.id}')">
                 <div class="calendar-task-category">${escapeHtml(normalizeCategory(task.category))}</div>
                <div>${escapeHtml(task.title)}</div>
            </div>
          `).join("")}
          ${moreCount > 0 ? `<div class="calendar-more">他 ${moreCount} 件</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function render() {
  updateCategorySelectOptions();
  const filtered = getFilteredAndSortedTasks();
  const total = tasks.length;
  const openCount = tasks.filter((task) => !task.done).length;
  const doneCount = tasks.filter((task) => task.done).length;

  el.summary.textContent = `全 ${total} 件 / 未完了 ${openCount} 件 / 完了 ${doneCount} 件${selectedCalendarDate ? ` / 日付: ${selectedCalendarDate}` : ""}`;

  if (selectedCalendarDate) {
    el.clearDateFilterBtn.classList.remove("hidden-view");
  } else {
    el.clearDateFilterBtn.classList.add("hidden-view");
  }

  if (filtered.length === 0) {
    el.taskList.innerHTML = `<div class="empty">表示するタスクがありません。</div>`;
    renderCalendar();
    return;
  }

  el.taskList.innerHTML = filtered.map((task) => {
    const priorityClass = getPriorityClass(task.priority);
    const overdue = isOverdue(task);
    const doneClass = task.done ? "done-card" : "";
    const titleClass = task.done ? "task-title done" : "task-title";
    return `
      <div class="task-card ${priorityClass} ${doneClass} ${overdue ? "overdue" : ""}">
        <div class="task-main-row">
          <div class="task-left">
            <input class="task-checkbox" type="checkbox" ${task.done ? "checked" : ""} onchange="toggleTaskFromUI('${task.id}')" />
            <div class="task-title-wrap">
              <div class="${titleClass}">${escapeHtml(task.title)}</div>
              <div class="meta-row">
                <span class="tag">優先度: ${escapeHtml(task.priority)}</span>
                <span class="tag">期限: ${escapeHtml(formatDate(task.dueDate))}</span>
                <span class="tag">状態: ${task.done ? "完了" : "未完了"}</span>
                <span class="tag">カテゴリー: ${escapeHtml(normalizeCategory(task.category))}</span>
                ${overdue ? `<span class="tag overdue-tag">期限切れ</span>` : ""}
              </div>
              ${task.memo ? `<div class="memo">${escapeHtml(task.memo)}</div>` : ""}
            </div>
          </div>
          <div class="task-actions">
            <button type="button" onclick="openEditModalFromUI('${task.id}')">編集</button>
            <button type="button" class="danger" onclick="deleteTaskFromUI('${task.id}')">削除</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  renderCalendar();
}

function handleModalBackdropClick(event) {
  const target = event.target;
  if (target && target.dataset.close === "true") closeEditModal();
}

function openEditFromCalendar(event, id) {
  event.stopPropagation();
  openEditModal(id);
}

el.addBtn.addEventListener("click", addTask);
el.title.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTask();
});

el.menuAddTaskBtn.addEventListener("click", () => setMainPage("add"));
el.menuTaskViewBtn.addEventListener("click", () => setMainPage("tasks"));
el.menuBackupBtn.addEventListener("click", () => setMainPage("backup"));

el.showListViewBtn.addEventListener("click", () => setView("list"));
el.showCalendarViewBtn.addEventListener("click", () => setView("calendar"));

el.searchText.addEventListener("input", render);
el.statusFilter.addEventListener("change", render);
el.priorityFilter.addEventListener("change", render);
el.categoryFilter.addEventListener("change", render);
el.sortOrder.addEventListener("change", render);

el.addCategoryBtn.addEventListener("click", addCategory);
el.newCategory.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addCategory();
  }
});

el.exportBtn.addEventListener("click", exportJson);
el.importBtn.addEventListener("click", () => el.importFile.click());
el.importFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importJson(file);
});

el.clearCompletedBtn.addEventListener("click", clearCompletedTasks);
el.clearDateFilterBtn.addEventListener("click", clearSelectedCalendarDate);

el.prevMonthBtn.addEventListener("click", () => {
  currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
  renderCalendar();
});

el.nextMonthBtn.addEventListener("click", () => {
  currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
  renderCalendar();
});

el.todayMonthBtn.addEventListener("click", () => {
  currentCalendarDate = new Date();
  renderCalendar();
});

el.closeModalBtn.addEventListener("click", closeEditModal);
el.cancelEditBtn.addEventListener("click", closeEditModal);
el.saveEditBtn.addEventListener("click", saveEdit);
el.editModal.addEventListener("click", handleModalBackdropClick);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !el.editModal.classList.contains("hidden")) closeEditModal();
});

window.toggleTaskFromUI = toggleTask;
window.deleteTaskFromUI = deleteTask;
window.openEditModalFromUI = openEditModal;
window.selectCalendarDateFromUI = selectCalendarDate;
window.openEditFromCalendarUI = openEditFromCalendar;

setView("list");
setMainPage("add");
render();
