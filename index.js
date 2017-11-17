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

app.get('/measurements/:numResults', (req, res) => {
  const sql = 'SELECT * FROM measurement, mote WHERE measurement.mote_id = mote.id ORDER BY time_stamp DESC LIMIT ?';
  const inserts = [Number(req.params.numResults)];
  const statement = mysql.format(sql, inserts);

  connection.query(statement, (error, results) => res.send(error || results));
});

app.get('/floor/:id', (req, res) => {
  const sql = 'SELECT * FROM floor WHERE id = ?';
  const inserts = [Number(req.params.id)];
  const statement = mysql.format(sql, inserts);

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

  /* if(isNaN(id))
    res.send({
      error:
    }) */


  const baseStatement = 'SELECT * FROM room WHERE id = ?';
  const vars = [id];

  const statement = mysql.format(baseStatement, vars);
  connection.query(statement, (error, results) => res.send(error || results));
});

app.get('/statistics/room/:id', (req, res) => {
  const id = Number(req.params.id);
  const days = 30;

  const baseStatement = 'SELECT DATEDIFF(CURDATE(), DATE(time_stamp)) AS diff, DATE(time_stamp) AS date, AVG(temperature) AS temperature FROM measurement, mote WHERE measurement.mote_id = mote.id AND room_id = ? GROUP BY diff LIMIT ?';
  const vars = [id, days];

  const statement = mysql.format(baseStatement, vars);
  connection.query(statement, (error, results) => {
    if (error) {
      res.send(error);
    } else {
      for (const result of results) {
        if (Object.prototype.hasOwnProperty.call(result, 'diff')) {
          delete result.diff;
        }
      }

      res.send(results);
    }
  });
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
