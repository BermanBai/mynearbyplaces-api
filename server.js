const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');

const port = process.env.PORT || 4002;

app.use(express.json());
app.use(cors());

app.use((request, response, next) => {
  const { headers, method, url } = request;
  console.log(request.method, request.url);
  const { user_id } = headers;
  if (user_id) {
    request.user_id = user_id;
  }
  console.log(method, url, 'user_id', user_id);

  next();
});

let places = [];

app.get('/', (request, response) => {
  response.send(`<h1>Welcome to helloworld service.</h1>`);
});

app.get('/app/:a/:b', (request, response) => {
  const { a, b } = request.params;
  let sum = Number(a) * Number(b);
  response.json(sum);
});

app.get('/multiply/:a/:b', (request, response) => {
  const { a, b } = request.params;
  let sum = Number(a) * Number(b);
  response.send(`${a} * ${b} = ${sum}`);
});

app.post('/place', async (request, response) => {
  console.log('-----1------', request.body);
  const { name, street, city, state, postalcode } = request.body;
  try {
    if (!name) {
      throw Error('place name cannot be empty');
    }
    if (!street) {
      throw Error('street cannot be empty');
    }
    if (!city) {
      throw Error('city cannot be empty');
    }
    if (!state) {
      throw Error('state cannot be empty');
    }
    if (!postalcode) {
      throw Error('postalcode cannot be empty');
    }
    const addressid = await db.saveAddress(street, city, state, postalcode);
    await db.savePlace(name, addressid);
    response.json({ msg: 'success' });
  } catch (ex) {
    response.status(400).send(ex.message || ex.msg || ex);
  }
});

app.post('/signin', async (request, response) => {
  try {
    const { email, password } = request.body;
    const info = await db.signIn(email, password);
    response.json({ ...info });
  } catch (ex) {
    response.status(400).send(ex.message || ex.msg || ex);
  }
});

app.post('/signup', async (request, response) => {
  try {
    const { name, email, password } = request.body;
    const info = await db.signUp(name, email, password);
    response.json({ ...info });
  } catch (ex) {
    response.status(400).send(ex.message || ex.msg || ex);
  }
});

app.get('/places', async (request, response) => {
  try {
    const rows = await db.findPlaceByName('');
    response.json(rows);
  } catch (ex) {
    response.status(400).send(ex.message || ex.msg || ex);
  }
});

app.get('/place/:name', async (request, response) => {
  const { name } = request.params;
  try {
    const info = await db.findPlaceByName(name);
    response.json(info);
  } catch (ex) {
    response.status(400).send(ex.message || ex.msg || ex);
  }
});

app.post('/review/:placeName', async (request, response) => {
  try {
    const { user_id } = request;
    const { placeName } = request.params;
    const { placeid, comment, rating } = request.body;
    const info = await db.saveReview({ placeName, placeid, comment, rating, user_id });
    response.json({ ...info });
  } catch (ex) {
    response.status(400).send(ex.message || ex.msg || ex);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
