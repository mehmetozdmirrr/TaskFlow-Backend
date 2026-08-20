(function () {
  'use strict';

  var STATUS_LABELS = {
    pending: 'Beklemede',
    'in-progress': 'Devam Ediyor',
    completed: 'Tamamlandı',
  };

  var PRIORITY_LABELS = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
  };

  var state = {
    tasks: [],
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    filters: {
      keyword: '',
      status: '',
      priority: '',
      assignee: '',
      order: 'desc',
      limit: 10,
      page: 1,
    },
    listLoading: false,
    listError: false,
    summary: null,
    summaryError: false,
    editingTaskId: null,
    deleteTargetId: null,
    submitting: false,
    deleting: false,
  };

  var listRequestToken = 0;

  var els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    bindEvents();
    fetchSummary();
    fetchTaskList();
  }

  function cacheElements() {
    els.statTotal = document.getElementById('stat-total');
    els.statPending = document.getElementById('stat-pending');
    els.statInProgress = document.getElementById('stat-inprogress');
    els.statCompleted = document.getElementById('stat-completed');
    els.statHighPriority = document.getElementById('stat-highpriority');
    els.statsError = document.getElementById('stats-error');
    els.statsRetryBtn = document.getElementById('stats-retry-btn');

    els.filterForm = document.getElementById('filter-form');
    els.filterKeyword = document.getElementById('filter-keyword');
    els.filterStatus = document.getElementById('filter-status');
    els.filterPriority = document.getElementById('filter-priority');
    els.filterAssignee = document.getElementById('filter-assignee');
    els.filterOrder = document.getElementById('filter-order');
    els.filterLimit = document.getElementById('filter-limit');
    els.resetFiltersBtn = document.getElementById('reset-filters-btn');
    els.modeHint = document.getElementById('mode-hint');

    els.resultCount = document.getElementById('result-count');
    els.listLoading = document.getElementById('list-loading');
    els.listError = document.getElementById('list-error');
    els.listRetryBtn = document.getElementById('list-retry-btn');
    els.listEmpty = document.getElementById('list-empty');
    els.listEmptyText = document.getElementById('list-empty-text');
    els.taskList = document.getElementById('task-list');

    els.pagination = document.getElementById('pagination');
    els.prevPageBtn = document.getElementById('prev-page-btn');
    els.nextPageBtn = document.getElementById('next-page-btn');
    els.pageIndicator = document.getElementById('page-indicator');

    els.newTaskBtn = document.getElementById('new-task-btn');
    els.taskModal = document.getElementById('task-modal');
    els.taskModalTitle = document.getElementById('task-modal-title');
    els.taskModalClose = document.getElementById('task-modal-close');
    els.taskForm = document.getElementById('task-form');
    els.taskId = document.getElementById('task-id');
    els.taskTitle = document.getElementById('task-title');
    els.taskDescription = document.getElementById('task-description');
    els.taskAssignee = document.getElementById('task-assignee');
    els.taskPriority = document.getElementById('task-priority');
    els.taskStatus = document.getElementById('task-status');
    els.taskStatusField = document.getElementById('task-status-field');
    els.taskFormError = document.getElementById('task-form-error');
    els.taskCancelBtn = document.getElementById('task-cancel-btn');
    els.taskSubmitBtn = document.getElementById('task-submit-btn');

    els.deleteModal = document.getElementById('delete-modal');
    els.deleteModalClose = document.getElementById('delete-modal-close');
    els.deleteModalText = document.getElementById('delete-modal-text');
    els.deleteFormError = document.getElementById('delete-form-error');
    els.deleteCancelBtn = document.getElementById('delete-cancel-btn');
    els.deleteConfirmBtn = document.getElementById('delete-confirm-btn');

    els.toastRegion = document.getElementById('toast-region');
  }

  function bindEvents() {
    els.filterKeyword.addEventListener('input', debounce(onFilterKeywordChange, 400));
    els.filterAssignee.addEventListener('input', debounce(onFilterAssigneeChange, 400));
    els.filterStatus.addEventListener('change', onFilterFieldChange('status'));
    els.filterPriority.addEventListener('change', onFilterFieldChange('priority'));
    els.filterOrder.addEventListener('change', onFilterFieldChange('order'));
    els.filterLimit.addEventListener('change', function () {
      state.filters.limit = Number(els.filterLimit.value);
      state.filters.page = 1;
      fetchTaskList();
    });
    els.filterForm.addEventListener('submit', function (e) {
      e.preventDefault();
    });
    els.resetFiltersBtn.addEventListener('click', resetFilters);

    els.statsRetryBtn.addEventListener('click', fetchSummary);
    els.listRetryBtn.addEventListener('click', fetchTaskList);

    els.prevPageBtn.addEventListener('click', function () {
      if (state.filters.page > 1) {
        state.filters.page -= 1;
        fetchTaskList();
      }
    });
    els.nextPageBtn.addEventListener('click', function () {
      if (state.filters.page < state.meta.totalPages) {
        state.filters.page += 1;
        fetchTaskList();
      }
    });

    els.newTaskBtn.addEventListener('click', openCreateModal);
    els.taskModalClose.addEventListener('click', closeTaskModal);
    els.taskCancelBtn.addEventListener('click', closeTaskModal);
    els.taskForm.addEventListener('submit', onTaskFormSubmit);
    els.taskModal.addEventListener('click', function (e) {
      if (e.target === els.taskModal) closeTaskModal();
    });

    els.deleteModalClose.addEventListener('click', closeDeleteModal);
    els.deleteCancelBtn.addEventListener('click', closeDeleteModal);
    els.deleteConfirmBtn.addEventListener('click', onDeleteConfirm);
    els.deleteModal.addEventListener('click', function (e) {
      if (e.target === els.deleteModal) closeDeleteModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!els.deleteModal.hidden) {
        closeDeleteModal();
      } else if (!els.taskModal.hidden) {
        closeTaskModal();
      }
    });
  }

  /* ---------- API helper ---------- */

  function apiFetch(path, options) {
    options = options || {};
    return fetch(path, {
      method: options.method || 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(function (res) {
      return res
        .text()
        .then(function (text) {
          var parsed = null;
          if (text) {
            try {
              parsed = JSON.parse(text);
            } catch (err) {
              parsed = null;
            }
          }
          return { status: res.status, ok: res.ok, body: parsed };
        });
    }).then(function (result) {
      if (!result.ok) {
        var message =
          (result.body && result.body.message) || 'İstek başarısız oldu (' + result.status + ')';
        var errors = (result.body && result.body.errors) || [];
        var error = new Error(message);
        error.status = result.status;
        error.errors = errors;
        throw error;
      }
      return result.body;
    });
  }

  /* ---------- Filters / query building ---------- */

  function onFilterKeywordChange() {
    state.filters.keyword = els.filterKeyword.value.trim();
    if (state.filters.keyword) {
      state.filters.assignee = '';
      els.filterAssignee.value = '';
    }
    state.filters.page = 1;
    fetchTaskList();
  }

  function onFilterAssigneeChange() {
    state.filters.assignee = els.filterAssignee.value.trim();
    if (state.filters.assignee) {
      state.filters.keyword = '';
      els.filterKeyword.value = '';
    }
    state.filters.page = 1;
    fetchTaskList();
  }

  function onFilterFieldChange(field) {
    return function () {
      state.filters[field] = els['filter' + capitalize(field)].value;
      state.filters.page = 1;
      fetchTaskList();
    };
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function resetFilters() {
    state.filters = {
      keyword: '',
      status: '',
      priority: '',
      assignee: '',
      order: 'desc',
      limit: 10,
      page: 1,
    };
    els.filterKeyword.value = '';
    els.filterStatus.value = '';
    els.filterPriority.value = '';
    els.filterAssignee.value = '';
    els.filterOrder.value = 'desc';
    els.filterLimit.value = '10';
    fetchTaskList();
  }

  function resolveMode() {
    if (state.filters.keyword) return 'search';
    if (state.filters.assignee) return 'assignee';
    return 'list';
  }

  function buildEndpointAndParams() {
    var mode = resolveMode();
    var params = new URLSearchParams();

    if (state.filters.status) params.set('status', state.filters.status);
    if (state.filters.priority) params.set('priority', state.filters.priority);
    params.set('sort', 'createdAt');
    if (state.filters.order) params.set('order', state.filters.order);
    if (state.filters.page) params.set('page', String(state.filters.page));
    if (state.filters.limit) params.set('limit', String(state.filters.limit));

    if (mode === 'search') {
      params.set('keyword', state.filters.keyword);
      return { path: '/tasks/search?' + params.toString(), mode: mode };
    }

    if (mode === 'assignee') {
      var name = encodeURIComponent(state.filters.assignee);
      return { path: '/tasks/assignee/' + name + '?' + params.toString(), mode: mode };
    }

    return { path: '/tasks?' + params.toString(), mode: mode };
  }

  function updateModeHint() {
    var mode = resolveMode();
    if (mode === 'search') {
      els.modeHint.hidden = false;
      els.modeHint.textContent = 'Anahtar kelime araması aktif; sorumlu filtresi devre dışı.';
      els.filterAssignee.disabled = true;
    } else if (mode === 'assignee') {
      els.modeHint.hidden = false;
      els.modeHint.textContent = 'Sorumluya göre filtreleme aktif; arama devre dışı.';
      els.filterKeyword.disabled = true;
    } else {
      els.modeHint.hidden = true;
      els.modeHint.textContent = '';
      els.filterAssignee.disabled = false;
      els.filterKeyword.disabled = false;
    }
  }

  /* ---------- Task list fetch/render ---------- */

  function fetchTaskList() {
    updateModeHint();
    var requestId = ++listRequestToken;
    var built = buildEndpointAndParams();

    setListLoading(true);
    setListError(false);

    apiFetch(built.path)
      .then(function (body) {
        if (requestId !== listRequestToken) return;
        state.tasks = (body && body.data) || [];
        state.meta = (body && body.meta) || { total: 0, page: 1, limit: state.filters.limit, totalPages: 0 };
        setListLoading(false);
        renderTaskList();
        renderPagination();
        renderResultCount();
      })
      .catch(function (err) {
        if (requestId !== listRequestToken) return;
        setListLoading(false);
        setListError(true);
        state.tasks = [];
        renderTaskList();
        showToast(err.message || 'Görevler yüklenemedi.', 'error');
      });
  }

  function setListLoading(isLoading) {
    state.listLoading = isLoading;
    els.listLoading.hidden = !isLoading;
    if (isLoading) {
      els.listError.hidden = true;
      els.listEmpty.hidden = true;
    }
  }

  function setListError(hasError) {
    state.listError = hasError;
    els.listError.hidden = !hasError;
    if (hasError) {
      els.taskList.innerHTML = '';
      els.listEmpty.hidden = true;
      els.resultCount.textContent = '';
    }
  }

  function renderResultCount() {
    if (state.listError) {
      els.resultCount.textContent = '';
      return;
    }
    var total = state.meta.total || 0;
    els.resultCount.textContent = total + ' sonuç bulundu.';
  }

  function renderTaskList() {
    els.taskList.innerHTML = '';

    if (state.listError) return;

    if (!state.listLoading && state.tasks.length === 0) {
      var isFiltered = resolveMode() !== 'list' || state.filters.status || state.filters.priority;
      els.listEmptyText.textContent = isFiltered
        ? 'Arama kriterlerinize uygun görev bulunamadı.'
        : 'Henüz görev yok. Yeni bir görev ekleyerek başlayın.';
      els.listEmpty.hidden = false;
      return;
    }

    els.listEmpty.hidden = true;

    state.tasks.forEach(function (task) {
      els.taskList.appendChild(buildTaskCard(task));
    });
  }

  function buildTaskCard(task) {
    var li = document.createElement('li');
    li.className = 'task-card';

    var header = document.createElement('div');
    header.className = 'task-card__header';

    var title = document.createElement('h3');
    title.className = 'task-card__title';
    title.textContent = task.title;
    header.appendChild(title);

    var badges = document.createElement('div');
    badges.className = 'task-card__badges';
    badges.appendChild(buildBadge('status', task.status));
    badges.appendChild(buildBadge('priority', task.priority));
    header.appendChild(badges);

    li.appendChild(header);

    var description = document.createElement('p');
    description.className = 'task-card__description';
    description.textContent = task.description;
    li.appendChild(description);

    var meta = document.createElement('div');
    meta.className = 'task-card__meta';

    var assignee = document.createElement('span');
    assignee.textContent = 'Sorumlu: ' + task.assignee;
    meta.appendChild(assignee);

    var updated = document.createElement('span');
    updated.textContent = 'Güncelleme: ' + formatDate(task.updatedAt);
    meta.appendChild(updated);

    li.appendChild(meta);

    var actions = document.createElement('div');
    actions.className = 'task-card__actions';

    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn--secondary';
    editBtn.textContent = 'Düzenle';
    editBtn.setAttribute('aria-label', "'" + task.title + "' görevini düzenle");
    editBtn.addEventListener('click', function () {
      openEditModal(task);
    });
    actions.appendChild(editBtn);

    var deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--danger';
    deleteBtn.textContent = 'Sil';
    deleteBtn.setAttribute('aria-label', "'" + task.title + "' görevini sil");
    deleteBtn.addEventListener('click', function () {
      openDeleteModal(task);
    });
    actions.appendChild(deleteBtn);

    li.appendChild(actions);

    return li;
  }

  function buildBadge(kind, value) {
    var span = document.createElement('span');
    var labels = kind === 'status' ? STATUS_LABELS : PRIORITY_LABELS;
    span.className = 'badge badge--' + kind + '-' + value;
    span.textContent = labels[value] || value;
    return span;
  }

  function formatDate(isoString) {
    if (!isoString) return '-';
    var date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderPagination() {
    var totalPages = state.meta.totalPages || 0;
    var page = state.meta.page || state.filters.page;

    if (totalPages === 0) {
      els.pagination.hidden = true;
      return;
    }

    els.pagination.hidden = false;
    els.pageIndicator.textContent = 'Sayfa ' + page + ' / ' + totalPages;
    els.prevPageBtn.disabled = page <= 1;
    els.nextPageBtn.disabled = page >= totalPages;
  }

  /* ---------- Statistics ---------- */

  function fetchSummary() {
    els.statsError.hidden = true;
    apiFetch('/reports/summary')
      .then(function (body) {
        state.summary = (body && body.data) || null;
        renderSummary();
      })
      .catch(function () {
        state.summaryError = true;
        els.statsError.hidden = false;
      });
  }

  function renderSummary() {
    if (!state.summary) return;
    els.statTotal.textContent = state.summary.total;
    els.statPending.textContent = state.summary.pending;
    els.statInProgress.textContent = state.summary.inProgress;
    els.statCompleted.textContent = state.summary.completed;
    els.statHighPriority.textContent = state.summary.highPriority;
    els.statsError.hidden = true;
    state.summaryError = false;
  }

  /* ---------- Create / Edit modal ---------- */

  var lastFocusedElement = null;

  function openCreateModal() {
    state.editingTaskId = null;
    els.taskModalTitle.textContent = 'Yeni Görev Oluştur';
    els.taskForm.reset();
    els.taskId.value = '';
    els.taskPriority.value = 'medium';
    els.taskStatusField.hidden = true;
    els.taskStatus.required = false;
    clearFormErrors();
    openModal(els.taskModal, els.taskTitle);
  }

  function openEditModal(task) {
    state.editingTaskId = task.id;
    els.taskModalTitle.textContent = 'Görevi Düzenle';
    els.taskId.value = task.id;
    els.taskTitle.value = task.title;
    els.taskDescription.value = task.description;
    els.taskAssignee.value = task.assignee;
    els.taskPriority.value = task.priority;
    els.taskStatus.value = task.status;
    els.taskStatusField.hidden = false;
    els.taskStatus.required = true;
    clearFormErrors();
    openModal(els.taskModal, els.taskTitle);
  }

  function closeTaskModal() {
    closeModal(els.taskModal);
  }

  function clearFormErrors() {
    els.taskFormError.hidden = true;
    els.taskFormError.textContent = '';
    ['title', 'description', 'assignee'].forEach(function (field) {
      var errorEl = document.getElementById('task-' + field + '-error');
      if (errorEl) errorEl.textContent = '';
    });
  }

  function validateTaskFormClientSide() {
    var errors = {};
    var title = els.taskTitle.value.trim();
    var description = els.taskDescription.value.trim();
    var assignee = els.taskAssignee.value.trim();

    if (title.length < 3 || title.length > 100) {
      errors.title = 'Başlık 3-100 karakter arasında olmalıdır.';
    }
    if (description.length < 10 || description.length > 500) {
      errors.description = 'Açıklama 10-500 karakter arasında olmalıdır.';
    }
    if (assignee.length < 2) {
      errors.assignee = 'Sorumlu en az 2 karakter olmalıdır.';
    }

    Object.keys(errors).forEach(function (field) {
      var errorEl = document.getElementById('task-' + field + '-error');
      if (errorEl) errorEl.textContent = errors[field];
    });

    return Object.keys(errors).length === 0;
  }

  function onTaskFormSubmit(e) {
    e.preventDefault();
    if (state.submitting) return;

    clearFormErrors();
    if (!validateTaskFormClientSide()) return;

    var payload = {
      title: els.taskTitle.value.trim(),
      description: els.taskDescription.value.trim(),
      assignee: els.taskAssignee.value.trim(),
      priority: els.taskPriority.value,
    };

    var isEdit = Boolean(state.editingTaskId);
    if (isEdit) {
      payload.status = els.taskStatus.value;
    }

    state.submitting = true;
    els.taskSubmitBtn.disabled = true;
    els.taskSubmitBtn.textContent = 'Kaydediliyor...';

    var request = isEdit
      ? apiFetch('/tasks/' + state.editingTaskId, { method: 'PUT', body: payload })
      : apiFetch('/tasks', { method: 'POST', body: payload });

    request
      .then(function () {
        showToast(isEdit ? 'Görev güncellendi.' : 'Görev oluşturuldu.', 'success');
        closeTaskModal();
        fetchTaskList();
        fetchSummary();
      })
      .catch(function (err) {
        if (err.errors && err.errors.length > 0) {
          els.taskFormError.textContent = err.errors.join(' ');
        } else {
          els.taskFormError.textContent = err.message || 'Bir hata oluştu.';
        }
        els.taskFormError.hidden = false;
      })
      .finally(function () {
        state.submitting = false;
        els.taskSubmitBtn.disabled = false;
        els.taskSubmitBtn.textContent = 'Kaydet';
      });
  }

  /* ---------- Delete modal ---------- */

  var deleteTargetTask = null;

  function openDeleteModal(task) {
    deleteTargetTask = task;
    state.deleteTargetId = task.id;
    els.deleteModalText.textContent = "'" + task.title + "' görevini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.";
    els.deleteFormError.hidden = true;
    els.deleteFormError.textContent = '';
    openModal(els.deleteModal, els.deleteCancelBtn);
  }

  function closeDeleteModal() {
    deleteTargetTask = null;
    state.deleteTargetId = null;
    closeModal(els.deleteModal);
  }

  function onDeleteConfirm() {
    if (state.deleting || !deleteTargetTask) return;

    state.deleting = true;
    els.deleteConfirmBtn.disabled = true;
    els.deleteConfirmBtn.textContent = 'Siliniyor...';

    var taskId = deleteTargetTask.id;

    apiFetch('/tasks/' + taskId, { method: 'DELETE' })
      .then(function () {
        showToast('Görev silindi.', 'success');
        closeDeleteModal();

        var isLastItemOnPage = state.tasks.length === 1;
        if (isLastItemOnPage && state.filters.page > 1) {
          state.filters.page -= 1;
        }
        fetchTaskList();
        fetchSummary();
      })
      .catch(function (err) {
        els.deleteFormError.textContent = err.message || 'Görev silinemedi.';
        els.deleteFormError.hidden = false;
      })
      .finally(function () {
        state.deleting = false;
        els.deleteConfirmBtn.disabled = false;
        els.deleteConfirmBtn.textContent = 'Sil';
      });
  }

  /* ---------- Modal helpers ---------- */

  function openModal(modalEl, focusEl) {
    lastFocusedElement = document.activeElement;
    modalEl.hidden = false;
    if (focusEl) {
      focusEl.focus();
    }
  }

  function closeModal(modalEl) {
    modalEl.hidden = true;
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  /* ---------- Toasts ---------- */

  function showToast(message, kind) {
    var toast = document.createElement('div');
    toast.className = 'toast' + (kind ? ' toast--' + kind : '');
    toast.textContent = message;
    els.toastRegion.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  /* ---------- Utils ---------- */

  function debounce(fn, delay) {
    var timerId = null;
    return function () {
      var args = arguments;
      var context = this;
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }
})();
