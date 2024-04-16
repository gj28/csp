const db = require('../db');
const bcrypt = require('bcrypt');
const jwtUtils = require('../token/jwtUtils');
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

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
  
        console.log('Schedule data inserted successfully:', results);
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
      console.log(req.body)

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
  
        console.log('Schedule data updated successfully:', results);
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
  
        console.log('Schedule data retrieved successfully:', results);
        res.status(200).json({ schedule: results });
      });
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  function AllSchedule(req, res) {
    try {
      const query = 'SELECT * FROM CSP.Schedule';
      db.query(query, (error, rows) => {
        if (error) {
          throw new Error('Error fetching devices');
        }
        res.json({ devices: rows });
        console.log(rows);
      });
    } catch (error) {
      console.error('Error fetching Devices:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  
  function countTasks(req, res) {
    try {
        const selectQuery = 'SELECT * FROM CSP.Schedule';

        db.query(selectQuery, (error, rows) => {
            if (error) {
                console.error('Error fetching schedule data:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }

            let totalTasks = rows.length;
            let overdueTasks = 0;
            let inProgressTasks = 0;
            let completedTasks = 0;

            for (const row of rows) {
                for (const month of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'December']) {
                    const status = row[month];
                    if (status === 0) {
                        overdueTasks++;
                    } else if (status === 1) {
                        completedTasks++;
                    } else if (status === 2) {
                        inProgressTasks++;
                    }
                }
            }

            res.status(200).json({
                totalTasks: totalTasks,
                overdueTasks: overdueTasks,
                inProgressTasks: inProgressTasks,
                completedTasks: completedTasks
            });
        });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

  
  

module.exports = {
    insertScheduleData,
    updateMonthlyValues,
    getSchedule,
    AllSchedule,
    countTasks
};
