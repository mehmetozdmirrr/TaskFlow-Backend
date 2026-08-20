const fs = require('fs/promises');
const path = require('path');

const TASKS_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'tasks.json');

async function readTasks() {
  let raw;

  try {
    raw = await fs.readFile(TASKS_FILE_PATH, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeTasks([]);
      return [];
    }
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`tasks.json contains invalid JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('tasks.json root value must be an array');
  }

  return parsed;
}

async function writeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error('writeTasks expects an array of tasks');
  }

  const json = JSON.stringify(tasks, null, 2);
  await fs.writeFile(TASKS_FILE_PATH, `${json}\n`, 'utf8');
}

module.exports = { readTasks, writeTasks };
