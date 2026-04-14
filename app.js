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
  showBoardViewBtn: document.getElementById("showBoardViewBtn"),
  showCalendarViewBtn: document.getElementById("showCalendarViewBtn"),
  filterPanel: document.getElementById("filterPanel"),
  listViewSection: document.getElementById("listViewSection"),
  boardViewSection: document.getElementById("boardViewSection"),
  calendarViewSection: document.getElementById("calendarViewSection"),

  searchText: document.getElementById("searchText"),
  statusFilter: document.getElementById("statusFilter"),
  priorityFilter: document.getElementById("priorityFilter"),
  sortOrder: document.getElementById("sortOrder"),

  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  clearCompletedBtn: document.getElementById("clearCompletedBtn"),
  clearCompletedBtnBoard: document.getElementById("clearCompletedBtnBoard"),
  clearDateFilterBtn: document.getElementById("clearDateFilterBtn"),
  clearDateFilterBtnBoard: document.getElementById("clearDateFilterBtnBoard"),

  summary: document.getElementById("summary"),
  boardFilter: document.getElementById("boardFilter"),
  taskList: document.getElementById("taskList"),

  board: document.getElementById("board"),

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
  editStatus: document.getElementById("editStatus"),
  editMemo: document.getElementById("editMemo"),

  addModal: document.getElementById("addModal"),
  closeAddModalBtn: document.getElementById("closeAddModalBtn"),
  cancelAddBtn: document.getElementById("cancelAddBtn"),
  addModalBtn: document.getElementById("addModalBtn"),
  addTitle: document.getElementById("addTitle"),
  addDue: document.getElementById("addDue"),
  addPriority: document.getElementById("addPriority"),
  addCategory: document.getElementById("addCategory"),
  addMemo: document.getElementById("addMemo"),

  category: document.getElementById("category"),
  newCategory: document.getElementById("newCategory"),
  addCategoryBtn: document.getElementById("addCategoryBtn"),
  categoryFilter: document.getElementById("categoryFilter"),
};

/**
 * localStorageからタスク読み込み
 * @returns タスク一覧
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((task) => ({
      ...task,
      category: normalizeCategory(task.category),
    }));
  } catch {
    alert("保存データの読み込みに失敗しました。");
    return [];
  }
}

/**
 * タスク一覧からカテゴリ一覧を取得
 * @returns カテゴリ一覧
 */
function loadCategories() {
  const taskCategories = loadTasks().map((task) =>
    normalizeCategory(task.category),
  );

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

/**
 * タスクからカテゴリ一覧を作成
 */
function rebuildCategoriesFromTasks() {
  const taskCategories = tasks.map((task) => normalizeCategory(task.category));
  const merged = [
    ...new Set([DEFAULT_CATEGORY, ...categories, ...taskCategories]),
  ];

  categories = merged.sort((a, b) => {
    if (a === DEFAULT_CATEGORY) return -1;
    if (b === DEFAULT_CATEGORY) return 1;
    return a.localeCompare(b, "ja");
  });
}

/**
 * カテゴリを正規化
 * @param {*} category カテゴリ
 * @returns 正規化したカテゴリ
 */
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

/**
 * カテゴリ一覧を更新
 */
function updateCategorySelectOptions() {
  rebuildCategoriesFromTasks();

  const selectedAddCategory = el.category.value || DEFAULT_CATEGORY;
  const selectedEditCategory = el.editCategory.value || DEFAULT_CATEGORY;
  const selectedAddModalCategory = el.addCategory.value || DEFAULT_CATEGORY;
  const selectedFilterCategory = el.categoryFilter.value || "all";

  const addOptions = categories
    .map(
      (category) =>
        `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
    )
    .join("");

  const filterOptions = [
    `<option value="all">すべて</option>`,
    ...categories.map(
      (category) =>
        `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
    ),
  ].join("");

  el.category.innerHTML = addOptions;
  el.editCategory.innerHTML = addOptions;
  el.addCategory.innerHTML = addOptions;
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

  if (categories.includes(selectedAddModalCategory)) {
    el.addCategory.value = selectedAddModalCategory;
  } else {
    el.addCategory.value = DEFAULT_CATEGORY;
  }

  if (
    selectedFilterCategory === "all" ||
    categories.includes(selectedFilterCategory)
  ) {
    el.categoryFilter.value = selectedFilterCategory;
  } else {
    el.categoryFilter.value = "all";
  }
}

