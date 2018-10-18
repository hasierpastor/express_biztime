/** BizTime express application. */

const express = require('express');

const app = express();

const companyRoutes = require('./routes/companies');
const invoiceRoutes = require('./routes/invoices');
const industriesRoutes = require('./routes/industries');

app.use(express.json());
app.use('/companies', companyRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/industries', industriesRoutes);
/** 404 handler */

app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});

module.exports = app;
