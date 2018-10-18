const express = require('express');
const db = require('../db');
const { oneResult } = require('../utility');
// const datetime = require('node-datetime');

const router = new express.Router();

//get a list of invoices
router.get('/', async function(req, res, next) {
  try {
    const invoices = await db.query(`SELECT id, comp_code FROM invoices`);
    return res.json({ invoices: invoices.rows });
  } catch (err) {
    return next(err);
  }
});

//get a specific invoice
router.get('/:id', async function(req, res, next) {
  try {
    const invoiceRes = await db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE id = $1`,
      [req.params.id]
    );
    const invoice = oneResult(invoiceRes, 'Invoice');
    const companyRes = await db.query(
      `SELECT code, name, description FROM COMPANIES where code = $1`,
      [invoice.comp_code]
    );
    const company = oneResult(companyRes, 'Company');
    invoice.company = company;
    return res.json({ invoice });
  } catch (err) {
    return next(err);
  }
});

//add a invoice
router.post('/', async function(req, res, next) {
  try {
    const { comp_code, amt } = req.body;
    const invoiceRes = await db.query(
      `INSERT INTO invoices (comp_code, amt) 
       VALUES ($1, $2)
       RETURNING comp_code, amt`,
      [comp_code, amt]
    );
    let newInvoice = oneResult(invoiceRes, 'Invoice');
    return res.json({ invoice: newInvoice });
  } catch (err) {
    return next(err);
  }
});

//update a invoice
router.put('/:id', async function(req, res, next) {
  try {
    const { amt, paid } = req.body;
    //query that helps us check if invoice has been paid

    const getPaidInvoiceRes = await db.query(
      `SELECT paid FROM invoices WHERE id = $1`,
      [req.params.id]
    );

    const invoice = oneResult(getPaidInvoiceRes, 'Invoice');
    let invoiceRes;

    let customQuery = `
        UPDATE invoices SET amt=$1 !@#
        WHERE id = $2
        RETURNING amt
    `;

    if (invoice.paid === false && paid === true) {
      customQuery = customQuery.replace(
        /!@#/,
        ',paid_date=CURRENT_DATE, paid=TRUE'
      );
      invoiceRes = await db.query(customQuery, [amt, req.params.id]);
    } else if (invoice.paid && paid === false) {
      customQuery = customQuery.replace(/!@#/, ',paid_date=NULL, paid=FALSE');
      invoiceRes = await db.query(customQuery, [amt, req.params.id]);
    } else {
      customQuery = customQuery.replace(/!@#/, '');
      invoiceRes = await db.query(customQuery, [amt, req.params.id]);
    }

    const updatedInvoice = oneResult(invoiceRes, 'Invoice');

    return res.json({ invoice: updatedInvoice });
  } catch (err) {
    return next(err);
  }
});

//delete a invoice
router.delete('/:id', async function(req, res, next) {
  try {
    const invoiceRes = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    oneResult(invoiceRes, 'Invoice');
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
