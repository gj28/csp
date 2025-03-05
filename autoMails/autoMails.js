const db = require('../db');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

function CheckSchedule() {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentMonthName = getMonthName(currentMonth);

  function getMonthName(monthNumber) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthNumber - 1];
  }

  // Determine if we are in the date range from the 28th of the current month to the 5th of the next month
  let queryMonth = currentMonth;
  if (currentDay >= 28) {
    queryMonth = currentMonth + 1;
  } else if (currentDay <= 5) {
    queryMonth = currentMonth;
  } else {
    return;
  }

  if (queryMonth > 12) {
    queryMonth = 1; // Adjust for December to January transition
  }

  const queryMonthName = getMonthName(queryMonth);

  // Query for time_based_subtask
  const querySubtask = `
    SELECT Email, admin_email, Schedule_Equipment
    FROM time_based_subtask
    WHERE ${queryMonthName} = 2
  `;

  // Query for Schedule
  const querySchedule = `
    SELECT Email, admin_email, Schedule_Equipment
    FROM schedule
    WHERE ${queryMonthName} = 2
  `;

  // Execute the first query
  db.query(querySubtask, (error, results) => {
    if (error) {
      console.error("Error executing SQL query for time_based_subtask:", error);
      return;
    }

    console.log(results);
    results.forEach(row => {
      sendEmailForSubtask(row.Email, row.admin_email, row.Schedule_Equipment, queryMonthName);
    });

    // After processing the first query, execute the second query
    db.query(querySchedule, (error, results) => {
      if (error) {
        console.error("Error executing SQL query for Schedule:", error);
        return;
      }
      results.forEach(row => {
        sendEmailForSubtask(row.Email, row.admin_email, row.Schedule_Equipment, queryMonthName);
      });
    });
  });
}

function sendEmailForSubtask(email, adminEmail, scheduleEquipment, queryMonthName) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'donotreplysenselive@gmail.com',
      pass: 'xgcklimtlbswtzfq',
    },
  });

  const templatePath = path.join(__dirname, '../mail-body/a.ejs');
  fs.readFile(templatePath, 'utf8', (err, templateData) => {
    if (err) {
      console.error('Error reading email template:', err);
      return;
    }
    const compiledTemplate = ejs.compile(templateData);

    const html = compiledTemplate({ scheduleEquipment, queryMonthName });

    const mailOptions = {
      from: 'donotreplySenselive@gmail.com',
      to: email,
      subject: 'Reminder: Task Completion for the Schedule Month.',
      html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  });
}

// Uncomment the following lines if you want to schedule this function to run periodically
module.exports = {
  CheckSchedule
};

//setTimeout(CheckSchedule, 1000);
