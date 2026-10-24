/* ========================================
   Taskflow — To-Do App Logic
   Handles CRUD, filtering, persistence,
   and UI updates with smooth animations.
   ======================================== */

(function () {
  'use strict';

  // ── DOM refs ──────────────────────────
  const form = document.getElementById('add-task-form');
  const taskInput = document.getElementById('task-input');
  const categorySelect = document.getElementById('task-category');
  const prioritySelect = document.getElementById('task-priority');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  const taskCount = document.getElementById('task-count');
  const clearBtn = document.getElementById('clear-completed-btn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const filterIndicator = document.querySelector('.filter-indicator');

  // ── State ─────────────────────────────
  const STORAGE_KEY = 'taskflow_tasks';
  let tasks = loadTasks();
  let currentFilter = 'all';

  // ── Persistence ───────────────────────
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // ── Unique ID generator ───────────────
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Create task object ────────────────
  function createTask(text, category, priority) {
    return {
      id: uid(),
      text: text.trim(),
      category,
      priority,
      completed: false,
      createdAt: Date.now(),
    };
  }

  // ── Render ────────────────────────────
  function render() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = '';

    filtered.forEach((task, i) => {
      const li = document.createElement('li');
      li.className = `task-item${task.completed ? ' completed' : ''}`;
      li.dataset.id = task.id;
      li.style.animationDelay = `${i * 50}ms`;

      li.innerHTML = `
        <label class="task-checkbox">
          <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark as ${task.completed ? 'incomplete' : 'complete'}" />
          <span class="checkmark"></span>
        </label>
        <div class="task-content">
          <span class="task-text">${escapeHTML(task.text)}</span>
          <div class="task-meta">
            <span class="task-badge badge-${task.category}">${capitalize(task.category)}</span>
            <span class="priority-dot priority-${task.priority}" title="${capitalize(task.priority)} priority"></span>
          </div>
        </div>
        <button class="btn-delete" aria-label="Delete task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      // Event: toggle
      li.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTask(task.id));

      // Event: delete
      li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id, li));

      taskList.appendChild(li);
    });

    updateStats();
    updateEmptyState(filtered.length);
  }

  function getFilteredTasks() {
    switch (currentFilter) {
      case 'active':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      default:
        return [...tasks];
    }
  }

  function updateStats() {
    const active = tasks.filter((t) => !t.completed).length;
    const completed = tasks.filter((t) => t.completed).length;
    const total = tasks.length;

    taskCount.textContent = `${total} task${total !== 1 ? 's' : ''}${active > 0 ? ` · ${active} active` : ''}`;
    clearBtn.style.display = completed > 0 ? 'inline-block' : 'none';
  }

  function updateEmptyState(visibleCount) {
    emptyState.classList.toggle('visible', visibleCount === 0);
  }

  // ── Actions ───────────────────────────
  function addTask(text, category, priority) {
    const task = createTask(text, category, priority);
    tasks.unshift(task);
    saveTasks();
    render();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      render();
    }
  }

  function deleteTask(id, li) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
      render();
    });
  }

  function clearCompleted() {
    // Animate each completed item out
    const items = taskList.querySelectorAll('.task-item.completed');
    if (items.length === 0) return;

    items.forEach((el, i) => {
      el.style.animationDelay = `${i * 60}ms`;
      el.classList.add('removing');
    });

    setTimeout(() => {
      tasks = tasks.filter((t) => !t.completed);
      saveTasks();
      render();
    }, items.length * 60 + 300);
  }

  // ── Filtering ─────────────────────────
  function setFilter(filter) {
    currentFilter = filter;

    filterBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === filter));

    // Move indicator
    const idx = ['all', 'active', 'completed'].indexOf(filter);
    filterIndicator.style.transform = `translateX(${idx * 100}%)`;

    render();
  }

  // ── Helpers ───────────────────────────
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Event listeners ───────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    addTask(text, categorySelect.value, prioritySelect.value);
    taskInput.value = '';
    taskInput.focus();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  clearBtn.addEventListener('click', clearCompleted);

  // ── Init ──────────────────────────────
  render();
})();
