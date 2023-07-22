const express = require('express');
const app = express();
const port = 3030;
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Images');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const db = new sqlite3.Database('database.db', err => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the database.');
    
    db.run(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        path TEXT,
        tag TEXT
      )
    `);
  }
});


app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload.html'));
});


app.post('/uploadImage', upload.single('image'), (req, res) => {
  const serverUrl = `${req.protocol}://${req.get('host')}`;
  const { filename } = req.file;
  const imagePath = `${serverUrl}/Images/${filename}`;
  const tag = req.body.tag.split(' ');

  const query = `
    INSERT INTO images (name, path, tag)
    VALUES (?, ?, ?)
  `;
  db.run(query, [filename, imagePath, JSON.stringify(tag)], err => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Failed to upload image' });
    } else {
      res.send('Image uploaded successfully');
    }
  });
});

app.get('/allData', (req, res) => {
    const query = `
      SELECT * FROM images
    `;
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to retrieve data' });
      } else {
        const data = rows.map(row => ({
          id: row.id,
          name: row.name,
          path: row.path,
          tag: JSON.parse(row.tag)
        }));
        res.json(data);
      }
    });
  });

 /*  app.delete('/deleteAll', (req, res) => {
    const query = `
      DELETE FROM images
    `;
    db.run(query, [], err => {
      if (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to delete all items' });
      } else {
        res.send('All items deleted successfully');
      }
    });
  }); */

app.use('/Images', express.static('Images'));

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});