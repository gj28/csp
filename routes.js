const express = require('express');
const router = express.Router();
const authentication = require('./auth/authentication');
const dashboard = require('./dash/dashboard.js');

// Registration route
router.post('/register', authentication.registerUser);
// Login route
router.post('/login',authentication.login);
router.post('/forgot', authentication.forgotPassword);
router.post('/reset-password', authentication.resetPassword);

//Dashboard
router.post('/insertScheduleData/', dashboard.insertScheduleData);

module.exports = router;
