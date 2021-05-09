require('dotenv').config();
const { Pool } = require('pg');

let host = process.env.host;
let database = process.env.database;
let port = process.env.dbport;
let username = process.env.dbname;
let password = process.env.password;

// console.log('username:',process.env.dbname);

let connectionString = `postgres://${username}:${password}@${host}:${port}/${database}`;
let connect = {
  connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
  ssl: { rejectUnauthorized: false },
};
// console.log(connect);
const pool = new Pool(connect);

let saveAddress = (street, city, state, postalCode) => {
  // return pool.query('insert into mynearbyplaces.address(street,city,state,postalcode) values($1,$2,$3,$4) RETURNING *', [street, city, state, postalCode]).then((result) => {
  return pool.query('insert into mynearbyplaces.address(street,city,state,postalcode) values($1,$2,$3,$4) RETURNING id', [street, city, state, postalCode]).then((result) => {
    console.log('the address was saved');

    return result.rows[0].id;
  });
};

let savePlace = (name, addressid) => {
  return pool.query('insert into mynearbyplaces.place(name,addressid)values($1,$2)', [name, addressid]).then(() => {
    console.log('the address was saved');
  });
};

let findPlaceByName = async (name) => {
  console.log('name:', name);
  let sql = `select p.id as p_id, p.name, a.* from mynearbyplaces.address a inner join mynearbyplaces.place p on a.id = p.addressid where p.name like '%${name || ''}%'`;

  const info = await pool.query(sql);

  const reviewInfo = await pool.query('select * from mynearbyplaces.review ');
  const reviewList = reviewInfo.rows;

  for (let i = 0; i < info.rows.length; i++) {
    const row = info.rows[i];
    const { p_id } = row;
    // sql = `select * from mynearbyplaces.review t where t.placeid = $1`;
    // const reviewInfo = await pool.query(sql, [p_id]);
    console.log(row);
    info.rows[i].list = reviewList.filter((p) => p.placeid == p_id);
  }

  return info.rows;
};

let saveReview = async (data) => {
  const { placeName, placeid, comment, rating, user_id } = data;
  if (!user_id) {
    throw Error('Please log in and re evaluate');
  }
  if (!comment) {
    throw Error('comment cannot be empty');
  }
  if (!rating && rating !== 0) {
    throw Error('rating cannot be empty');
  }

  const sql = `insert into mynearbyplaces.review (placeid,comment,rating,customerid)values($1,$2,$3,$4) returning *`;
  const { rows } = await pool.query(sql, [placeid, comment, rating, user_id || '']);
  return rows[0];
};

let signUp = async (name, email, password) => {
  const info = await pool.query('select count(*) count from mynearbyplaces.customer where name = $1', [name]);
  console.log(info);
  if (info.rows[0].count > 0) {
    throw Error('username exists');
  }

  const result = await pool.query('insert into mynearbyplaces.customer(email,password) values( $1,$2) returning * ', [email, password]);
  return result.rows[0];
};

let signIn = async (email, password) => {
  const info = await pool.query('select * from mynearbyplaces.customer where email = $1 and password = $2', [email, password]);
  const userInfo = info.rows[0];
  if (!userInfo) {
    throw Error('Incorrect email or password');
  }
  return userInfo;
};

module.exports = { saveAddress, savePlace, signUp, signIn, findPlaceByName, saveReview };
