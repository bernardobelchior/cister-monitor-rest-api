const express = require('express')
const mysql = require('mysql')
const config = require('config.json')('config.json')

const app = express()
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
            results,
            fields
        })
    })
})

app.listen(3000)