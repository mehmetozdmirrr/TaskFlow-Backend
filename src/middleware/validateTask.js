const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];
const ALLOWED_STATUSES = ['pending', 'in-progress', 'completed'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateTitle(title, errors) {
  if (!isNonEmptyString(title)) {
    errors.push('Title is required');
    return;
  }
  const length = title.trim().length;
  if (length < 3 || length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }
}

function validateDescription(description, errors) {
  if (!isNonEmptyString(description)) {
    errors.push('Description is required');
    return;
  }
  const length = description.trim().length;
  if (length < 10 || length > 500) {
    errors.push('Description must be between 10 and 500 characters');
  }
}

function validateAssignee(assignee, errors) {
  if (!isNonEmptyString(assignee)) {
    errors.push('Assignee is required');
    return;
  }
  if (assignee.trim().length < 2) {
    errors.push('Assignee must be at least 2 characters');
  }
}

function validatePriority(priority, errors, { required }) {
  if (priority === undefined) {
    if (required) {
      errors.push('Priority is required');
    }
    return;
  }
  if (!ALLOWED_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`);
  }
}

function validateStatus(status, errors, { required }) {
  if (status === undefined) {
    if (required) {
      errors.push('Status is required');
    }
    return;
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }
}

function respondWithValidationErrors(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}

function validateCreateTask(req, res, next) {
  const errors = [];
  const { title, description, assignee, priority, status } = req.body || {};

  validateTitle(title, errors);
  validateDescription(description, errors);
  validateAssignee(assignee, errors);
  validatePriority(priority, errors, { required: true });
  validateStatus(status, errors, { required: false });

  if (errors.length > 0) {
    return respondWithValidationErrors(res, errors);
  }

  next();
}

function validateUpdateTask(req, res, next) {
  const errors = [];
  const { title, description, assignee, priority, status } = req.body || {};

  validateTitle(title, errors);
  validateDescription(description, errors);
  validateAssignee(assignee, errors);
  validatePriority(priority, errors, { required: true });
  validateStatus(status, errors, { required: true });

  if (errors.length > 0) {
    return respondWithValidationErrors(res, errors);
  }

  next();
}

module.exports = { validateCreateTask, validateUpdateTask };
