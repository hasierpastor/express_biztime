const slugify = require('slugify');

//Helper Functions
////////////////////////////////////////////

//handles error is invoice is not found
function oneResult(result, resource) {
  if (result.rowCount === 0) {
    let err = new Error(`${resource} could not be found`);
    err.status = 404;
    throw err;
  }
  return result.rows[0];
}

function makeCompanyCode(str) {
  return slugify(str, {
    remove: /[\*+~\.\(\)'"\!:\?@$%\^\&#\\\/\-\=\+\,\_<>`]/g,
    lower: true
  });
}

module.exports = {
  oneResult,
  makeCompanyCode
};
