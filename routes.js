const express = require('express');
const router = express.Router();
const authentication = require('./auth/authentication');
const dashboard = require('./dash/dashboard.js');
const { authenticateUser } = require('./token/jwtUtils');

// Registration route
router.post('/register', authentication.registerUser);
// Login route
router.post('/login',authentication.login);
router.post('/forgot', authentication.forgotPassword);
router.post('/reset-password', authentication.resetPassword);
router.post('/user', authentication.getUserDetails);

//Dashboard
router.post('/insertScheduleData/', authenticateUser, dashboard.insertScheduleData);
router.put('/updateMonthlyValues/:AdminEmail', authenticateUser, dashboard.updateMonthlyValues);
router.get('/getSchedule/:Email', authenticateUser, dashboard.getSchedule);
router.get('/AllSchedule', authenticateUser, dashboard.AllSchedule);
router.get('/countTasks', authenticateUser, dashboard.countTasks);
router.post('/approvalRequest', authenticateUser, dashboard.approvalRequest);
router.get('/AllMainTask', authenticateUser, dashboard.AllMainTask);
router.get('/AllSubTask', authenticateUser, dashboard.AllSubTask);

router.post('/approvalRequestForSubTask', authenticateUser, dashboard.approvalRequestForSubTask);

router.get('/AllApprovalRequestByOwner/:admin_email', authenticateUser, dashboard.AllApprovalRequestByOwner);

router.post('/markAsApproved', authenticateUser, dashboard.markAsApproved);
router.post('/markAsUnApproved', authenticateUser, dashboard.markAsUnApproved);

router.get('/AllScheduleByUser/:Email', authenticateUser, dashboard.AllScheduleByUser);
router.get('/AllMainTaskByUser/:Email', authenticateUser, dashboard.AllMainTaskByUser);
router.get('/AllSubTaskByUser/:Email', authenticateUser, dashboard.AllSubTaskByUser);
router.get('/countTasksByUser/:Email', authenticateUser, dashboard.countTasksByUser);
router.get('/fetchTaskByName/:task/:month', authenticateUser, dashboard.fetchTaskByName);

module.exports = router;
