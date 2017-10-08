const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const config = require('config.json')('config.json')

const app = express()
const jsonParser = bodyParser.json()

const connection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
})

connection.connect()

app.get('/measurements/:numResults', function (req, res) {
    var sql = 'SELECT * FROM measurement ORDER BY time_stamp DESC LIMIT ?'
    var inserts = [Number(req.params['numResults'])]
    sql = mysql.format(sql, inserts)

    connection.query(sql, function (error, results, fields) {
        res.send({
            error,
            results
        })
    })
})

app.put('/addMeasurement', jsonParser, function (req, res) {
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