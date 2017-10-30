const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mysql = require('mysql')
const config = require('config.json')('config.json')

const app = express()
const jsonParser = bodyParser.json()

app.use(cors())

const dbConfig = {
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
}

let connection

function handleDisconnect() {
    connection = mysql.createConnection(dbConfig)

	connection.connect((error) => {
		if(error) {
			console.log('Error connecting to database.', error)
			setTimeout(handleDisconnect, 2000)
		}
	})

	connection.on('error', (error) => {
		console.log('Error with database.', error)
		if(error.code === 'PROTOCOL_CONNECTION_LOST') {
			handleDisconnect()
		} else {
			throw error
		}
	})
}

handleDisconnect()

app.get('/measurements/:numResults', function (req, res) {
    var sql = 'SELECT * FROM measurement, mote WHERE measurement.mote_id = mote.id ORDER BY time_stamp DESC LIMIT ?'
    var inserts = [Number(req.params['numResults'])]
    sql = mysql.format(sql, inserts)

    connection.query(sql, function (error, results, fields) {
        res.send({
            error,
            results
        })
    })
})

app.get('/floor/:id', function (req, res) {
    var sql = 'SELECT * FROM floor WHERE id = ?'
	var inserts = [Number(req.params['id'])]
	sql = mysql.format(sql, inserts)

    connection.query(sql, function (error, results, fields) {
        res.send({
            error,
            results
        })
    })
})


app.get('/floors', function (req, res) {
    var sql = 'SELECT * FROM floor'

    connection.query(sql, function (error, results, fields) {
        res.send({
            error,
            results
        })
    })
})

app.get('/rooms', function (req, res) {
    var sql = 'SELECT * FROM room'

    connection.query(sql, function (error, results, fields) {
        res.send({
            error,
            results
        })
    })
})

app.put('/addMeasurement', jsonParser, function (req, res) {
//	let base_statement = 'SELECT node_id FROM mote WHERE node_id = ?'
//	let statement = mysql.format(base_statement, vars) 
    var base_statement = 'INSERT INTO measurement(mote_id, time_stamp, temperature, humidity) VALUES(?, ?, ?, ?)'
    var measurement = req.body

    var vars = [
        Number(measurement.moteId),
        new Date(Number(measurement.timestamp)),
        measurement.temperature,
        measurement.humidity
    ]

    var statement = mysql.format(base_statement, vars)

    connection.query(statement, function (error, results, fields) {
        res.send(error)
    })
})

app.listen(3000)
