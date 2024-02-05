import { Low } from 'lowdb';
import { LowSync } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { JSONFilePreset } from 'lowdb/node';
import { JSONFileSync } from 'lowdb/node';
import express from 'express';


// Rest of your server.js code

const app = express();

const PORT = 2000;

// Initialize the database with a 'results' array
const defaultData = { posts: [] }
//const db = await JSONFilePreset('db.json', defaultData);
const db = new LowSync(new JSONFileSync('db.json'), defaultData);

app.use(express.json({ limit: '10mb' }));

app.post('/store', (req, res) => {
  try {
    console.log("RECEIVED:");
    const result = req.body;
    
    console.log(result);

    const { posts } = db.data;
    db.update(({ posts }) => posts.push(result));

    console.log("Did insert")
    res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.get('/results', (req, res) => {
  try {
    // Retrieve all results from the 'results' array in the database
    const { posts } = db.data;
    //const results = db.get('posts').value();

    res.json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;