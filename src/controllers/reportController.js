const { readTasks } = require('../utils/file');

async function completedReport(req, res, next) {
  try {
    const tasks = await readTasks();
    const count = tasks.filter((task) => task.status === 'completed').length;

    res.status(200).json({
      success: true,
      message: 'Completed tasks report generated successfully',
      data: { status: 'completed', count },
    });
  } catch (err) {
    next(err);
  }
}

async function pendingReport(req, res, next) {
  try {
    const tasks = await readTasks();
    const count = tasks.filter((task) => task.status === 'pending').length;

    res.status(200).json({
      success: true,
      message: 'Pending tasks report generated successfully',
      data: { status: 'pending', count },
    });
  } catch (err) {
    next(err);
  }
}

async function summaryReport(req, res, next) {
  try {
    const tasks = await readTasks();

    const summary = {
      total: tasks.length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      inProgress: tasks.filter((task) => task.status === 'in-progress').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
      highPriority: tasks.filter((task) => task.priority === 'high').length,
    };

    res.status(200).json({
      success: true,
      message: 'Summary report generated successfully',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { completedReport, pendingReport, summaryReport };
