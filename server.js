const uuid = require('uuid');
const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis').createClient({
  host: '0.0.0.0',
  port: 6378,
  db:2,
  return_buffers:true
}));
const previewManager = require('./preview-manager');
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const db = require('sqlite');

Promise.resolve()
  .then(() => db.open(__dirname + '/db.sqlite', {Promise}))
  .catch(err => console.error(error.stack))
  .finally(() => app.listen(8000))
  .finally(() => console.log(`server ready for request on 8000`));


const app = express();
app.use(express.static('.'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());

app.post('/image', async (req, res) => {
  if (!req.files) res.send('file not send');

  const id = uuid();
  const image = req.files.image;
  const name = req.body.name;

  try {
    await db.run(`insert into files values('${id}', '${image.name}', '${name}')`);
    await redis.hmsetAsync(id, 'data', image.data, 'name', image.name);
  } catch (err) {
    res.send('fail file save');
  }
});

app.get('/image', async (req, res) => {
  try {
    const reply = await db.all('select * from files');
    res.json(reply);
  } catch (err) {
    res.json(err);
  }
});

app.get('/image/:id/:name', async (req, res) => {
  try {
    const image = await redis.hgetAsync(req.params.id, req.params.name);
    const buffer = new Buffer(image,'base64');
    res.writeHead(200, {"Content-Type": "image/png"});
    res.end(image)
  } catch (err) {
    res.json(err);
  }
});

app.get('/shape/:id', async (req, res) => {
  try {
    const reply = await db.all(`select * from shapes where id = '${req.params.id}'`);
    reply.forEach(item => {
      item.points = JSON.parse(item.points);
    });
    res.json(reply);
  } catch (err) {
    res.json(err);
  }
});

app.post('/shape', async (req, res) => {
  const { uuid, detail, points } = req.body;
  try {
    await previewManager.createPreview(uuid, detail, points);
    await db.run(`insert into shapes values('${uuid}', '${detail}', '${JSON.stringify(points)}')`);
    res.end();
  } catch (err) {
    res.status(500).json(err);
  }
});