/**
 * カテゴリ追加
 * @returns
 */
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

/**
 * タスクをlocalStorageに保存
 */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * 優先度の順位付け
 * @param {*} priority 優先度（高～低）
 * @returns 順位
 */
function getPriorityOrder(priority) {
  if (priority === "高") return 3;
  if (priority === "中") return 2;
  return 1;
}

/**
 * 優先度に対応するクラスを取得
 * @param {*} priority 優先度（高～低）
 * @returns Class
 */
function getPriorityClass(priority) {
  if (priority === "高") return "priority-high";
  if (priority === "中") return "priority-medium";
  return "priority-low";
}

/**
 * タスク作成
 * @param {*} title タイトル
 * @param {*} dueDate 期限日
 * @param {*} priority 優先度
 * @param {*} category カテゴリ
 * @param {*} memo メモ
 * @returns タスク情報
 */
function createTask(title, dueDate, priority, category, memo) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random()}`,
    title: title.trim(),
    dueDate: dueDate || "",
    priority,
    category: normalizeCategory(category),
    memo: memo.trim(),
    done: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 期限切れチェック
 * @param {*} task タスク情報
 * @returns 期限切れ=True, 期限切れでない=False
 */
function isOverdue(task) {
  if (!task.dueDate || task.done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

/**
 * HTMLとして解釈されないように文字列を変換
 * @param {*} value 文字列
 * @returns 変換後
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 期限日を正規化
 * @param {*} dueDate 期限日
 * @returns
 */
function formatDate(dueDate) {
  return dueDate || "期限なし";
}

/**
 * 日付を整形
 * @param {*} date 日付
 * @returns 整形した日付（yyyy-MM-dd）
 */
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * カレンダー　その月のマトリクスを取得
 * @param {*} baseDate 基準日
 * @returns マトリクス
 */
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

/**
 * 日付ごとのタスクを取得
 * @param {*} dateKey 対象日付
 * @returns タスク
 */
function getTasksByDate(dateKey) {
  return tasks.filter((task) => task.dueDate === dateKey);
}

/**
 * メインページ設定
 * @param {*} page ページ種別
 */
function setMainPage(page) {
  currentPage = page;

  const pages = {
    add: {
      section: el.addTaskSection,
      title: "タスク追加",
      desc: "新しいタスクを登録します。",
      button: el.menuAddTaskBtn,
    },
    tasks: {
      section: el.taskViewSection,
      title: "タスク一覧",
      desc: "一覧表示・カレンダー表示・カンバン表示を切り替えて管理できます。",
      button: el.menuTaskViewBtn,
    },
    backup: {
      section: el.backupSection,
      title: "バックアップ",
      desc: "JSONバックアップの出力と読込を行います。",
      button: el.menuBackupBtn,
    },
  };

  [el.addTaskSection, el.taskViewSection, el.backupSection].forEach(
    (section) => {
      section.classList.add("hidden-view");
    },
  );

  [el.menuAddTaskBtn, el.menuTaskViewBtn, el.menuBackupBtn].forEach(
    (button) => {
      button.classList.remove("active");
    },
  );

  const current = pages[page];
  current.section.classList.remove("hidden-view");
  current.button.classList.add("active");
  el.pageTitle.textContent = current.title;
  el.pageDescription.textContent = current.desc;

  if (page === "tasks") {
    if (currentView === "calendar") {
      renderCalendar();
    } else if (currentView === "board") {
      renderBoard();
    } else {
      render();
    }
  }
}

/**
 * 表示設定
 * @param {*} view 表示種別
 */
function setView(view) {
  currentView = view;
  if (view === "list") {
    el.listViewSection.classList.remove("hidden-view");
    el.boardViewSection.classList.add("hidden-view");
    el.calendarViewSection.classList.add("hidden-view");
    el.filterPanel.classList.remove("hidden-view");
    el.showListViewBtn.classList.remove("secondary");
    el.showBoardViewBtn.classList.add("secondary");
    el.showCalendarViewBtn.classList.add("secondary");
  } else if (view === "board") {
    el.listViewSection.classList.add("hidden-view");
    el.boardViewSection.classList.remove("hidden-view");
    el.calendarViewSection.classList.add("hidden-view");
    el.filterPanel.classList.add("hidden-view");
    el.showListViewBtn.classList.add("secondary");
    el.showBoardViewBtn.classList.remove("secondary");
    el.showCalendarViewBtn.classList.add("secondary");
    renderBoard();
  } else {
    el.listViewSection.classList.add("hidden-view");
    el.boardViewSection.classList.add("hidden-view");
    el.calendarViewSection.classList.remove("hidden-view");
    el.filterPanel.classList.add("hidden-view");
    el.showListViewBtn.classList.add("secondary");
    el.showBoardViewBtn.classList.add("secondary");
    el.showCalendarViewBtn.classList.remove("secondary");
    renderCalendar();
  }
}

/**
 * タスクを追加
 * @returns
 */
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

/**
 * タスク追加画面の入力値をクリア
 */
function clearAddForm() {
  el.title.value = "";
  el.due.value = "";
  el.priority.value = "中";
  el.category.value = DEFAULT_CATEGORY;
  el.memo.value = "";
  el.title.focus();
}

/**
 * タスク一覧のチェックボックス押下時の処理
 * @param {*} id タスクID
 * @returns
 */
function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  task.updatedAt = new Date().toISOString();
  saveTasks();
  render();
}

/**
 * タスク削除
 * @param {*} id タスクID
 * @returns
 */
function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  if (!confirm(`「${task.title}」を削除しますか？`)) return;
  tasks = tasks.filter((item) => item.id !== id);
  saveTasks();
  render();
}

/**
 * 完了済みタスクを削除
 * @returns
 */
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

/**
 * 日付指定による絞り込みを解除
 */
function clearSelectedCalendarDate() {
  selectedCalendarDate = "";
  render();
}

/**
 * タスク編集モーダル画面を開く
 * @param {*} id タスクID
 * @returns
 */
function openEditModal(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  editingTaskId = id;
  el.editTitle.value = task.title;
  el.editDue.value = task.dueDate || "";
  el.editPriority.value = task.priority;
  el.editCategory.value = normalizeCategory(task.category);
  el.editStatus.value = task.done ? "done" : "";
  el.editMemo.value = task.memo || "";

  el.editModal.classList.remove("hidden");
  el.editModal.setAttribute("aria-hidden", "false");
  el.editTitle.focus();
}

/**
 * タスク追加モーダル画面を開く
 * @param {*} category カテゴリ
 */
function openAddModal(category) {
  el.addTitle.value = "";
  el.addDue.value = "";
  el.addPriority.value = "中";
  el.addMemo.value = "";
  el.addCategory.value = normalizeCategory(category);

  el.addModal.classList.remove("hidden");
  el.addModal.setAttribute("aria-hidden", "false");
  el.addTitle.focus();
}

/**
 * タスク編集モーダル画面を閉じる
 */
function closeEditModal() {
  editingTaskId = null;
  el.editModal.classList.add("hidden");
  el.editModal.setAttribute("aria-hidden", "true");
}

/**
 * タスク追加モーダル画面を閉じる
 */
function closeAddModal() {
  el.addModal.classList.add("hidden");
  el.addModal.setAttribute("aria-hidden", "true");
}

/**
 * 編集したデータを保存
 * @returns
 */
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
  task.done = el.editStatus.value === "done" ? true : false;
  task.memo = el.editMemo.value.trim();
  task.updatedAt = new Date().toISOString();
  saveTasks();
  closeEditModal();
  render();
}

/**
 * モーダル画面によるタスク追加
 */
function addTaskFromModal() {
  el.title.value = el.addTitle.value;
  el.due.value = el.addDue.value;
  el.priority.value = el.addPriority.value;
  el.category.value = el.addCategory.value;
  el.memo.value = el.addMemo.value;
  addTask();
  closeAddModal();
}

/**
 * タスク情報のエクスポート（JSON形式）
 */
function exportJson() {
  const backup = {
    app: "offline-task-manager",
    version: 5,
    exportedAt: new Date().toISOString(),
    tasks,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
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

/**
 * タスク情報のインポート（JSON形式）
 * @param {*} file インポートファイル
 */
function importJson(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      const imported = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.tasks)
          ? parsed.tasks
          : null;
      if (!imported) throw new Error("JSON形式が不正です。");
      const normalized = imported
        .map((task) => ({
          id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random()}`,
          title: String(task.title || "").trim(),
          dueDate: String(task.dueDate || ""),
          priority: ["高", "中", "低"].includes(task.priority)
            ? task.priority
            : "中",
          category: normalizeCategory(task.category),
          memo: String(task.memo || ""),
          done: Boolean(task.done),
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
        }))
        .filter((task) => task.title);
      if (normalized.length === 0) {
        alert("有効なタスクが見つかりませんでした。");
        return;
      }
      if (
        !confirm(
          `現在のタスクを上書きして ${normalized.length} 件を読み込みますか？`,
        )
      )
        return;
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

