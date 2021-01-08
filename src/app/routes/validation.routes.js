const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dbConnection = require("../../config/dbconnection");
const validateRegisterInput = require("../../public/validation/register");
const validateLoginInput = require("../../public/validation/login");
var mysql = require('mysql');
const keys = require("../../config/keys");
const auth = require("../../config/auth");
const connection = dbConnection();
const crypto = require('crypto')
const http = require('http')
const uuid = require('uuid')

const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.bitnation@gmail.com',
    pass: 'Bitnation0910'
  }
});
setInterval(() => {
  connection.query("SELECT 1")
}, 5000)

router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.json(errors);
  } else {
    let { username, password, email } = req.body
    let userId = uuid.v4()
    console.log(username, password, email)
    connection.query('SELECT * FROM user WHERE email = ' + mysql.escape(req.body.email2), async (err, result) => {
      if (result.length >= 1) {
        return res.json({ email_err: "Email already exists" });
      } else {
        connection.query('SELECT * FROM user WHERE username = ' + mysql.escape(req.body.username2), (err, result) => {
          if (result.length >= 1) {
            return res.json({ username_err: "Username already exists" });
          } else {
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(password, salt, (err, hash) => {
                if (err) throw err;
                password = hash;
                connection.query('INSERT INTO user SET?', {
                  userId, username, password, email
                }, (err) => {
                  if (err) {
                    console.log(err)
                    res.json({
                      success: false,
                      username_err: "Something wrong happened"
                    });
                  } else {
                    var mailOptions = {
                      from: 'noreply.bitnation@gmail.com',
                      to: req.body.email2,
                      subject: 'Mnemonic words for Oneauth account',
                      html: '<h1>Welcome to the Bitnation family</h1><p>Here\'s your Mnemonic words in case of password loss:</p><br/>' +
                        '</b><b> </b><br/>'
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                      if (error) {
                        console.log(error);
                      } else {
                        console.log('Email sent: ' + info.response);
                      }
                    });
                    res.json({
                      success: true
                    });
                  }
                })
              })
            })
          }
        })
      }
    })
  }
})

router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.json(errors);
  }
  const { username, password } = req.body;
  connection.query('SELECT * FROM user WHERE username = ' + mysql.escape(username), (err, result) => {
    if (!result || result.length < 1) {
      return res.json({ username_err: "Username not found" });
    } else {
      bcrypt.compare(password, result[0].password).then(isMatch => {
        if (isMatch) {
          let { userId, username } = result[0]
          const payload = {
            ...result[0]
          };
          // Sign token
          jwt.sign(payload, keys.secretOrKey,
            {
              expiresIn: 18000 // 3 min in seconds
            },
            (err, token) => {
              res.json({
                success: true,
                token,
                username,
                email: result[0].email
              });
            }
          );

        } else {
          if (result == undefined) {
            return res.json({ success: false, password_err: "Undefined result" });
          }
          return res.json({ success: false, password_err: "Incorrect password" });
        }
      });
    }


  });
}); 
router.post("/login/valet", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.json(errors);
  }
  const { username, password } = req.body;
  connection.query('SELECT * FROM valet WHERE username = ' + mysql.escape(username), (err, result) => {
    if (!result || result.length < 1) {
      return res.json({ username_err: "Valet not found" });
    } else {
      bcrypt.compare(password, result[0].password).then(isMatch => {
        if (isMatch) {
          let { valetId, username, businessId } = result[0]
          const payload = {
            valetId,
            username,
            businessId
          };
          // Sign token
          jwt.sign(payload, keys.secretOrKey,
            {
              expiresIn: 18000 // 3 min in seconds
            },
            (err, token) => {
              res.json({
                success: true,
                token,
                username,
                email: result[0].email
              });
            }
          );

        } else {
          if (result == undefined) {
            return res.json({ success: false, password_err: "Undefined result" });
          }
          return res.json({ success: false, password_err: "Incorrect password" });
        }
      });
    }


  });
});
router.post("/login/admin", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.json(errors);
  }
  const { username, password } = req.body;
  connection.query('SELECT * FROM admin WHERE username = ' + mysql.escape(username), (err, result) => {
    if (!result || result.length < 1) {
      return res.json({ username_err: "Admin not found" });
    } else {
      bcrypt.compare(password, result[0].password).then(isMatch => {
        if (isMatch) {
          let { username, email } = result[0]
          const payload = { username, email, '2fa': result[0]['2fa'] };
          jwt.sign(payload, keys.secretOrKey, {
              expiresIn: 18000
            },
            (err, token) => {
              res.json({
                success: true,
                token,
                username,
                email: result[0].email,
                '2fa': result[0]['2fa']
              });
            }
          );

        } else {
          if (result == undefined) {
            return res.json({ success: false, password_err: "Undefined result" });
          }
          return res.json({ success: false, password_err: "Incorrect password" });
        }
      });
    }
  });
});
router.get("/", auth.checkToken, (req, res) => {
  res.json({
    success: true,
    ...req.body
  });
});

router.post("/email/", (req, res) => {
  var { email, digits } = req.body
  digits = digits.toString()
  connection.query(`SELECT email FROM user WHERE email = ${mysql.escape(email)}`, (err, result) => {
    if (err || result.length >= 1) {
      res.json({
        success: false,
        email_err: 'Email already exists'
      })
    } else {
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'noreply.bitnation@gmail.com',
          pass: 'Bitnation0910'
        }
      });
      var mailOptions = {
        from: 'noreply.bitnation@gmail.com',
        to: email,
        subject: '[Vloparking] Email Validation Code',
        html: `<strong/>${digits.slice(0, 3)} ${digits.slice(3, 6)}</strong>`
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {/*
          res.json({
            success: true
          })*/
          res.json({
            success: false,
            email_err: 'Error sending email'
          })
        } else {
          res.json({
            success: true
          })
        }
      })
    }
  })
})


router.get("/ip", (req, res) => {
  let ip = (req.header('X-Real-IP') || req.connection.remoteAddress || '').split(':')
  ip = ip[ip.length - 1]
  http.get(`http://ip-api.com/json/${ip}`, (resp) => {
    let data = ''
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      data = JSON.parse(data)
      data = data.city + ', ' + data.regionName + ', ' + data.country
      res.json({
        success: true,
        ip,
        location: data
      })
    });
  })
})
router.post("/sensor", (req, res) => {
  let { temp, hum, flame } = req.body
  connection.query("INSERT INTO metrics SET ?", {
    type: temp ? 'temp' : hum ? 'hum' : 'flame',
    value: parseFloat(temp || hum || flame)
  })
  if (parseInt(flame) < 10) {
    const { alertFlame } = require('../../config/server')
    alertFlame()
  }
  res.json({
    success: true
  })
})/*
router.post("/vlo", (req, res) => {
  console.log(req.body)
  try{
    console.log(Buffer.from(req.body.payload, 'base64'))
  }catch(e){

  }
  let { rxInfo, devEUI, deviceName } = req.body
  let { latitude, longitude } = rxInfo[0].location
  connection.query("INSERT INTO location SET ?", {
    latitude,
    longitude,
    speed: 0,
    type: 'GPS',
    entityId: deviceName
  })
  const { processData } = require('../../config/server')
  processData(deviceName, { latitude, longitude })
  res.json({
    success: true
  })
})
*/
module.exports = router;

