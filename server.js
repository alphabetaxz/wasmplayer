'use strict'

var http = require('http')
var serverIndex = require('serve-index')
var express = require('express')

var app = express()
app.use(serverIndex('./public'))
app.use(express.static('./public'))

var httpServer = http.createServer(app)
httpServer.listen(8000, '0.0.0.0')