/**
 * カレンダー上の日付クリックイベント
 * @param {*} dateKey 対象日付
 */
function selectCalendarDate(dateKey) {
  selectedCalendarDate = selectedCalendarDate === dateKey ? "" : dateKey;
  setView("list");
  render();
}

/**
 * フィルター・ソートされたタスク一覧を取得
 * @returns タスク一覧
 */
function getFilteredAndSortedTasks() {
  const keyword = el.searchText.value.trim().toLowerCase();
  const status = el.statusFilter.value;
  const priorityFilter = el.priorityFilter.value;
  const sortOrder = el.sortOrder.value;
  const categoryFilter = el.categoryFilter.value;

  const filtered = tasks.filter((task) => {
    const matchesKeyword =
      task.title.toLowerCase().includes(keyword) ||
      task.memo.toLowerCase().includes(keyword);
    const matchesStatus =
      status === "all" ||
      (status === "open" && !task.done) ||
      (status === "done" && task.done);
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      normalizeCategory(task.category) === categoryFilter;
    const matchesSelectedDate =
      !selectedCalendarDate || task.dueDate === selectedCalendarDate;
    return (
      matchesKeyword &&
      matchesStatus &&
      matchesPriority &&
      matchesCategory &&
      matchesSelectedDate
    );
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

/**
 * カレンダー表示の描画
 */
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const todayKey = toDateKey(new Date());
  el.calendarTitle.textContent = `${year}年${month + 1}月`;
  const cells = getMonthMatrix(currentCalendarDate);

  el.calendarGrid.innerHTML = "";

  cells.forEach((date) => {
    const dateKey = toDateKey(date);
    const dayTasks = getTasksByDate(dateKey);
    const isCurrentMonth = date.getMonth() === month;
    const isToday = dateKey === todayKey;
    const isSelected = selectedCalendarDate === dateKey;
    const day = date.getDay();

    const dateClass = [
      "calendar-date",
      day === 0 ? "calendar-date-sunday" : "",
      day === 6 ? "calendar-date-saturday" : "",
    ]
      .join(" ")
      .trim();

    const cellClass = [
      "calendar-cell",
      !isCurrentMonth ? "other-month" : "",
      isToday ? "today" : "",
      isSelected ? "selected-date" : "",
    ]
      .join(" ")
      .trim();

    const visibleTasks = dayTasks.slice(0, 4);
    const moreCount = dayTasks.length - visibleTasks.length;

    const cell = document.createElement("div");
    cell.className = cellClass;
    cell.addEventListener("click", () => {
      selectCalendarDate(dateKey);
    });

    const dateRow = document.createElement("div");
    dateRow.className = "calendar-date-row";

    const dateDiv = document.createElement("div");
    dateDiv.className = dateClass;
    dateDiv.textContent = String(date.getDate());

    dateRow.appendChild(dateDiv);

    const taskList = document.createElement("div");
    taskList.className = "calendar-task-list";

    visibleTasks.forEach((task) => {
      const taskDiv = document.createElement("div");
      taskDiv.className = `calendar-task ${getPriorityClass(task.priority)} ${task.done ? "done" : ""} ${isOverdue(task) ? "overdue" : ""}`;
      taskDiv.title = task.title;

      taskDiv.addEventListener("click", (event) => {
        event.stopPropagation();
        openEditFromCalendar(event, task.id);
      });

      const categoryDiv = document.createElement("div");
      categoryDiv.className = "calendar-task-category";
      categoryDiv.textContent = normalizeCategory(task.category);

      const titleDiv = document.createElement("div");
      titleDiv.textContent = task.title;

      taskDiv.appendChild(categoryDiv);
      taskDiv.appendChild(titleDiv);
      taskList.appendChild(taskDiv);
    });

    if (moreCount > 0) {
      const moreDiv = document.createElement("div");
      moreDiv.className = "calendar-more";
      moreDiv.textContent = `他 ${moreCount} 件`;
      taskList.appendChild(moreDiv);
    }

    cell.appendChild(dateRow);
    cell.appendChild(taskList);
    el.calendarGrid.appendChild(cell);
  });
}

/**
 * カンバン表示の描画
 * @returns
 */
function renderBoard() {
  el.board.innerHTML = "";
  rebuildCategoriesFromTasks();
  const filtered = getFilteredAndSortedTasks();

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "表示するタスクがありません。";
    el.board.appendChild(empty);
    renderCalendar();
    return;
  }

  el.boardFilter.textContent = `${selectedCalendarDate ? `日付: ${selectedCalendarDate}` : ""}`;
  if (selectedCalendarDate) {
    el.clearDateFilterBtnBoard.classList.remove("hidden-view");
  } else {
    el.clearDateFilterBtnBoard.classList.add("hidden-view");
  }

  const sortedFilterd = filtered.sort((a, b) => {
    // 完了/未完了
    const doneDiff = a.done - b.done;
    if (doneDiff !== 0) return doneDiff;

    // 期限
    if (!a.dueDate && !b.dueDate) {
      // 両方なし → 次の条件へ
    } else if (!a.dueDate) {
      return 1;
    } else if (!b.dueDate) {
      return -1;
    } else {
      const dueDiff = a.dueDate.localeCompare(b.dueDate);
      if (dueDiff !== 0) return dueDiff;
    }

    // 優先度
    return getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
  });

  const grouped = {};
  sortedFilterd.forEach((task) => {
    const category = normalizeCategory(task.category);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(task);
  });

  categories.forEach((category) => {
    const column = document.createElement("div");
    column.className = "board-column";

    const title = document.createElement("div");
    title.className = "board-column-title";
    const count = grouped[category] ? grouped[category].length : 0;
    title.textContent = `${category} (${count})`;

    const taskList = document.createElement("div");
    taskList.className = "board-task-list";

    if (!grouped[category] || grouped[category].length === 0) {
      const empty = document.createElement("div");
      empty.className = "board-empty";
      empty.textContent = "タスクなし";
      taskList.appendChild(empty);
    } else {
      grouped[category].forEach((task) => {
        const overdue = isOverdue(task);

        const card = document.createElement("div");
        card.className = `board-card ${getPriorityClass(task.priority)} ${task.done ? "done" : ""} ${isOverdue(task) ? "overdue" : ""}`;
        card.addEventListener("click", (event) => {
          openEditFromBoard(event, task.id);
        });

        const titleDiv = document.createElement("div");
        titleDiv.className = "board-card-title";
        titleDiv.textContent = task.title || "無題";

        const metaRow = document.createElement("div");
        metaRow.className = "meta-row";
        const dueDiv = document.createElement("div");
        dueDiv.className = "board-card-meta";
        dueDiv.textContent = `期限: ${formatDate(task.dueDate)}`;
        metaRow.appendChild(dueDiv);

        if (overdue) {
          const overdueTag = document.createElement("span");
          overdueTag.className = "tag overdue-tag";
          overdueTag.textContent = "期限切れ";
          metaRow.appendChild(overdueTag);
        }

        card.appendChild(titleDiv);
        card.appendChild(metaRow);

        taskList.appendChild(card);
      });
    }

    const addTaskBtn = document.createElement("button");
    addTaskBtn.className = "add-button";
    addTaskBtn.textContent = "＋　タスク追加";
    addTaskBtn.onclick = (event) => {
      openAddFromBoard(event, category);
    };

    column.appendChild(title);
    column.appendChild(taskList);
    column.appendChild(addTaskBtn);
    el.board.appendChild(column);
  });
}

/**
 * タスク一覧表示の描画
 * @returns
 */
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

  el.taskList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "表示するタスクがありません。";
    el.taskList.appendChild(empty);
    renderCalendar();
    return;
  }

  filtered.forEach((task) => {
    const priorityClass = getPriorityClass(task.priority);
    const overdue = isOverdue(task);
    const doneClass = task.done ? "done-card" : "";
    const titleClass = task.done ? "task-title done" : "task-title";

    const card = document.createElement("div");
    card.className = `task-card ${priorityClass} ${doneClass} ${overdue ? "overdue" : ""}`;

    const mainRow = document.createElement("div");
    mainRow.className = "task-main-row";

    const left = document.createElement("div");
    left.className = "task-left";

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      toggleTask(task.id);
    });

    const titleWrap = document.createElement("div");
    titleWrap.className = "task-title-wrap";

    const titleDiv = document.createElement("div");
    titleDiv.className = titleClass;
    titleDiv.textContent = task.title;

    const metaRow = document.createElement("div");
    metaRow.className = "meta-row";

    const priorityTag = document.createElement("span");
    priorityTag.className = "tag";
    priorityTag.textContent = `優先度: ${task.priority}`;

    const dueTag = document.createElement("span");
    dueTag.className = "tag";
    dueTag.textContent = `期限: ${formatDate(task.dueDate)}`;

    const statusTag = document.createElement("span");
    statusTag.className = "tag";
    statusTag.textContent = `状態: ${task.done ? "完了" : "未完了"}`;

    const categoryTag = document.createElement("span");
    categoryTag.className = "tag";
    categoryTag.textContent = `カテゴリー: ${normalizeCategory(task.category)}`;

    metaRow.appendChild(priorityTag);
    metaRow.appendChild(dueTag);
    metaRow.appendChild(statusTag);
    metaRow.appendChild(categoryTag);

    if (overdue) {
      const overdueTag = document.createElement("span");
      overdueTag.className = "tag overdue-tag";
      overdueTag.textContent = "期限切れ";
      metaRow.appendChild(overdueTag);
    }

    titleWrap.appendChild(titleDiv);
    titleWrap.appendChild(metaRow);

    if (task.memo) {
      const memoDiv = document.createElement("div");
      memoDiv.className = "memo";
      memoDiv.textContent = task.memo;
      titleWrap.appendChild(memoDiv);
    }

    left.appendChild(checkbox);
    left.appendChild(titleWrap);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", () => {
      openEditModal(task.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => {
      deleteTask(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    mainRow.appendChild(left);
    mainRow.appendChild(actions);
    card.appendChild(mainRow);
    el.taskList.appendChild(card);
  });

  renderCalendar();
  renderBoard();
}

