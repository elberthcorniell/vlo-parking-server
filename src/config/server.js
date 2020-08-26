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
const haversine = require('haversine')
const axios = require('axios')
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
  socket.on('joinTrip', (req, res) => {
    let { tripId } = req
    Object.keys(socket.rooms).map(room => {
      socket.leave(room)
    })
    socket.join(tripId)
    connection.query(`SELECT * FROM trip WHERE tripId = ${mysql.escape(tripId)}`, (err, result) => {
      if (err) {
        console.log(err)
        res("FAIL")
      } else {
        let { valetId, userId, carId, keyId, dateStart, dateEnd } = result[0]
        connection.query(`
        SELECT date, latitude, longitude, speed FROM location WHERE type = 'valet' AND entityId = ${mysql.escape(valetId)} AND (date > ${mysql.escape(dateStart)}) AND (date < ${dateEnd ? mysql.escape(dateEnd) : 'DATE_ADD(NOW(),INTERVAL 1 YEAR)'}) ORDER BY date DESC LIMIT 1;
        SELECT date, latitude, longitude, speed FROM location WHERE type = 'user' AND entityId = ${mysql.escape(userId)} AND (date > ${mysql.escape(dateStart)}) AND (date < ${dateEnd ? mysql.escape(dateEnd) : 'DATE_ADD(NOW(),INTERVAL 1 YEAR)'}) ORDER BY date DESC LIMIT 1;
        SELECT date, latitude, longitude, speed FROM location WHERE type = 'GPS' AND entityId = ${mysql.escape(carId)} AND (date > ${mysql.escape(dateStart)}) AND (date < ${dateEnd ? mysql.escape(dateEnd) : 'DATE_ADD(NOW(),INTERVAL 1 YEAR)'}) ORDER BY date DESC LIMIT 1;
        SELECT date, latitude, longitude, speed FROM location WHERE type = 'GPS' AND entityId = ${mysql.escape(keyId)} AND (date > ${mysql.escape(dateStart)}) AND (date < ${dateEnd ? mysql.escape(dateEnd) : 'DATE_ADD(NOW(),INTERVAL 1 YEAR)'}) ORDER BY date DESC LIMIT 1;
        `, (err, result) => {
          if (err) { res("FAIL"); console.log(err) } else {
            let valetLocation = result[0][0]
            let userLocation = result[1][0]
            let carLocation = result[2][0]
            let keyLocation = result[3][0]
            res({
              valetLocation,
              userLocation,
              carLocation,
              keyLocation
            })
          }
        })
      }
    })
  })
  socket.on('valetLocation', (req, res) => {
    let { latitude, longitude, valetId, speed, tripIds } = req
    connection.query("INSERT INTO location SET ?", {
      latitude,
      longitude,
      speed,
      entityId: valetId,
      type: 'valet'
    }, err => {
      if (!err) {
        socket.emit('Message', "OK")
        tripIds.map(trip => {
          io.sockets.in(trip).emit('valetLocation', req)
        })
      } else {
        res("FAIL")
      }
    })
  })
  socket.on('userLocation', (req, res) => {
    let { latitude, longitude, userId, speed, tripId } = req
    connection.query("INSERT INTO location SET ?", {
      latitude,
      longitude,
      entityId: userId,
      speed,
      type: 'user'
    }, err => {
      if (!err) {
        socket.emit('Message', "OK")
        io.sockets.in(tripId).emit('userLocation', req)
      } else {
        res("FAIL")
      }
    })
  })
  socket.on('startTrip', (req, res) => {
    let { tripId, carId, keyId, userId, valetId, businessId } = req
    connection.query(`SELECT * FROM trip WHERE userId = ${mysql.escape(userId)} AND dateEnd IS NULL`, (err, result) => {
      if (result.length > 0) {
        res({
          success: false,
          msg: 'You have an active trip'
        })
      } else {
        connection.query("INSERT INTO trip SET ?", {
          tripId, carId, keyId, userId, valetId, businessId
        }, err => {
          console.log(err)
          if (err) {
            res("FAIL")
          } else {
            socket.join(tripId)
            setEvent(tripId, "Trip Started", 1)
            io.sockets.in(tripId).emit('tripStarted', {
              status: 0 ? false : true
            })
            res("OK")
          }
        })
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
  socket.on('setAsParked', (req, res) => {
    let { tripId, parkId, valetId } = req
    connection.query(`SELECT * FROM trip WHERE tripId = ${mysql.escape(tripId)}`, (err, result) => {
      if (err) {
        console.log(err)
        res("FAIL")
      } else {
        let { valetId, userId, carId, keyId, dateStart, dateEnd } = result[0]
        connection.query(`
      SELECT latitude, longitude FROM park WHERE parkId = ${mysql.escape(parkId)};
      SELECT latitude, longitude FROM location WHERE type = 'valet' AND entityId = ${mysql.escape(valetId)} AND (date > ${mysql.escape(dateStart)}) AND (date < ${dateEnd ? mysql.escape(dateEnd) : 'DATE_ADD(NOW(),INTERVAL 1 YEAR)'}) ORDER BY date DESC LIMIT 1;
      SELECT maxDistance FROM distances WHERE concept = 'carAndPark';
    `, (err, result) => {
          if (err) { res && res("FAIL") } else {
            let start = result[0][0]
            let end = result[1][0]
            let { maxDistance } = result[2][0]
            let distance = haversine(start, end, { unit: 'meter' })
            console.log(distance, maxDistance)
            if (distance <= maxDistance) {
              connection.query("INSERT INTO parkhistory SET ?", {
                tripId, parkId
              }, err => {
                console.log(err)
                if (err) {
                  res && res("FAIL")
                } else {
                  res && res("OK")
                  io.sockets.in(tripId).emit('carParked', "OK") // On carParked on vallet app 
                  setEvent(tripId, `Car successfully parked`, 1)
                  connection.query(`SELECT userId FROM trip WHERE tripId = ${mysql.escape(tripId)}`, (err, result) => {
                    let { userId } = result[0]
                    notify(userId, undefined, 'Car parked', 'Car successfully parked', undefined)
                  })
                }
              })
            } else {
              res && res({
                success: false,
                msg: 'Distance from parking is above min distance'
              })
            }
          }
        })
      }
    })
  })
  socket.on('askForCar', (req, res) => {
    let { tripId } = req
    connection.query(`SELECT * FROM events WHERE tripId = ${mysql.escape(tripId)} AND description = 'User ask for car'`, (err, result) => {
      if (err || result.length > 0) {
        res && res("FAIL")
      } else {
        connection.query(`SELECT valetId FROM trip WHERE tripId = ${mysql.escape(tripId)}`, (err, result) => {
          if (err) {
            console.log(err)
            res && res("FAIL")
          } else {
            let { valetId } = result[0]
            setEvent(tripId, 'User ask for car', 1)
            notify(undefined, valetId, 'User ask for car', 'The user needs the car right now', undefined)
            res && res("OK")
          }
        })
      }
    })
  })
  socket.on('isAsked', (req, res) => {
    let { tripId } = req
    connection.query(`SELECT * FROM events WHERE tripId = ${mysql.escape(tripId)} AND description = 'User ask for car'`, (err, result) => {
      console.log(err, result)
      if (err || result.length > 0) {
        res && res(true)
      } else {
        res && res(false)
      }
    })
  })
  socket.on('carWithOwner', (req, res) => {
    let { tripId } = req
    connection.query(`SELECT * FROM events WHERE tripId = ${mysql.escape(tripId)} AND description = 'User ask for car'`, (err, result) => {
      if (!err || result.length > 0) {
        connection.query(`UPDATE trip SET ? WHERE tripId = ${mysql.escape(tripId)};
        UPDATE parkhistory SET ? WHERE tripId = ${mysql.escape(tripId)}`,
          [{ dateEnd: mysql.raw('CURRENT_TIMESTAMP()') }, {
            dateOut: mysql.raw('CURRENT_TIMESTAMP()')
          }], err => {
            console.log(err)
            res(err ? "FAIL" : "OK")
            if (!err) {
              io.sockets.in(tripId).emit('tripEnded', { tripId })
              connection.query(`SELECT userId, valetId FROM trip WHERE tripId = ${mysql.escape(tripId)}`, (err, result) => {
                if (err) {
                  res && res("FAIL")
                } else {
                  let { userId, valetId } = result[0]
                  setEvent(tripId, 'Trip Ended', 1)
                  notify(userId, undefined, 'Trip ended', 'You car is now with you, this trip ended', undefined)
                  notify(undefined, valetId, 'Trip ended', 'Thank you for your services!, this trip ended', undefined)
                  res && res("OK")
                }
              })
            }
          })
      } else {
        res("FAIL")
      }
    })
  })
});
function setEvent(tripId, description, type) { //push notifications
  connection.query("INSERT INTO events SET ?", {
    eventId: uuid.v4(),
    tripId,
    description,
    type //0 = Warning, 1 = Normal, NULL = Critic 
  })
}
function notify(userId, valetId, title, body, data) {
  console.log(userId, valetId, title, body, data)
  connection.query(`SELECT pushToken FROM ${userId ? 'user' : 'valet'} WHERE ${userId ? 'userId' : 'valetId'} = ${mysql.escape(userId || valetId)}`, (err, result) => {
    let { pushToken } = result[0]
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || { data: 'goes here' },
    };
    axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      }
    }).then(data => console.log(data.data))
  })
}
module.exports = {
  app, io
};