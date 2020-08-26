const express = require("express");
const router = express.Router();
const dbConnection = require("../../config/dbconnection");
const connection = dbConnection();
var mysql = require('mysql');
const keys = require("../../config/keys");
const auth = require("../../config/auth");
const nodemailer = require('nodemailer');
const uuid = require('uuid')
setInterval(() => {
    connection.query("SELECT 1")
}, 5000)
router.get("/device", (req, res) => {
    connection.query("SELECT * FROM device JOIN devicetype ON devicetype.typeId = device.type ORDER BY dateAdded DESC", (err, result) => {
        res.json({
            success: err ? false : true,
            devices: err ? undefined : result
        })
    })
})
router.post("/device", auth.checkToken, (req, res) => {
    let { deviceId, type, description } = req.body
    connection.query("INSERT INTO device SET ?", {
        deviceId, type, description
    }, err => {
        res.json({
            success: err ? false : true,
            msg: err ? 'Error Inserting Device' : 'Device Successfully Added'
        })
    })
})
router.delete("/device", auth.checkToken, (req, res) => {
    let { deviceId } = req.body
    connection.query(`DELETE FROM device WHERE deviceId = ${mysql.escape(deviceId)}`, err => {
        res.json({
            success: err ? false : true,
            msg: err ? 'Error deleting Item, It may have linked trips' : 'Device successfully deleted'
        })
    })
})
router.get("/device/type", (req, res) => {
    connection.query("SELECT * FROM devicetype", (err, result) => {
        res.json({
            success: err ? false : true,
            deviceType: err ? undefined : result
        })
    })
})
router.get("/device/:type/:id", auth.checkToken, (req, res) => {
    let { id, type } = req.params
    connection.query(`SELECT * FROM trip WHERE (carId = ${mysql.escape(id)} OR carId = ${mysql.escape(id)})  AND dateEnd IS NULL`, (err, result) => {
        if (result.length > 0) {
            res.json({
                success: false,
                msg: 'Sorry, this device is being used'
            })
        } else {
            connection.query(`SELECT * FROM device WHERE deviceId = ${mysql.escape(id)} AND type = ${mysql.escape(type)}`, (err, result) => {
                res.json({
                    success: err ? false : result.length > 0 ? true : false
                })
            })
        }
    })
})
router.get("/trip/:carId/:keyId", auth.checkToken, (req, res) => {
    let { carId, keyId } = req.params
    let { valetId, businessId } = req.body
    res.json({
        success: true,
        qrData: JSON.stringify({ tripId: uuid.v4(), carId, keyId, valetId, businessId })
    })
})
router.post("/valet", (req, res) => {
    let { userId, username, businessId } = req.body
    connection.query(`SELECT * FROM user WHERE userId = ${mysql.escape(userId)} AND username = ${mysql.escape(username)}`, (err, result) => {
        if (result.length > 0 && !err) {
            let { username, password, email } = result[0]
            connection.query("INSERT INTO valet SET ?", {
                username,
                password,
                email,
                businessId,
                valetId: uuid.v4()
            }, err => {
                console.log(err)

                res.json({
                    success: err ? false : true,
                    msg: err ? 'Error adding Valet' : 'Valet successfully added'
                })
            })
        }
    })
})
router.get('/user', auth.checkToken, (req, res) => {
    connection.query("SELECT * FROM user", (err, result) => {
        res.json({
            success: err ? false : true,
            msg: err ? err.message : "OK",
            users: result || undefined
        })
    })
})
router.get('/business', auth.checkToken, (req, res) => {
    connection.query("SELECT * FROM business", (err, result) => {
        res.json({
            success: err ? false : true,
            msg: err ? err.message : "OK",
            business: result || undefined
        })
    })
})
router.post("/business", auth.checkToken, (req, res) => {
    let { name, latitude, longitude, areaRadius, maxSpeed } = req.body
    connection.query("INSERT INTO business SET ?", {
        businessId: uuid.v4(), name, latitude, longitude, areaRadius, maxSpeed
    }, err => {
        console.log(err)
        res.json({
            success: err ? false : true,
            msg: err ? 'Error Inserting business' : 'Business Successfully Added'
        })
    })
})
router.delete("/business", auth.checkToken, (req, res) => {
    let { deviceId } = req.body
    connection.query(`DELETE FROM business WHERE businessId = ${mysql.escape(deviceId)}`, err => {
        console.log(err)
        res.json({
            success: err ? false : true,
            msg: err ? 'Error deleting Business, it may have linked trips' : 'Business successfully deleted'
        })
    })
})
router.get('/trips/:businessId', auth.checkToken, (req, res) => {
    let { businessId } = req.params
    connection.query(`SELECT * FROM trip JOIN user ON user.userId = trip.userId WHERE businessId = ${mysql.escape(businessId)} ORDER BY dateStart DESC`, (err, result) => {
        res.json({
            success: err ? false : true,
            msg: err ? err.message : "OK",
            businessTrips: result || undefined
        })
    })
})
router.get('/trips/valet/:valetId', auth.checkToken, (req, res) => {
    let { valetId } = req.params
    connection.query(`SELECT * FROM trip JOIN user ON user.userId = trip.userId WHERE valetId = ${mysql.escape(valetId)} ORDER by dateStart DESC`, (err, result) => {
        res.json({
            success: err ? false : true,
            msg: err ? err.message : "OK",
            valetTrips: result || undefined
        })
    })
})
router.get('/trips/user/:userId', auth.checkToken, (req, res) => {
    let { userId } = req.params
    connection.query(`SELECT * FROM trip JOIN user ON user.userId = trip.userId WHERE trip.userId = ${mysql.escape(userId)} ORDER by dateStart DESC`, (err, result) => {
        res.json({
            success: err ? false : true,
            msg: err ? err.message : "OK",
            userTrips: result || undefined
        })
    })
})
router.get('/parking/:businessId', auth.checkToken, (req, res) => {
    let { businessId } = req.params
    connection.query(`SELECT * FROM park WHERE businessId = ${mysql.escape(businessId)} AND parkId NOT IN (SELECT parkId FROM parkhistory WHERE dateOut IS NULL)`, (err, result) => {
        res.json({
            success: err ? false : true,
            msg: err ? err.message : "OK",
            availableParks: result || undefined
        })
    })
})
router.get('/parking', (req, res) => {
    connection.query("SELECT * FROM park", (err, result) => {
        res.json({
            success: err ? false : true,
            msg: err ? err.message : "OK",
            parking: result || undefined
        })
    })
})
router.post("/parking", auth.checkToken, (req, res) => {
    let { businessId, parkNum, latitude, longitude } = req.body
    connection.query("INSERT INTO park SET ?", {
        parkId: uuid.v4(), businessId, parkNum, latitude, longitude,
    }, err => {
        console.log(err)
        res.json({
            success: err ? false : true,
            msg: err ? 'Error Inserting parking lot' : 'Parking lot Successfully Added'
        })
    })
})
router.delete("/parking", auth.checkToken, (req, res) => {
    let { parkId } = req.body
    connection.query(`DELETE FROM park WHERE parkId = ${mysql.escape(parkId)}`, err => {
        res.json({
            success: err ? false : true,
            msg: err ? 'Error deleting parking lot, it may have linked trips' : 'Parking lot successfully deleted'
        })
    })
})
router.post('/pushToken', auth.checkToken, (req, res) => {
    let { userId, valetId, pushToken } = req.body
    connection.query(`UPDATE ${userId ? 'user' : 'valet'} SET ? WHERE ${userId ? 'userId' : 'valetId'} = ${mysql.escape(userId || valetId)}`, {
        pushToken
    }, err => {
        res.json({
            success: err ? false : true,
            msg: err ? 'Error setting push token' : 'Push token successfully added'
        })
    })
})
router.get('/events/:tripId', auth.checkToken, (req, res) => {
    let { tripId } = req.params
    connection.query(`SELECT * FROM events WHERE tripId = ${mysql.escape(tripId)} ORDER by date DESC`, (err, result) => {
        if (err) { res.json({ success: false }) } else {
            res.json({
                success: true,
                events: result
            })
        }
    })
})
module.exports = router;

