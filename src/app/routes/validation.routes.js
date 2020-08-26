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
const nodemailer = require('nodemailer');
const crypto = require('crypto')
const http = require('http')
const uuid = require('uuid')

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
    if (result.length < 1 && result != undefined) {
      return res.json({ username_err: "Username not found" });
    } else {
      bcrypt.compare(password, result[0].password).then(isMatch => {
        if (isMatch) {          let { userId, username } = result[0]
          const payload = {
            ...result[0]
          };
          // Sign token
          jwt.sign(payload, keys.secretOrKey,
            {
              expiresIn: 18000 // 3 min in seconds
            },
            (err, token) => {
              console.log('success')
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
    if (result.length < 1 && result != undefined) {
      return res.json({ username_err: "Username not found" });
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
        subject: '[Inverte] Email Validation Code',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
          <title>Mail</title>
          <style>
            strong {
              font-weight: 700;
            }
          </style>
        </head>
        <body style="background-color: #f7f7f7; font-family: 'Ubuntu', sans-serif;">
          <table width="600" border="0" align="center" cellpadding="0" cellspacing="0">
            <tbody>
              <tr>
                <td align="center" valign="middle" style="padding: 33px 0;">
                  <a href="https://vlo.bitnation.do/" target="_blank"><img
                      src="https://vlo.bitnation.do/assets/images/logo.png" width="232" alt="inverte" style="border: 0;"
                      class="CToWUd"></a>
                </td>
              </tr>
              <tr>
                <td>
                  <div style="padding: 0 30px; background: #fff;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tbody>
                        <tr>
                          <td style="
                              border-bottom: 1px solid #e6e6e6;
                              font-size: 18px;
                              padding: 0px 0;
                            ">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                              <tbody>
                                <tr>
                                  <td>
                                    <h2>Hi ${email.split('@')[0]}</h2>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="
                              font-size: 14px;
                              line-height: 30px;
                              padding: 15px 0px 0px 0px;
                              color: rgb(50, 50, 50);
                            ">
                            <h3>
                              Here is your email verification code:
                            </h3>
                            <br>
                          </td>
                        </tr>
                              <td>
                                <h1 style="text-align: center;">
                                  <strong>${digits.slice(0, 3)} ${digits.slice(3, 6)}</strong>
                                </h1>
                              </td>
                        <tr>
                          <td style="
                              padding: 30px 0 15px 0;
                              font-size: 12px;
                              color: rgb(95, 95, 95);
                              line-height: 20px;
                            ">
                            <span class="il">Inverte</span> Team<br>This is an automated
                            message, please do not reply.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
              <tr>
              </tr>
              <tr>
                <td align="center"
                  style="display: flex ;font-size: 12px; color: white; padding: 15px 10px; background-color: #01153d;">
                  <a href="https://www.inverte.do/" target="_blank"><img align="left"
                      style="width: 40px; height: 40px; padding: 0px 50px;" src="https://inverte.do/assets/images/logo.png"
                      width="232" alt="inverte" style="border: 0;" class="CToWUd"></a>

                  <div style="padding-top: 5px;">
                    ©<span class="il">Inverte</span>.io All Rights Reserved<br>URL：<a
                      style="color:white; text-decoration: none;" href="https://www.inverte.do/" target="_blank"
                      data-saferedirecturl="https://www.google.com/url?q=https://www.binance.com/&amp;source=gmail&amp;ust=1590687447017000&amp;usg=AFQjCNGIXhm7Z3ZgPa9XpTFJ34IifWxWkA">www.<span
                        class="il">inverte</span>.io</a>&nbsp;&nbsp;E-mail：<a href="https://bitnationdo.freshdesk.com/"
                      style="color: white; text-decoration: none;" target="_blank">su<wbr>pport@<span
                        class="il">bitnationdo</span>.freshdesk.com</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>`
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
router.post("/email/validate", (req, res) => {
  const username = req.body.username
  const secret = req.body.secret
  if (secret == 'ecZDUVwAf4PbKxvKzfZf8GSDy46sJeezXKFT6Z3g4545DUZuvrtbWzDAXxARucVfmnpV7TNfAdrxfH8vsmcyC4Bw7ENLY7KzBT7mYpnkLQvDg3MDkDUmbxRU2aWwCbRf') {
    connection.query("SELECT verified_mail, secret, email FROM user WHERE username = " + mysql.escape(username), (err, result) => {
      if (err) { console.log(err); res.json({ success: false, msg: 'Error getting data.' }) } else {
        if (result[0].verified_mail == 1) {
          res.json({
            success: false,
            msg: 'Email verified'
          })
        } else {
          var mailOptions = {
            from: 'noreply.bitnation@gmail.com',
            to: result[0].email,
            subject: '[Oneauth] Email verification.',
            html: '<html><head><link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet">'
              + '<style>body{font-family: \'Montserrat\', sans-serif;}.fondo{background-color: #06101f;width: 100%;padding: 20px;text-align: center;color: #a1a1a1; font-size: 14px; line-height : 22px;}'
              + 'button {padding: 10px;background-image: -webkit-gradient(linear, left top, right bottom, from(#fc6909), to(#f99f01));border-radius: 5px;margin: 20px;color: white;text-align: center;max-width: 300px;border: 0px solid #FFF}</style></head>'
              + '<body><div class="fondo"><img src="https://oneauth.do/src/images/text_logo@2x.png" style="margin: 20px; width: 200px; display: inline-block" >'
              + '<div style="background-color: #fff; max-width: 600px; display: inline-block; text-align: left; padding: 40px; margin: 20px">'
              + '<p style="font-size: 24px;">Email verification</p><hr style="border-top: 1px solid #f3f5f7;" /><p>This email was sent to validate this email address for your account <strong>' + username + '</strong>.'
              + '<br>If this was not your action and you are concerned about the security of your account, please contact us immediately.</p><a  href=\'https://oneauth.do/auth/validate?secret=' + result[0].secret + '\'>Validate account</a>'
              + '<br><p style="font-size: 12px;">Oneauth Team<br>Automated message. please do not reply</p></div><div style="margin: 20px;">2018 - 2019 Bitnation Limited All Rights Reserved </div></div></body><html>'

          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
              connection.query("UPDATE user SET ? WHERE username = " + mysql.escape(username), {
                verified_mail_date: new Date(Date.now())
              }, (err, result) => {
                if (err) { console.log(err); res.json({ success: false, msg: 'Error getting data.' }) } else {
                  res.json({
                    success: true,
                  })
                }
              })
            }
          });
        }
      }

    })
  } else {
    res.json({
      success: false,
      msg: 'Invalid secret'
    })
  }
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
router.post("/vlo", (req, res) => {
  let { rxInfo, devEUI, deviceName } = req.body
  let { latitude, longitude } = rxInfo[0].location
  connection.query("INSERT INTO location SET ?", {
    latitude,
    longitude,
    speed: 0,
    type: 'GPS',
    entityId: deviceName
  })
  console.log(rxInfo[0].location)
  res.json({
    success: true
  })
})
module.exports = router;

