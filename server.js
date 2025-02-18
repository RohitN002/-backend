const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql');
const cors = require('cors');
const ExcelJS = require('exceljs');

const path = require('path');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  port :3306,
  host:'bbkssccjpgavyhkzadz5-mysql.services.clever-cloud.com',
  user: 'uvowphq5sbwkptno',
  password: 'VTmyJShhWeEOECxM7vD4', // Replace with your MySQL password
  database: 'bbkssccjpgavyhkzadz5' // Replace with your database name
});



db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

const createUsersTable = () => {
  const sql = `
      CREATE TABLE IF NOT EXISTS students (
           id INT AUTO_INCREMENT PRIMARY KEY,
    studentName VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    fatherName VARCHAR(255) NOT NULL,
    mobileNumber VARCHAR(15) NOT NULL,
    countryCode VARCHAR(5) NOT NULL,
    collegeName VARCHAR(255) NOT NULL,
    courseDetails VARCHAR(50) NOT NULL,
    areaOfInterest TEXT,
    programmingSkills TEXT,
    address TEXT NOT NULL,
    yearOfPassing INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    resume VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    registrationDate DATE NOT NULL
      )
  `;
  db.query(sql, (err, result) => {
      if (err) {
          console.error('Error creating table:', err);
      } else {
          console.log('Users table created successfully.');
      }
  });
};

// Call the function to create the table
createUsersTable();
// Call the function to create the table

app.post('/api/register', upload.single('resume'), (req, res) => {
  const {
    studentName,
    dob,
    fatherName,
    mobileNumber,
    countryCode,
    collegeName,
    courseDetails,
    areaOfInterest,
    programmingsSkills,
    address,
    yearOfPassing,
    email,
    gender,
   
  } = req.body;

  const resume = req.file ? req.file.filename : null;
  const areasOfInterest = Array.isArray(req.body.areaOfInterest)
    ? req.body.areaOfInterest.join(',')
    : req.body.areaOfInterest;
  const programmingSkills = Array.isArray(req.body.programmingsSkills)
    ? req.body.programmingsSkills.join(',')
    : req.body.programmingsSkills;
const date = new Date()
const registrationDate = date.toISOString().slice(0, 19).replace('T', ' ');
console.log('Received form data with submission timestamp:',registrationDate);

  const sql = 'INSERT INTO students SET ?';
  const studentData = {
    studentName,
    dob,
    fatherName,
    mobileNumber,
    countryCode,
    collegeName,
    courseDetails,
    areaOfInterest: areasOfInterest,
    programmingSkills,
    address,
    yearOfPassing,
    email,
    resume,
    gender,
    registrationDate,
  };

  db.query(sql, studentData, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Registration failed');
    }
    res.send('Registered successfully');
  });
});


app.get('/api/students', (req, res) => {
    const query = 'SELECT * FROM students';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            res.status(500).send('Server error');
        } else {
            res.json(results);
        }
    });
});



app.get('/api/download/:filename', (req, res) => {
    const file = path.join(__dirname, 'uploads', req.params.filename);
    res.download(file);
});
app.get('/api/export', async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Student Name', key: 'studentName', width: 30 },
        { header: 'Date of Birth', key: 'dob', width: 15 },
        { header: 'Father Name', key: 'fatherName', width: 30 },
        { header: 'Mobile Number', key: 'mobileNumber', width: 20 },
        { header: 'Country Code', key: 'countryCode', width: 10 },
        { header: 'College Name', key: 'collegeName', width: 30 },
        { header: 'Course Details', key: 'courseDetails', width: 15 },
        { header: 'Area of Interest', key: 'areaOfInterest', width: 30 },
        { header: 'Programming Skills', key: 'programmingSkills', width: 30 },
        { header: 'Address', key: 'address', width: 50 },
        { header: 'Year of Passing', key: 'yearOfPassing', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Resume', key: 'resume', width: 30 },
    ];

    const query = 'SELECT * FROM students';
    db.query(query, (err, results) => {
        if (err) throw err;

        results.forEach((row) => {
            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');

        workbook.xlsx.write(res)
            .then(() => {
                res.end();
            });
    });
});



app.listen(5000, () => {
    console.log('Server running on port 5000');
});
