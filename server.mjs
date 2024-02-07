import { Low } from 'lowdb';
import { LowSync } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { JSONFilePreset } from 'lowdb/node';
import { JSONFileSync } from 'lowdb/node';
import { nanoid } from 'nanoid';
import express from 'express';
import bodyParser from 'body-parser';

import { parseArtilleryResults } from './lib/parseArtillery.mjs';

// Rest of your server.js code

const app = express();
const PORT = 2000;

// Initialize the database with a 'results' array
const defaultData = { posts: [] }
const db = await JSONFilePreset('db.json', defaultData);
//const db = new LowSync(new JSONFileSync('./db.json'), defaultData);

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/css', express.static('css')); // Add this line for the CSS folder


app.post('/store', (req, res) => {
  let testRes = {
    id: nanoid(),
    parentId: null,
    type: 'default', 
    title: '',
    description: '',
    tool: null,
    project: null,
    category: null,
    timestamp: new Date().toISOString(),
    startstamp: null,
    endstamp: null,
    result: null,
    latency: {min: null, max: null, avg: null, median: null},
    requests: {total: 0, responses: 0, ok: 0, failed: 0},
    rate: null,
    testdata: null,
    comment: '',
    tags: [],
    json: null
  };

  const type = req.query.t || req.query.type || 'none';
  const proj = req.query.proj || 'none';
  const name = req.query.name || 'none';

  const inJson = req.body; // JSON.parse(req.body);
  const { posts } = db.data;

  if(type.toLowerCase() === 'artillery') {
    try {
      log('type=artillery project=' + proj);
      testRes.project = proj;
      testRes.title = name;
      testRes.tool = 'artillery';
      testRes = parseArtilleryResults(testRes, inJson);
     
      db.update(({ posts }) => posts.push(testRes));
      db.write();

      log("1 insert")

      /*if(Array.isArray(testRes.json)) {
        // Insert child elements
        Object.keys(testRes.json).forEach(function(key) {

        });*/
      //}

    } catch (error) {
      console.error(error);
    }
  }

  if(type.toLowerCase() === 'behave') {
    log('type=behave project=' + proj);
    // Assume its an array of test results
    // Insert each one individually
    if(Array.isArray(inJson)) {

      inJson.forEach(json => {
        let entry = Object.assign({}, testRes);
        entry.project = proj;
        entry.title = json.name;
        testRes.tool = 'behave';
        entry.description = json.description;
        entry.json = json;
        entry.tags = entry.tags.concat(json.tags);
        //
        //
        //
        db.update(({ posts }) => posts.push(entry));
        log("1 insert")
        
      });

      db.write();
    }

  }

  try {

    res.status(201).json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

function log(message) {
  var d = new Date();
  
  console.log(d.toLocaleString() + "\t" + message);
}

app.get('/results', (req, res) => {
  try {
    // Retrieve all results from the 'results' array in the database
    const { posts } = db.data;
    const sortedPosts = posts.toSorted((a, b) => a.timestamp - b.timestamp);
    //const results = db.get('posts').value();

    res.json({ success: true, sortedPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// Endpoint to display HTML table with results
app.get('/', (req, res) => {
  let { posts } = db.data;

  // Filter
  const projFilter = req.query.proj || '';

  //const sortedPosts = posts.toSorted((b, a) => a.timestamp - b.timestamp);
  if(projFilter != '') {
    
    posts = posts.filter(post => (post.project != null && post.project.toLowerCase() === projFilter.toLowerCase()));
  }

  const sortedPosts = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));



  // Generate an HTML table from the results
  const tableHtml = `
    <table border="0">
      <thead>
        <tr>
          <th>Date</th>
          <th>Project</th>
          <th>Category</th>
          <th>Name</th>
          <th>Result</th>
          <th>Latency</th>
          <th>Rate</th>
          <th>Requests</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${sortedPosts.map(post => `<tr onclick="document.getElementById('${post.timestamp}').style.display='table-row';"><td>${new Date(post.timestamp).toLocaleString('no-NO')}</td>
                                      <td>${post.project}</td>
                                      <td>${post.category}</td>
                                      <td>${post.title}</td>
                                      <td class="${post.result}">${post.result}</td>
                                      <td align="right">${printLatency(post)} ms</td>
                                      <td>${post.rate} rq/sec</td>
                                      <td>${printRequests(post)}</td>
                                      <td>${new Date(new Date(post.endstamp) - new Date(post.startstamp)).getMinutes()} min</td>
                                   </tr>
                                   <tr id="${post.timestamp}" style="display:none"><td colspan="8"><pre>${JSON.stringify(post.json, null, 2)}</pre></td></tr>
                                   `).join('')}
                                  
      </tbody>
    </table>
  `;

  // Render HTML page with the table
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Results</title>
        <link rel="stylesheet" type="text/css" href="css/styles.css">
      </head>
      <body>
        <h1>Test Results</h1>
        ${tableHtml}
      </body>
    </html>
  `;

  res.send(html);
});

function printLatency(post) {
  if(post.category == 'performance') {
    return "avg " + formatNumber(post.latency.avg) + "ms, median " + formatNumber(post.latency.median) + "ms";
  }
  else {
    return '-';
  }
}

function printRequests(post) {
  if(post.requests && post.requests.responses) {
    return post.requests.responses + "/" + post.requests.total + " (" + Math.round(post.requests.responses / post.requests.total * 100) + "%)";
  }
  return "";
}

function formatNumber(latency) {
  if(latency != null) {
    if (latency > 999) {
      return latency.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    } else {
      return latency.toFixed(1);
    }
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;