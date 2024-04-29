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
router.get('/user', authentication.getUserDetails);

//Dashboard
router.post('/insertScheduleData/', dashboard.insertScheduleData);
router.put('/updateMonthlyValues/:AdminEmail', dashboard.updateMonthlyValues);
router.get('/getSchedule/:Email', dashboard.getSchedule);
router.get('/AllSchedule', dashboard.AllSchedule);
router.get('/countTasks', dashboard.countTasks);
router.post('/approvalRequest', dashboard.approvalRequest);
router.get('/AllMainTask', dashboard.AllMainTask);
router.get('/AllSubTask', dashboard.AllSubTask);

router.post('/approvalRequestForSubTask', dashboard.approvalRequestForSubTask);

router.get('/AllApprovalRequestByOwner/:admin_email', dashboard.AllApprovalRequestByOwner);

router.post('/markAsApproved', dashboard.markAsApproved);
router.post('/markAsUnApproved', dashboard.markAsUnApproved);

router.get('/AllScheduleByUser/:Email', dashboard.AllScheduleByUser);
router.get('/AllMainTaskByUser/:Email', dashboard.AllMainTaskByUser);
router.get('/AllSubTaskByUser/:Email', dashboard.AllSubTaskByUser);
router.get('/countTasksByUser/:Email', dashboard.countTasksByUser);

module.exports = router;
