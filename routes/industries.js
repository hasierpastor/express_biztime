//change arrow functions to functions

const express = require('express');
const db = require('../db');
const { oneResult, makeCompanyCode } = require('../utility');

const router = new express.Router();

//get a list of companies
router.get('/', async (req, res, next) => {
  try {
    const industriesRes = await db.query(`SELECT code, field FROM industries`);

    const industryCompCodesRes = await db.query(
      `SELECT i.field, c.code
      FROM industries AS i
      JOIN companies_industries AS ci ON i.code = ci.industry_code
      JOIN companies AS c ON ci.comp_code = c.code
      GROUP BY i.field, c.code`
    );

    // outer loop selects an industry name from a unique list of industries we queried
    // then inside we loop through a list of the joined table data and filter out rows
    // that match the industry name selected by the outer loop.
    // once that happens, we use map to extract the company codes associated with that industry
    // and attach it as a key onto the industry to return as json to the user later
    for (let i = 0; i < industriesRes.rows.length; i++) {
      let companyCodes = industryCompCodesRes.rows
        .filter(row => row.field === industriesRes.rows[i].field)
        .map(row => row.code);
      console.log(companyCodes);
      industriesRes.rows[i].comp_codes = companyCodes;
    }

    return res.json({ industries: industriesRes.rows });
  } catch (err) {
    return next(err);
  }
});

//get a specific company
router.get('/:code', async (req, res, next) => {
  try {
    const companyPromise = db.query(
      `SELECT code, name, description FROM COMPANIES where code = $1`,
      [req.params.code]
    );

    const invoicePromise = db.query(
      `SELECT * from invoices where comp_code = $1 `,
      [req.params.code]
    );

    const industryPromise = db.query(
      `SELECT c.code, i.field
      FROM companies AS c
      JOIN companies_industries AS ci ON c.code = ci.comp_code
      JOIN industries AS i ON ci.industry_code = i.code
      WHERE c.code = $1;`,
      [req.params.code]
    );

    let companiesRes = await companyPromise;
    let invoicesRes = await invoicePromise;
    let industriesRes = await industryPromise;

    // const resolvedPromises = await Promise.all([
    //   companyPromise,
    //   invoicePromise,
    //   industryPromise
    // ]);

    const company = oneResult(companiesRes, 'Company');
    const invoice = oneResult(invoicesRes, 'Invoice');
    console.log(industriesRes);
    const industries = industriesRes.rows.map(row => row.field);

    company.invoices = invoice;
    company.industries = industries;
    return res.json({ company: company });
  } catch (err) {
    return next(err);
  }
});

//add a company
router.post('/', async (req, res, next) => {
  try {
    let { code, name, description } = req.body;
    code = makeCompanyCode(code);
    const companyRes = await db.query(
      `INSERT INTO companies (code, name, description) 
       VALUES ($1, $2, $3)
       RETURNING code, name, description`,
      [code, name, description]
    );
    const newCompany = oneResult(companyRes, 'Company');
    return res.json({ company: newCompany });
  } catch (err) {
    return next(err);
  }
});

//update a company
router.put('/:code', async (req, res, next) => {
  try {
    let code = makeCompanyCode(req.params.code);
    const { name, description } = req.body;
    const companyRes = await db.query(
      `UPDATE companies SET name=$1, description=$2
       WHERE code = $3
       RETURNING code, name, description`,
      [name, description, code]
    );
    const updatedCompany = oneResult(companyRes, 'Company');

    return res.json({ company: updatedCompany });
  } catch (err) {
    return next(err);
  }
});

//delete a company
router.delete('/:code', async (req, res, next) => {
  try {
    const companyRes = await db.query(
      `DELETE FROM companies WHERE code = $1 RETURNING code`,
      [req.params.code]
    );
    oneResult(companyRes, 'Company');
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
