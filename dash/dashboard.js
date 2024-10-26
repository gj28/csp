const db = require('../db');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const crypto = require('../crypto/cryptoUtils');

function insertScheduleData(req, res) {
  try {
    const {
      Schedule_Equipment = null,
      Frequency = null,
      Jan = null,
      Feb = null,
      Mar = null,
      Apr = null,
      May = null,
      Jun = null,
      Jul = null,
      Aug = null,
      Sep = null,
      Oct = null,
      Nov = null,
      December = null,
      Responsibility = null,
      Email = null,
      Mob = null,
      Admin_Email = null,
      Comments = null,
      Scheduled_DateTime = null,
    } = req.body;

    const insertQuery = `
      INSERT INTO CSP.Schedule (
        Schedule_Equipment,
        Frequency,
        Jan,
        Feb,
        Mar,
        Apr,
        May,
        Jun,
        Jul,
        Aug,
        Sep,
        Oct,
        Nov,
        December,
        Responsibility,
        Email,
        Mob,
        Admin_Email,
        Comments,
        Scheduled_DateTime
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      Schedule_Equipment,
      Frequency,
      Jan,
      Feb,
      Mar,
      Apr,
      May,
      Jun,
      Jul,
      Aug,
      Sep,
      Oct,
      Nov,
      December,
      Responsibility,
      Email,
      Mob,
      Admin_Email,
      Comments,
      Scheduled_DateTime
    ];

    db.query(insertQuery, values, (error, results) => {
      if (error) {
        console.error('Error inserting schedule data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.status(201).json({ message: 'Schedule data inserted successfully' });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function updateMonthlyValues(req, res) {
  try {
    const DateTime = req.query.DateTime;
    const AdminEmail = req.params.AdminEmail;

    const monthlyValues = {};
    for (const month of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Comments']) {
      monthlyValues[month] = req.body[month] ;
    }

    const updateQuery = `
      UPDATE CSP.Schedule
      SET 
        Jan = ?, Feb = ?, Mar = ?, Apr = ?, May = ?, Jun = ?, Jul = ?, Aug = ?, Sep = ?, Oct = ?, Nov = ?, December = ?, Comments = ?
      WHERE Admin_Email = ? AND Scheduled_DateTime = ?`;

    // Prepare values array with extracted monthly values and existing params
    const values = Object.values(monthlyValues).concat(AdminEmail, DateTime);

    db.query(updateQuery, values, (error, results) => {
      if (error) {
        console.error('Error updating schedule data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      res.status(200).json({ message: 'Schedule data updated successfully' });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function getSchedule(req, res) {
  try {
    const userEmail = req.params.Email;
    const query = `
      SELECT *
      FROM CSP.Schedule
      WHERE Email = ?`;

    db.query(query, [userEmail], (error, results) => {
      if (error) {
        console.error('Error retrieving schedule data:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'No schedule found for the provided email' });
      }

      res.status(200).json({ schedule: results });
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


function AllSchedule(req, res) {
  const query = 'SELECT * FROM Schedule';
  db.query(query, (error, rows) => {
    try {
      if (error) {
        console.error('Error fetching Tasks:', error);
        throw new Error('Error fetching Tasks');
      }
      const encrypted = crypto.encryptData({ Task: rows })
      res.json(encrypted);
    } catch (error) {
      console.error('Error fetching Tasks:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

async function countTasks(req, res) {
  try {
      const scheduleQuery = 'SELECT Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, December FROM Schedule';
      const subtaskQuery = 'SELECT Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, December FROM time_based_subtask';

      const [scheduleRows, subtaskRows] = await Promise.all([
          new Promise((resolve, reject) => {
              db.query(scheduleQuery, (error, results) => {
                  if (error) {
                      reject(error);
                  } else {
                      resolve(results);
                  }
              });
          }),
          new Promise((resolve, reject) => {
              db.query(subtaskQuery, (error, results) => {
                  if (error) {
                      reject(error);
                  } else {
                      resolve(results);
                  }
              });
          })
      ]);

      let totalTasks = 0;
      let overdueTasks = 0;
      let inProgressTasks = 0;
      let completedTasks = 0;

      function countTaskStatus(rows) {
          for (const row of rows) {
              for (const month of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'December']) {
                  const status = row[month];

                  if (status === 3) {
                      overdueTasks++;
                  } else if (status === 1) {
                      completedTasks++;
                  } else if (status === 2 || status === 4) {
                      inProgressTasks++;
                  }
              }
          }
      }

      countTaskStatus(scheduleRows);
      countTaskStatus(subtaskRows);

      totalTasks = overdueTasks + inProgressTasks + completedTasks;

      return res.status(200).json({
          totalTasks,
          overdueTasks,
          inProgressTasks,
          completedTasks
      });

  } catch (error) {
      console.error('An error occurred:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
}



function approvalRequest(req, res) {
  const { Task, Frequency, Month, Responsibility, Email, Mob, admin_email, remark, upload } = req.body;

  let updateMonth = '';
  switch (Month.toLowerCase()) {
    case 'january':
      updateMonth = 'Jan';
      break;
    case 'february':
      updateMonth = 'Feb';
      break;
    case 'march':
      updateMonth = 'Mar';
      break;
    case 'april':
      updateMonth = 'Apr';
      break;
    case 'may':
      updateMonth = 'May';
      break;
    case 'june':
      updateMonth = 'Jun';
      break;
    case 'july':
      updateMonth = 'Jul';
      break;
    case 'august':
      updateMonth = 'Aug';
      break;
    case 'september':
      updateMonth = 'Sep';
      break;
    case 'october':
      updateMonth = 'Oct';
      break;
    case 'november':
      updateMonth = 'Nov';
      break;
    case 'december':
      updateMonth = 'Dec';
      break;
    default:
      updateMonth = Month; // Default to the original month name
      break;
  }

  try {
    const approvalCheckQuery = 'SELECT * FROM approval WHERE task = ? AND Month = ?';

    db.query(approvalCheckQuery, [Task, Month], (checkError, checkResult) => {
      if (checkError) {
        console.error('Error while checking device:', checkError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (checkResult && checkResult.length > 0) {
        console.error('Approval request already exists for this month and task');
        return res.status(400).json({ message: 'Approval request already exists for this month and task' });
      }

      const approvalInsertQuery = 'INSERT INTO approval (task, Frequency, Month, Responsibility, Email, Mob, admin_email, remark, upload) VALUES (?,?,?,?,?,?,?,?,?)';

      db.query(approvalInsertQuery, [Task, Frequency, Month, Responsibility, Email, Mob, admin_email, remark, upload], (insertError, insertResult) => {
        if (insertError) {
          console.error('Error while inserting device:', insertError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const scheduleUpdateQuery = `UPDATE Schedule SET ${updateMonth} = ? WHERE Schedule_Equipment = ?`;
        db.query(scheduleUpdateQuery, [4, Task], (updateError, updateResult) => {
          if (updateError) {
            console.error('Error while updating schedule:', updateError);
            return res.status(500).json({ message: 'Internal server error' });
          }
          sendScheduleMailForApproval(Task, Frequency, Month, Responsibility, admin_email);
          return res.json({ message: 'Approval Request Sent Successfully!' });
        });
      });
    });
  } catch (error) {
    console.error('Error in device check:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function AllMainTask(req, res) {
  const query = 'SELECT * FROM time_based_task';
  db.query(query, (error, rows) => {
    try {
      if (error) {
        console.error('Error fetching MainTasks:', error);
        throw new Error('Error fetching MainTasks');
      }
      const encrypted = crypto.encryptData({ MainTask: rows })
      res.json(encrypted);
    } catch (error) {
      console.error('Error fetching MainTasks:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function AllSubTask(req, res) {
  const query = 'SELECT * FROM time_based_subtask';
  db.query(query, (error, rows) => {
    try {
      if (error) {
        console.error('Error fetching subtasks:', error);
        throw new Error('Error fetching subtasks');
      }
      const encrypted = crypto.encryptData({ SubTask: rows })
      res.json(encrypted);
    } catch (error) {
      console.error('Error fetching SubTasks:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function approvalRequestForSubTask(req, res) {
  const { Task, Frequency, Month, Responsibility, Email, Mob, admin_email, remark, upload } = req.body;

  let updateMonth = '';
  switch (Month.toLowerCase()) {
    case 'january':
      updateMonth = 'Jan';
      break;
    case 'february':
      updateMonth = 'Feb';
      break;
    case 'march':
      updateMonth = 'Mar';
      break;
    case 'april':
      updateMonth = 'Apr';
      break;
    case 'may':
      updateMonth = 'May';
      break;
    case 'june':
      updateMonth = 'Jun';
      break;
    case 'july':
      updateMonth = 'Jul';
      break;
    case 'august':
      updateMonth = 'Aug';
      break;
    case 'september':
      updateMonth = 'Sep';
      break;
    case 'october':
      updateMonth = 'Oct';
      break;
    case 'november':
      updateMonth = 'Nov';
      break;
    case 'december':
      updateMonth = 'Dec';
      break;
    default:
      updateMonth = Month; // Default to the original month name
      break;
  }

  try {
    const approvalCheckQuery = 'SELECT * FROM approval WHERE task = ? AND Month = ?';

    db.query(approvalCheckQuery, [Task, Month], (checkError, checkResult) => {
      if (checkError) {
        console.error('Error while checking device:', checkError);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (checkResult && checkResult.length > 0) {
        console.error('Approval request already exists for this month and task');
        return res.status(400).json({ message: 'Approval request already exists for this month and task' });
      }

      const approvalInsertQuery = 'INSERT INTO approval (task, Frequency, Month, Responsibility, Email, Mob, admin_email, remark, upload) VALUES (?,?,?,?,?,?,?,?,?)';

      db.query(approvalInsertQuery, [Task, Frequency, Month, Responsibility, Email, Mob, admin_email, remark, upload], (insertError, insertResult) => {
        if (insertError) {
          console.error('Error while inserting device:', insertError);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const scheduleUpdateQuery = `UPDATE time_based_subtask SET ${updateMonth} = ? WHERE Schedule_Equipment = ?`;
        db.query(scheduleUpdateQuery, [4, Task], (updateError, updateResult) => {
          if (updateError) {
            console.error('Error while updating schedule:', updateError);
            return res.status(500).json({ message: 'Internal server error' });
          }
          sendScheduleMailForApproval(Task, Frequency, Month, Responsibility, admin_email)
          return res.json({ message: 'Approval Request Sent Successfully!' });
        });
      });
    });
  } catch (error) {
    console.error('Error in device check:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function sendScheduleMailForApproval(Task, Frequency, Month, Responsibility, admin_email) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'donotreplysenselive@gmail.com',
      pass: 'xgcklimtlbswtzfq',
    },
  });

  const templatePath = path.join(__dirname, '../mail-body/email-template.ejs');
  fs.readFile(templatePath, 'utf8', (err, templateData) => {
    if (err) {
      console.error('Error reading email template:', err);
      return;
    }
    const compiledTemplate = ejs.compile(templateData);

    const html = compiledTemplate({ Task, Frequency, Month, Responsibility });

    const mailOptions = {
      from: 'donotreplySenselive@gmail.com',
      to: admin_email,
      subject: 'Task Approval Request',
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

function AllScheduleByUser(req, res) {
  const Email = req.params.Email;
  const query = 'SELECT * FROM Schedule WHERE Email = ?'; // Add condition to filter by email
  db.query(query, [Email], (error, rows) => {
    try {
      if (error) {
        console.error('Error fetching Tasks:', error);
        throw new Error('Error fetching Tasks');
      }

      const encrypted = crypto.encryptData({ Task: rows })
      res.json(encrypted);
    } catch (error) {
      console.error('Error fetching Tasks:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function AllMainTaskByUser(req, res) {
  const Email = req.params.Email;
  const query = 'SELECT * FROM time_based_task WHERE Email = ?'; // Add condition to filter by email
  db.query(query, [Email], (error, rows) => {
    try {
      if (error) {
        console.error('Error fetching Tasks:', error);
        throw new Error('Error fetching Tasks');
      }
      const encrypted = crypto.encryptData({ Task: rows })
      res.json(encrypted);
    } catch (error) {
      console.error('Error fetching Tasks:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

function AllSubTaskByUser(req, res) {
  const Email = req.params.Email;
  const query = 'SELECT * FROM time_based_subtask WHERE Email = ?'; // Add condition to filter by email
  db.query(query, [Email], (error, rows) => {
    try {
      if (error) {
        console.error('Error fetching Tasks:', error);
        throw new Error('Error fetching Tasks');
      }
      const encrypted = crypto.encryptData({ Task: rows })
      res.json(encrypted);
    } catch (error) {
      console.error('Error fetching Tasks:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

async function countTasksByUser(req, res) {
  try {
      const Email = req.params.Email;
      const scheduleQuery = 'SELECT Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, December FROM Schedule WHERE Email = ?';
      const subtaskQuery = 'SELECT Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, December FROM time_based_subtask WHERE Email = ?';

      const [scheduleRows, subtaskRows] = await Promise.all([
          new Promise((resolve, reject) => {
              db.query(scheduleQuery, [Email], (error, results) => {
                  if (error) {
                      reject(error);
                  } else {
                      resolve(results);
                  }
              });
          }),
          new Promise((resolve, reject) => {
              db.query(subtaskQuery, [Email], (error, results) => {
                  if (error) {
                      reject(error);
                  } else {
                      resolve(results);
                  }
              });
          })
      ]);

      let totalTasks = 0;
      let overdueTasks = 0;
      let inProgressTasks = 0;
      let completedTasks = 0;

      function countTaskStatus(rows) {
          for (const row of rows) {
              for (const month of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'December']) {
                  const status = row[month];

                  if (status === 3) {
                      overdueTasks++;
                  } else if (status === 1) {
                      completedTasks++;
                  } else if (status === 2 || status === 4) {
                      inProgressTasks++;
                  }
              }
          }
      }

      countTaskStatus(scheduleRows);
      countTaskStatus(subtaskRows);

      totalTasks = overdueTasks + inProgressTasks + completedTasks;

      return res.status(200).json({
          totalTasks,
          overdueTasks,
          inProgressTasks,
          completedTasks
      });

  } catch (error) {
      console.error('An error occurred:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
}


function AllApprovalRequestByOwner(req, res) {
  const admin_email = req.params.admin_email;
  const query = 'SELECT * FROM approval WHERE admin_email = ?'; // Add condition to filter by email
  db.query(query, [admin_email], (error, rows) => {
    try {
      if (error) {
        console.error('Error fetching Tasks:', error);
        throw new Error('Error fetching Tasks');
      }
      res.json({ Task: rows });
    } catch (error) {
      console.error('Error fetching Tasks:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


// function markAsApproved(req, res) {
//   const { task, month, remark } = req.body;

//   let updateMonth = '';
//   switch (month.toLowerCase()) {
//     case 'january':
//       updateMonth = 'Jan';
//       break;
//     case 'february':
//       updateMonth = 'Feb';
//       break;
//     case 'march':
//       updateMonth = 'Mar';
//       break;
//     case 'april':
//       updateMonth = 'Apr';
//       break;
//     case 'may':
//       updateMonth = 'May';
//       break;
//     case 'june':
//       updateMonth = 'Jun';
//       break;
//     case 'july':
//       updateMonth = 'Jul';
//       break;
//     case 'august':
//       updateMonth = 'Aug';
//       break;
//     case 'september':
//       updateMonth = 'Sep';
//       break;
//     case 'october':
//       updateMonth = 'Oct';
//       break;
//     case 'november':
//       updateMonth = 'Nov';
//       break;
//     case 'december':
//       updateMonth = 'Dec';
//       break;
//     default:
//       updateMonth = month; // Default to the original month name
//       break;
//   }

//   const query1 = 'SELECT * FROM Schedule WHERE Schedule_Equipment = ?';
//   const query2 = 'SELECT * FROM time_based_subtask WHERE Schedule_Equipment = ?';
//   const deleteQuery = 'DELETE FROM approval WHERE task = ?';

//   db.query(query1, [task], (error1, rows1) => {
//     try {
//       if (error1) {
//         console.error('Error fetching Tasks from Schedule table:', error1);
//         throw new Error('Error fetching Tasks from Schedule table');
//       }

//       if (rows1.length > 0) {
//         // Update the task
//         const updateQuery = `
//           UPDATE Schedule 
//           SET ${updateMonth} = ?, Comments = ?
//           WHERE Schedule_Equipment = ?
//         `;
//         db.query(updateQuery, [1, remark, task], (updateError, result) => {
//           if (updateError) {
//             console.error('Error updating task:', updateError);
//             throw new Error('Error updating task');
//           }
//           // Delete task from approval table
//           db.query(deleteQuery, [task, month], (deleteError, deleteResult) => {
//             if (deleteError) {
//               console.error('Error deleting task from approval table:', deleteError);
//               throw new Error('Error deleting task from approval table');
//             }
//             res.status(200).json({ message: 'Task updated successfully' });
//           });
//         });
//       } else {
//         // Task not found in Schedule table, check time_based_subtask table
//         db.query(query2, [task, month], (error2, rows2) => {
//           try {
//             if (error2) {
//               console.error('Error fetching Tasks from time_based_subtask table:', error2);
//               throw new Error('Error fetching Tasks from time_based_subtask table');
//             }

//             if (rows2.length > 0) {
//               // Update the task
//               const updateQuery = `
//                 UPDATE time_based_subtask 
//                 SET ${updateMonth} = ?, Comments = ?
//                 WHERE Schedule_Equipment = ?
//               `;
//               db.query(updateQuery, [1, remark, task], (updateError, result) => {
//                 if (updateError) {
//                   console.error('Error updating task:', updateError);
//                   throw new Error('Error updating task');
//                 }
//                 // Delete task from approval table
//                 db.query(deleteQuery, [task], (deleteError, deleteResult) => {
//                   if (deleteError) {
//                     console.error('Error deleting task from approval table:', deleteError);
//                     throw new Error('Error deleting task from approval table');
//                   }
//                   res.status(200).json({ message: 'Task updated successfully' });
//                 });
//               });
//             } else {
//               res.status(404).json({ message: 'Task not found' });
//             }
//           } catch (error) {
//             console.error('Error:', error);
//             res.status(500).json({ message: 'Internal server error' });
//           }
//         });
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   });
// }
function markAsApproved(req, res) {
  const { task, month, remark } = req.body;

  let updateMonth = '';
  switch (month.toLowerCase()) {
    case 'january':
      updateMonth = 'Jan';
      break;
    case 'february':
      updateMonth = 'Feb';
      break;
    case 'march':
      updateMonth = 'Mar';
      break;
    case 'april':
      updateMonth = 'Apr';
      break;
    case 'may':
      updateMonth = 'May';
      break;
    case 'june':
      updateMonth = 'Jun';
      break;
    case 'july':
      updateMonth = 'Jul';
      break;
    case 'august':
      updateMonth = 'Aug';
      break;
    case 'september':
      updateMonth = 'Sep';
      break;
    case 'october':
      updateMonth = 'Oct';
      break;
    case 'november':
      updateMonth = 'Nov';
      break;
    case 'december':
      updateMonth = 'Dec';
      break;
    default:
      updateMonth = month; // Default to the original month name
      break;
  }

  const query1 = 'SELECT * FROM Schedule WHERE Schedule_Equipment = ?';
  const query2 = 'SELECT * FROM time_based_subtask WHERE Schedule_Equipment = ?';
  const updateQueryApproval = 'UPDATE approval SET status = 0 WHERE task = ? AND Month = ? ';

  db.query(query1, [task], (error1, rows1) => {
    try {
      if (error1) {
        console.error('Error fetching Tasks from Schedule table:', error1);
        throw new Error('Error fetching Tasks from Schedule table');
      }

      if (rows1.length > 0) {
        // Update the task
        const updateQuery = `
          UPDATE Schedule 
          SET ${updateMonth} = ?, Comments = ?
          WHERE Schedule_Equipment = ?
        `;
        db.query(updateQuery, [1, remark, task], (updateError, result) => {
          if (updateError) {
            console.error('Error updating task:', updateError);
            throw new Error('Error updating task');
          }
          db.query(updateQueryApproval, [task, month], (approvalError, approvalResult) => {
            if (approvalError) {
              console.error('Error updating approval status:', approvalError);
              return res.status(500).json({ message: 'Internal server error' });
            }
            res.status(200).json({ message: 'Task updated successfully' });
          });
        });
      } else {
        // Task not found in Schedule table, check time_based_subtask table
        db.query(query2, [task, month], (error2, rows2) => {
          try {
            if (error2) {
              console.error('Error fetching Tasks from time_based_subtask table:', error2);
              throw new Error('Error fetching Tasks from time_based_subtask table');
            }

            if (rows2.length > 0) {
              // Update the task
              const updateQuery = `
                UPDATE time_based_subtask 
                SET ${updateMonth} = ?, Comments = ?
                WHERE Schedule_Equipment = ?
              `;
              db.query(updateQuery, [1, remark, task], (updateError, result) => {
                if (updateError) {
                  console.error('Error updating task:', updateError);
                  throw new Error('Error updating task');
                }
                // Delete task from approval table
                db.query(updateQueryApproval, [task, month], (approvalError, approvalResult) => {
                  if (approvalError) {
                    console.error('Error updating approval status:', approvalError);
                    return res.status(500).json({ message: 'Internal server error' });
                  }
                  res.status(200).json({ message: 'Task updated successfully' });
                });
              });
            } else {
              res.status(404).json({ message: 'Task not found' });
            }
          } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Internal server error' });
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}


function markAsUnApproved(req, res) {
  const { task, month, remark } = req.body;

  let updateMonth = '';
  switch (month.toLowerCase()) {
    case 'january':
      updateMonth = 'Jan';
      break;
    case 'february':
      updateMonth = 'Feb';
      break;
    case 'march':
      updateMonth = 'Mar';
      break;
    case 'april':
      updateMonth = 'Apr';
      break;
    case 'may':
      updateMonth = 'May';
      break;
    case 'june':
      updateMonth = 'Jun';
      break;
    case 'july':
      updateMonth = 'Jul';
      break;
    case 'august':
      updateMonth = 'Aug';
      break;
    case 'september':
      updateMonth = 'Sep';
      break;
    case 'october':
      updateMonth = 'Oct';
      break;
    case 'november':
      updateMonth = 'Nov';
      break;
    case 'december':
      updateMonth = 'Dec';
      break;
    default:
      updateMonth = month; // Default to the original month name
      break;
  }

  const query1 = 'SELECT * FROM Schedule WHERE Schedule_Equipment = ?';
  const query2 = 'SELECT * FROM time_based_subtask WHERE Schedule_Equipment = ?';
  const deleteQuery = 'DELETE FROM approval WHERE task = ?';

  db.query(query1, [task], (error1, rows1) => {
    try {
      if (error1) {
        console.error('Error fetching Tasks from Schedule table:', error1);
        throw new Error('Error fetching Tasks from Schedule table');
      }

      if (rows1.length > 0) {
        // Update the task
        const updateQuery = `
          UPDATE Schedule 
          SET ${updateMonth} = ?, Comments = ?
          WHERE Schedule_Equipment = ?
        `;
        db.query(updateQuery, [2, remark, task], (updateError, result) => {
          if (updateError) {
            console.error('Error updating task:', updateError);
            throw new Error('Error updating task');
          }
          // Delete task from approval table
          db.query(deleteQuery, [task, month], (deleteError, deleteResult) => {
            if (deleteError) {
              console.error('Error deleting task from approval table:', deleteError);
              throw new Error('Error deleting task from approval table');
            }
            res.status(200).json({ message: 'Task updated successfully' });
          });
        });
      } else {
        // Task not found in Schedule table, check time_based_subtask table
        db.query(query2, [task, month], (error2, rows2) => {
          try {
            if (error2) {
              console.error('Error fetching Tasks from time_based_subtask table:', error2);
              throw new Error('Error fetching Tasks from time_based_subtask table');
            }

            if (rows2.length > 0) {
              // Update the task
              const updateQuery = `
                UPDATE time_based_subtask 
                SET ${updateMonth} = ?, Comments = ?
                WHERE Schedule_Equipment = ?
              `;
              db.query(updateQuery, [2, remark, task], (updateError, result) => {
                if (updateError) {
                  console.error('Error updating task:', updateError);
                  throw new Error('Error updating task');
                }
                // Delete task from approval table
                db.query(deleteQuery, [task], (deleteError, deleteResult) => {
                  if (deleteError) {
                    console.error('Error deleting task from approval table:', deleteError);
                    throw new Error('Error deleting task from approval table');
                  }
                  res.status(200).json({ message: 'Task Rejected successfully' });
                });
              });
            } else {
              res.status(404).json({ message: 'Task not found' });
            }
          } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ message: 'Internal server error' });
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

async function fetchTaskByName(req, res) {
  try {
      const taskName = req.params.task.toLowerCase();  
      const month = req.params.month.toLowerCase();
      const query = 'SELECT Responsibility, approval_time, remark, upload FROM approval WHERE LOWER(task) = ? and LOWER(Month) = ?';  // Use LOWER in the SQL query

      const results = await new Promise((resolve, reject) => {
          db.query(query, [taskName, month], (error, results) => {
              if (error) {
                  reject(error);
              } else {
                  resolve(results);
              }
          });
      });

      if (results.length === 0) {
          return res.status(404).json({ message: 'No tasks found with the given name.' });
      }

      return res.status(200).json(results[0]);

  } catch (error) {
      console.error('An error occurred:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
}


module.exports = {
    insertScheduleData,
    updateMonthlyValues,
    getSchedule,
    AllSchedule,
    countTasks,
    approvalRequest,
    AllMainTask,
    AllSubTask,
    approvalRequestForSubTask,
    AllScheduleByUser,
    AllMainTaskByUser,
    AllSubTaskByUser,
    AllApprovalRequestByOwner,
    markAsApproved,
    markAsUnApproved,
    countTasksByUser,
    fetchTaskByName
};
