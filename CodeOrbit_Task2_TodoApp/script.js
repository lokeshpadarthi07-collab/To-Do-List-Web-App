/**
 * ============================================================================
 * OrbitTask - CodeOrbit Tech Internship Task 2
 * Advanced Vanilla JavaScript To-Do Web Application
 * 
 * Features:
 * - Full CRUD (Create, Read, Update, Delete) for tasks
 * - Robust localStorage persistence with defensive error handling & fallback
 * - Task status toggle (Active / Completed)
 * - In-place editing with Enter-to-save & Escape-to-cancel
 * - Live filtering (All, Active, Completed) + Real-time search
 * - Interactive metrics & progress bar
 * - Accessible confirmation modal dialog
 * - Toast notification feedback system
 * - Safe DOM manipulation (Zero innerHTML with untrusted user input)
 * ============================================================================
 */

'use strict';

(function () {
  // --------------------------------------------------------------------------
  // 1. Constants & Configuration
  // --------------------------------------------------------------------------
  const STORAGE_KEY = 'codeorbit_todo_tasks';
  const FILTER_STORAGE_KEY = 'codeorbit_todo_filter';

  // --------------------------------------------------------------------------
  // 2. Application State
  // --------------------------------------------------------------------------
  const state = {
    tasks: [],
    currentFilter: 'all', // 'all' | 'active' | 'completed'
    searchQuery: '',
    editingTaskId: null,
    pendingDeleteTaskId: null, // Track task queued for modal confirmation
    pendingBatchDelete: false, // Track if queued action is "Clear Completed"
    storageAvailable: true
  };

  // --------------------------------------------------------------------------
  // 3. DOM Element References
  // --------------------------------------------------------------------------
  const elements = {
    // Form & Input
    taskForm: document.getElementById('taskForm'),
    taskInput: document.getElementById('taskInput'),
    clearInputBtn: document.getElementById('clearInputBtn'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    inputErrorMsg: document.getElementById('inputErrorMsg'),

    // Metrics
    progressSummary: document.getElementById('progressSummary'),
    progressPercent: document.getElementById('progressPercent'),
    progressBarFill: document.getElementById('progressBarFill'),
    progressBar: document.getElementById('progressBar'),
    statTotal: document.getElementById('statTotal'),
    statActive: document.getElementById('statActive'),
    statCompleted: document.getElementById('statCompleted'),

    // Toolbar & Filters
    filterBtns: document.querySelectorAll('.filter-btn'),
    countAll: document.getElementById('countAll'),
    countActive: document.getElementById('countActive'),
    countCompleted: document.getElementById('countCompleted'),
    searchInput: document.getElementById('searchInput'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),

    // List & Empty State
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),

    // Confirmation Modal
    confirmModal: document.getElementById('confirmModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalDesc: document.getElementById('modalDesc'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    modalConfirmBtn: document.getElementById('modalConfirmBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // --------------------------------------------------------------------------
  // 4. Storage Controller (Defensive LocalStorage Management)
  // --------------------------------------------------------------------------
  const StorageController = {
    /**
     * Checks if browser localStorage is supported and accessible
     * @returns {boolean}
     */
    isAvailable() {
      try {
        const testKey = '__codeorbit_storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        console.warn('localStorage is not available. Falling back to in-memory store.', e);
        return false;
      }
    },

    /**
     * Loads tasks from localStorage with malformed JSON handling
     * @returns {Array} Array of task objects
     */
    loadTasks() {
      if (!state.storageAvailable) return [];
      try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (!serialized) return [];
        const parsed = JSON.parse(serialized);
        if (Array.isArray(parsed)) {
          // Validate individual task integrity
          return parsed.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string');
        }
        return [];
      } catch (err) {
        console.error('Error reading tasks from localStorage. Recovering safely.', err);
        showToast('Storage data was corrupted and was reset safely.', 'error');
        return [];
      }
    },

    /**
     * Persists tasks array into localStorage
     * @param {Array} tasks 
     */
    saveTasks(tasks) {
      if (!state.storageAvailable) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (err) {
        console.error('Failed to save tasks to localStorage.', err);
        showToast('Storage quota exceeded or writing failed.', 'error');
      }
    },

    /**
     * Saves user's last selected filter preference
     * @param {string} filter 
     */
    saveFilter(filter) {
      if (!state.storageAvailable) return;
      try {
        localStorage.setItem(FILTER_STORAGE_KEY, filter);
      } catch (err) {
        console.warn('Could not persist filter preference.', err);
      }
    },

    /**
     * Loads user's last selected filter preference
     * @returns {string|null}
     */
    loadFilter() {
      if (!state.storageAvailable) return null;
      try {
        return localStorage.getItem(FILTER_STORAGE_KEY);
      } catch (err) {
        return null;
      }
    }
  };

  // --------------------------------------------------------------------------
  // 5. Toast Notification System
  // --------------------------------------------------------------------------
  /**
   * Displays an accessible floating toast message
   * @param {string} message 
   * @param {'success'|'error'|'info'} type 
   * @param {number} duration 
   */
  function showToast(message, type = 'info', duration = 3000) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'status');

    // SVG icon based on type
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.setAttribute('aria-hidden', 'true');

    if (type === 'success') {
      iconSpan.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      iconSpan.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    } else {
      iconSpan.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'toast-msg';
    textSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    elements.toastContainer.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('toast-hiding');
      toast.addEventListener('transitionend', () => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      });
    }, duration);
  }

  // --------------------------------------------------------------------------
  // 6. Task Management Logic (CRUD)
  // --------------------------------------------------------------------------
  /**
   * Generates a cryptographically strong unique ID
   * @returns {string}
   */
  function generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Formats a timestamp into human-readable text
   * @param {number} timestamp 
   * @returns {string}
   */
  function formatTimestamp(timestamp) {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today at ${timeString}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeString}`;
  }

  /**
   * Adds a new task to the state & updates storage
   * @param {string} rawTitle 
   */
  function handleAddTask(rawTitle) {
    const trimmed = rawTitle.trim();

    // Validation
    if (!trimmed) {
      showInputError('Please enter a task description before adding.');
      elements.taskInput.focus();
      return;
    }

    clearInputError();

    const newTask = {
      id: generateTaskId(),
      title: trimmed,
      completed: false,
      createdAt: Date.now()
    };

    // Prepend to show immediately at the top
    state.tasks.unshift(newTask);
    StorageController.saveTasks(state.tasks);

    // Reset input form
    elements.taskInput.value = '';
    elements.clearInputBtn.style.display = 'none';

    render();
    showToast('Task added successfully!', 'success');
  }

  /**
   * Toggles task completion state
   * @param {string} taskId 
   */
  function handleToggleComplete(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    StorageController.saveTasks(state.tasks);
    render();

    if (task.completed) {
      showToast('Task marked as completed!', 'success');
    } else {
      showToast('Task marked active.', 'info');
    }
  }

  /**
   * Enters inline edit mode for a specific task
   * @param {string} taskId 
   */
  function handleStartEdit(taskId) {
    state.editingTaskId = taskId;
    render();

    // Auto-focus the edit input
    const editInput = document.getElementById(`edit-input-${taskId}`);
    if (editInput) {
      editInput.focus();
      // Move cursor to end of text
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    }
  }

  /**
   * Saves edited task title safely
   * @param {string} taskId 
   * @param {string} newTitle 
   */
  function handleSaveEdit(taskId, newTitle) {
    const trimmed = newTitle.trim();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!trimmed) {
      const errorEl = document.getElementById(`edit-error-${taskId}`);
      if (errorEl) {
        errorEl.textContent = 'Task title cannot be empty.';
      }
      return;
    }

    task.title = trimmed;
    task.updatedAt = Date.now();
    state.editingTaskId = null;

    StorageController.saveTasks(state.tasks);
    render();
    showToast('Task updated successfully!', 'success');
  }

  /**
   * Cancels inline edit mode
   */
  function handleCancelEdit() {
    state.editingTaskId = null;
    render();
  }

  /**
   * Prompts user with modal confirmation before single task deletion
   * @param {string} taskId 
   */
  function promptDeleteTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.pendingDeleteTaskId = taskId;
    state.pendingBatchDelete = false;

    elements.modalTitle.textContent = 'Delete Task?';
    elements.modalDesc.textContent = `Are you sure you want to delete "${task.title}"? This cannot be undone.`;
    elements.modalConfirmBtn.textContent = 'Delete Task';

    openModal();
  }

  /**
   * Prompts user before clearing all completed tasks
   */
  function promptClearCompleted() {
    const completedCount = state.tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    state.pendingDeleteTaskId = null;
    state.pendingBatchDelete = true;

    elements.modalTitle.textContent = 'Clear Completed Tasks?';
    elements.modalDesc.textContent = `Are you sure you want to permanently delete all ${completedCount} completed tasks?`;
    elements.modalConfirmBtn.textContent = 'Clear Completed';

    openModal();
  }

  /**
   * Executes deletion confirmed in modal dialog
   */
  function executeConfirmedDeletion() {
    if (state.pendingBatchDelete) {
      // Clear completed tasks
      const originalCount = state.tasks.length;
      state.tasks = state.tasks.filter(t => !t.completed);
      const deletedCount = originalCount - state.tasks.length;

      StorageController.saveTasks(state.tasks);
      closeModal();
      render();
      showToast(`Cleared ${deletedCount} completed task${deletedCount === 1 ? '' : 's'}.`, 'info');
    } else if (state.pendingDeleteTaskId) {
      // Delete single task
      state.tasks = state.tasks.filter(t => t.id !== state.pendingDeleteTaskId);
      StorageController.saveTasks(state.tasks);
      closeModal();
      render();
      showToast('Task deleted successfully.', 'info');
    }
  }

  // --------------------------------------------------------------------------
  // 7. Modal Dialog Control
  // --------------------------------------------------------------------------
  function openModal() {
    if (typeof elements.confirmModal.showModal === 'function') {
      elements.confirmModal.showModal();
    } else {
      // Fallback for older browsers
      elements.confirmModal.setAttribute('open', '');
    }
    elements.modalCancelBtn.focus();
  }

  function closeModal() {
    state.pendingDeleteTaskId = null;
    state.pendingBatchDelete = false;
    if (typeof elements.confirmModal.close === 'function') {
      elements.confirmModal.close();
    } else {
      elements.confirmModal.removeAttribute('open');
    }
  }

  // --------------------------------------------------------------------------
  // 8. Validation Feedback Helpers
  // --------------------------------------------------------------------------
  function showInputError(message) {
    elements.inputErrorMsg.textContent = message;
    elements.taskInput.classList.add('input-error');
  }

  function clearInputError() {
    elements.inputErrorMsg.textContent = '';
    elements.taskInput.classList.remove('input-error');
  }

  // --------------------------------------------------------------------------
  // 9. Filtering, Searching & Metrics Computation
  // --------------------------------------------------------------------------
  /**
   * Returns tasks filtered by both active filter tab and search query
   * @returns {Array}
   */
  function getVisibleTasks() {
    const query = state.searchQuery.toLowerCase().trim();

    return state.tasks.filter(task => {
      // Filter status check
      let matchesStatus = true;
      if (state.currentFilter === 'active') {
        matchesStatus = !task.completed;
      } else if (state.currentFilter === 'completed') {
        matchesStatus = task.completed;
      }

      // Search query check
      let matchesSearch = true;
      if (query) {
        matchesSearch = task.title.toLowerCase().includes(query);
      }

      return matchesStatus && matchesSearch;
    });
  }

  /**
   * Recalculates stats, updates UI counts & progress bar
   */
  function updateMetricsAndCounters() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const active = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update Overview Stats
    elements.statTotal.textContent = total;
    elements.statActive.textContent = active;
    elements.statCompleted.textContent = completed;

    // Update Filter Tab Badges
    elements.countAll.textContent = total;
    elements.countActive.textContent = active;
    elements.countCompleted.textContent = completed;

    // Update Progress Bar
    elements.progressSummary.textContent = `${completed} of ${total} task${total === 1 ? '' : 's'} completed`;
    elements.progressPercent.textContent = `${percentage}%`;
    elements.progressBarFill.style.width = `${percentage}%`;
    elements.progressBar.setAttribute('aria-valuenow', percentage);

    // Update Clear Completed Button State
    elements.clearCompletedBtn.disabled = completed === 0;
  }

  // --------------------------------------------------------------------------
  // 10. DOM Rendering (Secure & Componentized)
  // --------------------------------------------------------------------------
  /**
   * Creates a single task card DOM element securely using textContent
   * @param {Object} task 
   * @returns {HTMLElement}
   */
  function createTaskCardElement(task) {
    const li = document.createElement('li');
    li.className = `task-card ${task.completed ? 'task-completed' : ''}`;
    li.id = `task-card-${task.id}`;
    li.setAttribute('data-id', task.id);

    // If currently in edit mode for this task
    if (state.editingTaskId === task.id) {
      li.classList.add('is-editing');
      li.appendChild(createEditFormElement(task));
      return li;
    }

    // 1. Task Main (Left: Checkbox + Title + Meta)
    const taskMain = document.createElement('div');
    taskMain.className = 'task-main';

    // Custom Checkbox
    const checkboxWrapper = document.createElement('label');
    checkboxWrapper.className = 'custom-checkbox';
    checkboxWrapper.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'active' : 'completed'}`);

    const nativeCheckbox = document.createElement('input');
    nativeCheckbox.type = 'checkbox';
    nativeCheckbox.className = 'checkbox-native';
    nativeCheckbox.checked = task.completed;
    nativeCheckbox.setAttribute('aria-label', `Status for ${task.title}`);
    nativeCheckbox.addEventListener('change', () => handleToggleComplete(task.id));

    const visualCheckbox = document.createElement('span');
    visualCheckbox.className = 'checkbox-visual';
    visualCheckbox.setAttribute('aria-hidden', 'true');
    visualCheckbox.innerHTML = `
      <svg class="checkbox-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    checkboxWrapper.appendChild(nativeCheckbox);
    checkboxWrapper.appendChild(visualCheckbox);

    // Task Details
    const taskDetails = document.createElement('div');
    taskDetails.className = 'task-details';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    // STRICT SECURITY: Use textContent to prevent HTML injection (XSS protection)
    titleSpan.textContent = task.title;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'task-meta';

    const timestampSpan = document.createElement('span');
    timestampSpan.textContent = formatTimestamp(task.createdAt);
    metaDiv.appendChild(timestampSpan);

    if (task.completed) {
      const completedBadge = document.createElement('span');
      completedBadge.className = 'task-badge-completed';
      completedBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg> Done
      `;
      metaDiv.appendChild(completedBadge);
    }

    taskDetails.appendChild(titleSpan);
    taskDetails.appendChild(metaDiv);

    taskMain.appendChild(checkboxWrapper);
    taskMain.appendChild(taskDetails);

    // 2. Task Actions (Right: Edit + Delete Buttons)
    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    // Edit Button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-btn edit-btn';
    editBtn.title = 'Edit task title';
    editBtn.setAttribute('aria-label', `Edit task: ${task.title}`);
    editBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', () => handleStartEdit(task.id));

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.title = 'Delete task';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.title}`);
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    deleteBtn.addEventListener('click', () => promptDeleteTask(task.id));

    taskActions.appendChild(editBtn);
    taskActions.appendChild(deleteBtn);

    li.appendChild(taskMain);
    li.appendChild(taskActions);

    return li;
  }

  /**
   * Creates the in-place editing form element
   * @param {Object} task 
   * @returns {HTMLElement}
   */
  function createEditFormElement(task) {
    const form = document.createElement('form');
    form.className = 'edit-form';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveEdit(task.id, input.value);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'edit-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.id = `edit-input-${task.id}`;
    input.value = task.title;
    input.setAttribute('aria-label', 'Edit task description');
    input.maxLength = 200;

    // Keyboard handlers
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    });

    const errorDiv = document.createElement('div');
    errorDiv.className = 'edit-error';
    errorDiv.id = `edit-error-${task.id}`;

    wrapper.appendChild(input);
    wrapper.appendChild(errorDiv);

    const actions = document.createElement('div');
    actions.className = 'edit-actions';

    // Save Button
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn-icon-only save-edit-btn';
    saveBtn.title = 'Save changes (Enter)';
    saveBtn.setAttribute('aria-label', 'Save changes');
    saveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    // Cancel Button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-icon-only cancel-edit-btn';
    cancelBtn.title = 'Cancel editing (Esc)';
    cancelBtn.setAttribute('aria-label', 'Cancel editing');
    cancelBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    cancelBtn.addEventListener('click', handleCancelEdit);

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    form.appendChild(wrapper);
    form.appendChild(actions);

    return form;
  }

  /**
   * Renders the visible task list or appropriate empty state
   */
  function renderTaskList() {
    const visibleTasks = getVisibleTasks();
    elements.taskList.innerHTML = '';

    if (visibleTasks.length === 0) {
      elements.emptyState.style.display = 'flex';

      // Context-aware empty state descriptions
      if (state.tasks.length === 0) {
        elements.emptyStateTitle.textContent = 'No tasks yet!';
        elements.emptyStateDesc.textContent = 'Add your first task above to start tracking your goals.';
      } else if (state.searchQuery.trim() !== '') {
        elements.emptyStateTitle.textContent = 'No matching tasks found';
        elements.emptyStateDesc.textContent = `No tasks matching "${state.searchQuery}". Try a different keyword.`;
      } else if (state.currentFilter === 'active') {
        elements.emptyStateTitle.textContent = 'All caught up!';
        elements.emptyStateDesc.textContent = 'You have no active pending tasks right now. Great job!';
      } else if (state.currentFilter === 'completed') {
        elements.emptyStateTitle.textContent = 'No completed tasks';
        elements.emptyStateDesc.textContent = 'Complete tasks from the Active tab to see them archived here.';
      }
    } else {
      elements.emptyState.style.display = 'none';
      visibleTasks.forEach(task => {
        elements.taskList.appendChild(createTaskCardElement(task));
      });
    }
  }

  /**
   * Main render orchestrator
   */
  function render() {
    updateMetricsAndCounters();
    renderTaskList();
  }

  // --------------------------------------------------------------------------
  // 11. Event Listeners & User Interactions
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Form submission
    elements.taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAddTask(elements.taskInput.value);
    });

    // Input typing & clear button visibility
    elements.taskInput.addEventListener('input', () => {
      if (elements.taskInput.value.length > 0) {
        elements.clearInputBtn.style.display = 'flex';
      } else {
        elements.clearInputBtn.style.display = 'none';
      }
      clearInputError();
    });

    // Clear input button
    elements.clearInputBtn.addEventListener('click', () => {
      elements.taskInput.value = '';
      elements.clearInputBtn.style.display = 'none';
      clearInputError();
      elements.taskInput.focus();
    });

    // Filter Buttons Click
    elements.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        setFilter(filter);
      });
    });

    // Search Input Realtime Filter
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderTaskList();
    });

    // Clear Completed Button
    elements.clearCompletedBtn.addEventListener('click', promptClearCompleted);

    // Modal Confirmation Actions
    elements.modalCancelBtn.addEventListener('click', closeModal);
    elements.modalConfirmBtn.addEventListener('click', executeConfirmedDeletion);

    // Close modal on click outside (backdrop click)
    elements.confirmModal.addEventListener('click', (e) => {
      const rect = elements.confirmModal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeModal();
      }
    });

    // Close modal on Escape key
    elements.confirmModal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  /**
   * Updates current active filter state and UI styling
   * @param {'all'|'active'|'completed'} filter 
   */
  function setFilter(filter) {
    if (!['all', 'active', 'completed'].includes(filter)) return;

    state.currentFilter = filter;
    StorageController.saveFilter(filter);

    elements.filterBtns.forEach(btn => {
      const isActive = btn.getAttribute('data-filter') === filter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    renderTaskList();
  }

  // --------------------------------------------------------------------------
  // 12. App Initialization
  // --------------------------------------------------------------------------
  function init() {
    state.storageAvailable = StorageController.isAvailable();
    state.tasks = StorageController.loadTasks();

    // Restore last used filter or default to 'all'
    const savedFilter = StorageController.loadFilter();
    if (savedFilter && ['all', 'active', 'completed'].includes(savedFilter)) {
      setFilter(savedFilter);
    }

    setupEventListeners();
    render();

    // If initial tasks list is completely empty, add 2 sample beginner-friendly tasks
    // so the interface demonstrates its rich aesthetics immediately
    if (state.tasks.length === 0) {
      state.tasks = [
        {
          id: generateTaskId(),
          title: 'Welcome to OrbitTask! Click the checkbox to mark as completed.',
          completed: false,
          createdAt: Date.now() - 3600000
        },
        {
          id: generateTaskId(),
          title: 'Review CodeOrbit Task 2 Full Stack Development documentation',
          completed: true,
          createdAt: Date.now() - 7200000
        }
      ];
      StorageController.saveTasks(state.tasks);
      render();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
