const express = require('express');
const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/tasks');
const reportRoutes = require('./routes/reports');

const app = express();

app.use(logger);
app.use(express.json());
app.use(express.static('public'));

app.use('/tasks', taskRoutes);
app.use('/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
