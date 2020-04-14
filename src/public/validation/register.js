const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateRegisterInput(data) {
  let errors = {};
// Convert empty fields to an empty string so we can use validator functions
  data.username = !isEmpty(data.username) ? data.username : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
// Name checks
  if (Validator.isEmpty(data.username)) {
    errors.username_err = "Name field is required";
  }
// Email checks
  if (Validator.isEmpty(data.email)) {
    errors.email_err = "Email field is required";
  } else if (!Validator.isEmail(data.email)) {
    errors.email_err = "Invalid email";
  }
// Password checks
  if (Validator.isEmpty(data.password)) {
    errors.password_err = "Password field is required";
  }
if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password_err = "Password must be at least 6 characters";
  }
return {
    errors,
    isValid: isEmpty(errors)
  };
};