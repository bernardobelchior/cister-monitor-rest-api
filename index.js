import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql';

const config = require('config.json')('config.json');

const app = express();
const jsonParser = bodyParser.json();

app.use(cors());

const dbConfig = {
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
};

let connection;

function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);

  connection.connect((error) => {
    if (error) {
      console.log('Error connecting to database.', error);
      setTimeout(handleDisconnect, 2000);
    }
  });

  connection.on('error', (error) => {
    console.log('Error with database.', error);
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw error;
    }
  });
}

handleDisconnect();

app.get('/measurements', (req, res) => {
  const sql = 'SELECT * FROM measurement, mote WHERE measurement.mote_id = mote.id ORDER BY time_stamp DESC LIMIT ?';
  const inserts = [Number(req.query.numResults) || 10];
  const statement = mysql.format(sql, inserts);

  connection.query(statement, (error, results) => res.send(error || results));
});

app.get('/measurements/last', (req, res) => {
  const baseStatement =
    'SELECT * FROM (SELECT room.id AS id, time_stamp AS date, temperature, humidity, short_name AS shortName ' +
    'FROM measurement, mote, room WHERE measurement.mote_id = mote.id AND room_id = room.id ORDER BY time_stamp DESC) AS query GROUP BY id';

  const statement = mysql.format(baseStatement);
  connection.query(statement, (error, results) => res.send(error || results));
});


app.get('/floors', (req, res) => {
  const statement = 'SELECT * FROM floor';

  connection.query(statement, (error, results) => res.send(error || results));
});

app.get('/rooms', (req, res) => {
  const statement = 'SELECT * FROM room';

  connection.query(statement, (error, results) => res.send(error || results));
});

app.get('/room/:id', (req, res) => {
  const id = Number(req.params.id);

  const baseStatement = 'SELECT * FROM room WHERE id = ?';
  const vars = [id];

  const statement = mysql.format(baseStatement, vars);
  connection.query(statement, (error, results) => res.send(error || results));
});

app.get('/statistics/room/:id', (req, res) => {
  const id = Number(req.params.id);
  let timeStatement = '';

  switch (req.query.time) {
    case 'all':
      break;
    case 'year':
      timeStatement = `WHERE diff <= ${(parseInt(req.query.num, 10) || 1) * 365}`;
      break;
    case 'month':
      timeStatement = `WHERE diff <= ${(parseInt(req.query.num, 10) || 1) * 30}`;
      break;
    case 'day':
      timeStatement = `WHERE diff <= ${parseInt(req.query.num, 10) || 1}`;
      break;
    default:
      timeStatement = `WHERE diff <= ${30}`;
      break;
  }

  const baseStatement =
    'SELECT date, temperature, humidity FROM ' +
    '(SELECT DATEDIFF(CURDATE(), DATE(time_stamp)) AS diff, DATE(time_stamp) AS date, AVG(temperature) AS temperature, AVG(humidity) AS humidity ' +
    'FROM measurement, mote WHERE measurement.mote_id = mote.id AND room_id = ? GROUP BY diff) AS query' +
    ` ${timeStatement} ORDER BY date ASC`;

  const vars = [id];

  const statement = mysql.format(baseStatement, vars);
  connection.query(statement, (error, results) => res.send(error || results));
});

app.put('/addMeasurement', jsonParser, (req, res) => {
  const baseStatement = 'INSERT INTO measurement(mote_id, time_stamp, temperature, humidity) VALUES(?, ?, ?, ?)';
  const measurement = req.body;

  const vars = [
    Number(measurement.moteId),
    new Date(Number(measurement.timestamp)),
    measurement.temperature,
    measurement.humidity,
  ];

  const statement = mysql.format(baseStatement, vars);

  connection.query(statement, error => res.send(error || ''));
});

app.listen(3000);