/**
 * モーダルの外側クリックイベント
 * @param {*} event
 */
function handleModalBackdropClick(event) {
  const target = event.target;
  if (target && target.dataset.close === "true") {
    closeEditModal();
    closeAddModal();
  }
}

/**
 * カレンダー表示からタスク編集モーダル画面を開く
 * @param {*} event
 * @param {*} id タスクID
 */
function openEditFromCalendar(event, id) {
  event.stopPropagation();
  openEditModal(id);
}

/**
 * カンバン表示からタスク編集モーダル画面を開く
 * @param {*} event
 * @param {*} id タスクID
 */
function openEditFromBoard(event, id) {
  event.stopPropagation();
  openEditModal(id);
}

/**
 * カンバン表示からタスク追加モーダル画面を開く
 * @param {*} event
 * @param {*} category カテゴリ
 */
function openAddFromBoard(event, category) {
  event.stopPropagation();
  openAddModal(category);
}

el.addBtn.addEventListener("click", addTask);
el.title.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTask();
});

el.menuAddTaskBtn.addEventListener("click", () => setMainPage("add"));
el.menuTaskViewBtn.addEventListener("click", () => setMainPage("tasks"));
el.menuBackupBtn.addEventListener("click", () => setMainPage("backup"));

el.showListViewBtn.addEventListener("click", () => setView("list"));
el.showBoardViewBtn.addEventListener("click", () => setView("board"));
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
el.clearCompletedBtnBoard.addEventListener("click", clearCompletedTasks);
el.clearDateFilterBtn.addEventListener("click", clearSelectedCalendarDate);
el.clearDateFilterBtnBoard.addEventListener("click", clearSelectedCalendarDate);

el.prevMonthBtn.addEventListener("click", () => {
  currentCalendarDate = new Date(
    currentCalendarDate.getFullYear(),
    currentCalendarDate.getMonth() - 1,
    1,
  );
  renderCalendar();
});

el.nextMonthBtn.addEventListener("click", () => {
  currentCalendarDate = new Date(
    currentCalendarDate.getFullYear(),
    currentCalendarDate.getMonth() + 1,
    1,
  );
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

el.closeAddModalBtn.addEventListener("click", closeAddModal);
el.cancelAddBtn.addEventListener("click", closeAddModal);
el.addModalBtn.addEventListener("click", addTaskFromModal);
el.addModal.addEventListener("click", handleModalBackdropClick);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !el.editModal.classList.contains("hidden"))
    closeEditModal();
});

setView("list");
setMainPage("add");
render();
