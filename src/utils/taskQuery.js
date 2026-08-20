const ALLOWED_STATUSES = ['pending', 'in-progress', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];
const ALLOWED_SORT_FIELDS = ['createdAt'];
const ALLOWED_ORDERS = ['asc', 'desc'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;

class QueryValidationError extends Error {
  constructor(errors) {
    super('Query validation failed');
    this.errors = errors;
  }
}

function filterByStatus(tasks, status, errors) {
  if (status === undefined) {
    return tasks;
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    return tasks;
  }
  return tasks.filter((task) => task.status === status);
}

function filterByPriority(tasks, priority, errors) {
  if (priority === undefined) {
    return tasks;
  }
  if (!ALLOWED_PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`);
    return tasks;
  }
  return tasks.filter((task) => task.priority === priority);
}

function filterByKeyword(tasks, keyword) {
  if (keyword === undefined) {
    return tasks;
  }
  const needle = keyword.trim().toLowerCase();
  if (needle.length === 0) {
    return tasks;
  }
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(needle) || task.description.toLowerCase().includes(needle)
  );
}

function sortTasks(tasks, sort, order, errors) {
  if (sort === undefined && order === undefined) {
    return tasks;
  }

  const sortField = sort === undefined ? ALLOWED_SORT_FIELDS[0] : sort;
  const sortOrder = order === undefined ? 'asc' : order;

  if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
    errors.push(`sort must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`);
  }
  if (!ALLOWED_ORDERS.includes(sortOrder)) {
    errors.push(`order must be one of: ${ALLOWED_ORDERS.join(', ')}`);
  }
  if (!ALLOWED_SORT_FIELDS.includes(sortField) || !ALLOWED_ORDERS.includes(sortOrder)) {
    return tasks;
  }

  return [...tasks].sort((a, b) => {
    const diff = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
    return sortOrder === 'desc' ? -diff : diff;
  });
}

function parsePagination(query, errors) {
  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  if (query.page !== undefined) {
    const raw = String(query.page);
    if (!POSITIVE_INTEGER_PATTERN.test(raw) || Number(raw) < 1) {
      errors.push('page must be a positive integer');
    } else {
      page = Number(raw);
    }
  }

  if (query.limit !== undefined) {
    const raw = String(query.limit);
    if (!POSITIVE_INTEGER_PATTERN.test(raw) || Number(raw) < 1) {
      errors.push('limit must be a positive integer');
    } else {
      limit = Number(raw);
    }
  }

  return { page, limit };
}

function applyListQuery(tasks, query, { allowKeyword = false } = {}) {
  const errors = [];

  let result = filterByStatus(tasks, query.status, errors);
  result = filterByPriority(result, query.priority, errors);

  if (allowKeyword) {
    result = filterByKeyword(result, query.keyword);
  }

  result = sortTasks(result, query.sort, query.order, errors);

  const { page, limit } = parsePagination(query, errors);

  if (errors.length > 0) {
    throw new QueryValidationError(errors);
  }

  const total = result.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const items = result.slice(startIndex, startIndex + limit);

  return {
    items,
    meta: { total, page, limit, totalPages },
  };
}

module.exports = { applyListQuery, QueryValidationError };
