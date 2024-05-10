const bcrypt = require('bcryptjs');

// Replace these values with the stored hash and the entered password
const storedHash = '$2a$10$wZTrOkNXQGahgg2zaH/m3O/HzCjMytXf1vIuoxDgTBHRdeZpWbcui';
const enteredPassword = '0987';

bcrypt.compare(enteredPassword, storedHash, (err, isMatch) => {
  if (err) {
    console.error('Error comparing passwords:', err);
  } else {
    console.log('Passwords match:', isMatch);
  }
});
