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
const { cpuUsage } = require('process');
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
const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.bitnation@gmail.com',
    pass: 'Bitnation0910'
  }
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
      if (err || result.length < 1) {
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
    connection.query(`SELECT business.businessId, business.maxSpeed, tripId, userId FROM trip JOIN business ON trip.businessId = business.businessId WHERE tripId IN (${mysql.escape(tripIds)})`, (err, result) => {
      if (result.length > 0) {
        for (let i = 0; i < result.length; i++) {
          let { businessId, maxSpeed, tripId, userId } = result[i]
          if (speed > maxSpeed) {
            connection.query(`SELECT * FROM events WHERE tripId = ${mysql.escape(tripId)} AND description = '${'Valet may be driving above max speed'}'`, (err, result) => {
              if (!err && result.length > 0) { } else {
                let msg = 'Valet may be driving above max speed'
                notify(userId, undefined, 'Warning!', msg, undefined)
                notify(undefined, valetId, 'Warning!', 'Stop driving above max speed!', undefined)
                setEvent(tripId, msg, 0)
              }
            })
          }
        }
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
        connection.query("SELECT * FROM park WHERE parkId NOT IN (SELECT parkId FROM parkhistory WHERE dateOut IS NULL)", (err, parkings) => {
          if (parkings.length < 1) {
            res({
              success: false,
              msg: 'There\'s no available parking lots'
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
                  status: 0 ? false : true,
                  tripId
                })
                res("OK")
              }
            })
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
    connection.query(`SELECT * FROM parkhistory WHERE tripId = ${mysql.escape(tripId)} AND dateOut IS NULL`, (err, result) => {
      if (err || result.length > 0) {
        res({
          success: false,
          msg: 'Car is already parked'
        })
      } else {
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
                      notify(userId, undefined, 'Car parked', 'Car successfully parked', undefined)
                    }
                  })
                } else {
                  notify(userId, undefined, 'Warning', 'May be trying to park car out of range', undefined)
                  setEvent(tripId, 'May be trying to park car out of range', 0)
                  res && res({
                    success: false,
                    msg: 'Distance from parking is above min distance'
                  })
                }
              }
            })
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
      if (err || result.length > 0) {
        res && res(true)
      } else {
        res && res(false)
      }
    })
  })
  socket.on('carWithOwner', (req, res) => {
    let { tripId } = req
    io.sockets.in(tripId).emit('carWithOwner', true)
  })
  socket.on('confirmCarWithOwner', (req, res) => {
    let { tripId, userId } = req
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
function setEvent(tripId, description, type) {
  connection.query("INSERT INTO events SET ?", {
    eventId: uuid.v4(),
    tripId,
    description,
    type //0 = Warning, 1 = Normal, NULL = Critic 
  })
}
function notify(userId, valetId, title, body, data) {
  io.sockets.emit('update', true)
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'noreply.bitnation@gmail.com',
      pass: 'Bitnation0910'
    }
  });
  connection.query(`SELECT email FROM ${userId ? 'user' : 'valet'} WHERE ${userId ? 'userId' : 'valetId'} = ${mysql.escape(userId || valetId)}`, (err, result) => {
    let { email } = result[0] || {email: 'elberthcorniell@gmail.com'}
    let mailOptions = {
      from: 'noreply.bitnation@gmail.com',
      to: email,
      subject: title,
      html: `<strong/>${body}</strong>`
    };
    transporter.sendMail(mailOptions, (err, info) => { })
    mailOptions = {
      from: 'noreply.bitnation@gmail.com',
      to: 'elberthcorniell@gmail.com',
      subject: title,
      html: `<strong/>${body}</strong>`
    };
    transporter.sendMail(mailOptions, (err, info) => { })
  })
  connection.query(`SELECT pushToken FROM ${userId ? 'user' : 'valet'} WHERE ${userId ? 'userId' : 'valetId'} = ${mysql.escape(userId || valetId)}`, (err, result) => {
    let { pushToken } = result[0] || { pushToken: 'none' }
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
    })
  })
}
function processData(devId, location) {
  connection.query(`SELECT * FROM trip WHERE (carId = ${mysql.escape(devId)} OR keyId = ${mysql.escape(devId)}) AND dateEnd IS NULL`, (err, result) => {
    if (!err && result.length > 0) {
      connection.query("SELECT * FROM distances", (err, constants) => {
        let distances = {}
        constants.map(info => {
          distances[info.concept] = info.maxDistance
        })
        result.map((info, index) => {
          let { carId, keyId, valetId, businessId, tripId, userId } = info
          analyzeData(carId, keyId, valetId, userId, businessId, tripId, distances, location, devId)
        })
      })
    }
  })
}
function analyzeData(carId, keyId, valetId, userId, businessId, tripId, distances, location, devId) {
  connection.query(`SELECT * FROM location WHERE entityId = ${mysql.escape(valetId)} AND type = 'valet' ORDER BY date DESC LIMIT 1`, (err, result) => {
    let { latitude, longitude } = result[0]
    let valetLocation = { latitude, longitude }
    let distance = haversine(valetLocation, location, { unit: 'meter' })
    if (keyId == devId) {
      console.log(distance, distances.valetAndKey, 'keys distance')
      if (distance > distances.valetAndKey) {
        setEvent(tripId, 'Keys out of vallet range', 0)
        notify(userId, undefined, 'Warning!', 'Keys out of vallet range', undefined)
        notify(undefined, valetId, 'Warning!', 'Keys out of vallet range', undefined)
      }
    } else
      if (carId == devId) {
        connection.query(`SELECT * FROM business WHERE businessId = ${mysql.escape(businessId)}`, (err, business) => {
          if (!err && business.length > 0) {
            let { latitude, longitude, areaRadius } = business[0]
            let businessLocation = { latitude, longitude }
            let distanceFromBusiness = haversine(businessLocation, location, { unit: 'meter' })
            console.log(distanceFromBusiness, areaRadius, 'Distance from business')
            if (distanceFromBusiness > areaRadius) {
              setEvent(tripId, 'Car out of business range!', null)
              notify(userId, undefined, 'Danger!', 'Car out of business range!', undefined)
              notify(undefined, valetId, 'Danger!', 'Car out of business range!', undefined)
            }
          }
        })
        //verify if parked
        connection.query(`SELECT * FROM parkhistory WHERE tripId = ${mysql.escape(tripId)} AND dateOut IS NULL`, (err, parked) => {
          if (!err && parked.length < 1) {
            console.log(distance, distances.carAndValetOnMovement, 'car distance')
            if (distance > distances.carAndValetOnMovement) {
              setEvent(tripId, 'Car out of vallet range', 0)
              notify(userId, undefined, 'Warning!', 'Car out of vallet range!', undefined)
              notify(undefined, valetId, 'Warning!', 'Car out of vallet range!', undefined)
            }
          }
        })
      }
  })
}
function alertFlame() {
  connection.query('SELECT * FROM trip WHERE dateEnd IS NULL', (err, result) => {
    console.log(result)
    result && result.map(info => {
      let { valeId, userId, tripId } = info
      setEvent(tripId, 'Fire on parking lots!', null)
      notify(userId, undefined, 'Danger!', 'Fire on parking lots!', undefined)
      notify(undefined, valeId, 'Danger!', 'Fire on parking lots!', undefined)
    })
  })
}

module.exports = {
  app, io, processData, alertFlame
};