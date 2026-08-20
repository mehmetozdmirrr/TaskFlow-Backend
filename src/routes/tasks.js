const express = require('express');
const { validateCreateTask, validateUpdateTask } = require('../middleware/validateTask');
const {
  createTask,
  listTasks,
  searchTasks,
  listTasksByAssignee,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

router.post('/', validateCreateTask, createTask);
router.get('/', listTasks);
router.get('/search', searchTasks);
router.get('/assignee/:name', listTasksByAssignee);
router.get('/:id', getTaskById);
router.put('/:id', validateUpdateTask, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
