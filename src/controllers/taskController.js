const { readTasks, writeTasks } = require('../utils/file');
const { applyListQuery, QueryValidationError } = require('../utils/taskQuery');

const ALLOWED_STATUSES = ['pending', 'in-progress', 'completed'];
const DEFAULT_STATUS = 'pending';

function normalizeStrings(body) {
  return {
    title: body.title.trim(),
    description: body.description.trim(),
    assignee: body.assignee.trim(),
    priority: body.priority,
  };
}

function generateUniqueId(tasks) {
  const existingIds = new Set(tasks.map((task) => task.id));
  let id = Date.now();
  while (existingIds.has(id)) {
    id += 1;
  }
  return id;
}

function notFoundResponse(res) {
  return res.status(404).json({
    success: false,
    message: 'Task not found',
    errors: [],
  });
}

async function createTask(req, res, next) {
  try {
    const tasks = await readTasks();
    const { title, description, assignee, priority } = normalizeStrings(req.body);
    const status = ALLOWED_STATUSES.includes(req.body.status) ? req.body.status : DEFAULT_STATUS;
    const now = new Date().toISOString();

    const newTask = {
      id: generateUniqueId(tasks),
      title,
      description,
      priority,
      assignee,
      status,
      createdAt: now,
      updatedAt: now,
    };

    tasks.push(newTask);
    await writeTasks(tasks);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask,
    });
  } catch (err) {
    next(err);
  }
}

function respondWithQueryValidationError(res, err) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: err.errors,
  });
}

async function listTasks(req, res, next) {
  try {
    const tasks = await readTasks();
    const { items, meta } = applyListQuery(tasks, req.query);

    res.status(200).json({
      success: true,
      data: items,
      meta,
    });
  } catch (err) {
    if (err instanceof QueryValidationError) {
      return respondWithQueryValidationError(res, err);
    }
    next(err);
  }
}

async function searchTasks(req, res, next) {
  try {
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';

    if (keyword.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['keyword query parameter is required'],
      });
    }

    const tasks = await readTasks();
    const { items, meta } = applyListQuery(
      tasks,
      { ...req.query, keyword },
      { allowKeyword: true }
    );

    res.status(200).json({
      success: true,
      data: items,
      meta,
    });
  } catch (err) {
    if (err instanceof QueryValidationError) {
      return respondWithQueryValidationError(res, err);
    }
    next(err);
  }
}

async function listTasksByAssignee(req, res, next) {
  try {
    const tasks = await readTasks();
    const assigneeParam = req.params.name.trim().toLowerCase();
    const matches = tasks.filter((task) => task.assignee.trim().toLowerCase() === assigneeParam);

    const { items, meta } = applyListQuery(matches, req.query);

    res.status(200).json({
      success: true,
      data: items,
      meta,
    });
  } catch (err) {
    if (err instanceof QueryValidationError) {
      return respondWithQueryValidationError(res, err);
    }
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const tasks = await readTasks();
    const id = Number(req.params.id);
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      return notFoundResponse(res);
    }

    res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const tasks = await readTasks();
    const id = Number(req.params.id);
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      return notFoundResponse(res);
    }

    const { title, description, assignee, priority } = normalizeStrings(req.body);
    const existingTask = tasks[index];

    const updatedTask = {
      id: existingTask.id,
      title,
      description,
      priority,
      assignee,
      status: req.body.status,
      createdAt: existingTask.createdAt,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updatedTask;
    await writeTasks(tasks);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const tasks = await readTasks();
    const id = Number(req.params.id);
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      return notFoundResponse(res);
    }

    const [deletedTask] = tasks.splice(index, 1);
    await writeTasks(tasks);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  searchTasks,
  listTasksByAssignee,
  getTaskById,
  updateTask,
  deleteTask,
};
