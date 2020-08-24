const express = require('express');
const path = require('path');
const morgan = require('morgan');
const app = express();
var httpContext = require('express-http-context')
const bodyParser = require("body-parser");
const uuid = require('uuid')
const upload = require('express-fileupload')
const dbConnection = require("./dbconnection");
const connection = dbConnection();
var mysql = require('mysql');
app.set('port', process.env.port || 3001);
app.use(express.static(path.join(__dirname, '../public')));
app.use(httpContext.middleware);
app.use((req, res, next) => {
  httpContext.ns.bindEmitter(req);
  httpContext.ns.bindEmitter(res);
  var requestId = req.headers["x-request-id"] || uuid.v4();
  httpContext.set('requestId', requestId);
  res.set('requestId', requestId)
  next();
});
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/validate', require('../app/routes/validation.routes'));
app.use('/api/admin', require('../app/routes/admin.routes'));
app.get('/admin/*', (req, res) => {
  let ip = (req.header('X-Real-IP') || req.connection.remoteAddress || '').split(':')
  ip = ip[ip.length - 1]
  if (ip) {
    res.sendFile(path.join(__dirname, '../public/admin.html'))
  } else {
    res.json({
      success: false,
      msg: 'Access Denied'
    })
  }
})
app.get('/*', (req, res) => {
  let ip = (req.header('X-Real-IP') || req.connection.remoteAddress || '').split(':')
  ip = ip[ip.length - 1]
  if (ip) {
    res.sendFile(path.join(__dirname, '../public/index.html'))
  } else {
    res.json({
      success: false,
      msg: 'Access Denied'
    })
  }
})
app.use(upload())
app.post('/upload', (req, res) => {
  const username = req.body.username
  console.log(data.files)
  var key = 'selfie'
  if (req.files.selfie == undefined) {
    key = 'ID'
  }
  var image = req.files[key].mimetype.split('/')
  if (image[0] == 'image' && (image[1] == 'png' || image[1] == 'jpg')) {
    req.files[key].mv('./src/public/uploaded/' + username + '_' + key + '.' + image[1], err => {
      if (err) {
        console.log(err)
        res.json({
          success: false,
          msg: 'Error saving the ' + key + ' file.'
        })
      } else {
        res.json({
          success: true,
          msg: 'Done'
        })
      }
    })

  } else {
    res.json({
      success: false,
      msg: 'Invalid file or format for ' + key
    })
  }
})

let server = app.listen(app.get('port'), () => {
  console.log('server on port ', app.get('port'));
});
const io = require('socket.io')(server, {
})

io.on('connection', socket => {
  socket.on('myName', (req, res) => {
    res(`Hola ${req}`)
  })
  socket.on('valetLocation', (req, res) => {
    //Insert to db
    console.log(req)
    Object.keys(socket.rooms).map(trip => {
      socket.to(trip).emit('valetLocation', req)
    })
  })
  socket.on('startTrip', (req, res) => {
    let { tripId, carId, keyId, userId, valetId, businessId } = req
    socket.join(tripId)
    connection.query("INSERT INTO trip SET ?", {
      tripId, carId, keyId, userId, valetId, businessId
    }, err => {
      if (err) {
        console.log(err)
        res("FAIL")
      } else {
        io.sockets.in(tripId).emit('tripStarted', {
          status: 0 ? false : true
        })
        res("OK")
      }
    })
  })
  socket.on('createTrip', (req, res) => {
    try {
      socket.join(req.tripId)
      res("Trip Created")
    } catch (e) {
      console.log(e)
      res('Error creating trip')
    }
  })
});

module.exports = app;