const db = require('../db');
const bcrypt = require('bcrypt');
const jwtUtils = require('../token/jwtUtils');
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

function insertScheduleData(scheduleData) {
    const {Schedule_Equipment,Frequency,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,December,Responsibility,Email,Mob,Admin_Email,Comments
    } = scheduleData;

    const insertQuery = `INSERT INTO CSP.Schedule (Schedule_Equipment, Frequency, Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, December, Responsibility, Email, Mob, Admin_Email, Comments) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        Schedule_Equipment,Frequency,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,December,Responsibility,Email,Mob,Admin_Email,Comments
    ];

    db.query(insertQuery, values, (error, results) => {
        if (error) {
            console.error('Error inserting schedule data:', error);
          
        } else {
            console.log('Schedule data inserted successfully:', results);
           
        }
    });
}

module.exports = {
    insertScheduleData
};
