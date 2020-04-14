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
var nodemailer = require('nodemailer');
var crypto = require('crypto')

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.bitnation@gmail.com',
    pass: 'Bitnation0910'
  }
});
function generateRandomID() {
  return Math.random().toString(36).substring(10);
}


setInterval(() => {
  connection.query("SELECT 1")
}, 5000)

router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.json(errors);
  } else {
    var { username, password, email } = req.body
    var userId = generateRandomID()
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
  // Check validation
  if (!isValid) {
    return res.json(errors);
  }
  const {username, password} = req.body;
  // Find user by username
  connection.query('SELECT * FROM user WHERE username = ' + mysql.escape(username), (err, result) => {

    if (result.length < 1 && result != undefined) {
      return res.json({ username_err: "Username not found" });
    } else {
      // Check password
      bcrypt.compare(password, result[0].password).then(isMatch => {
        if (isMatch) {
          // User matched
          // Create JWT Payload
          const payload = {
            id: result[0].id,
            name: result[0].username
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

router.post("/getQrData",  (req, res) => {
  res.json({
    success: true
  });
});
router.post("/", auth.checkToken, (req, res) => {
  res.json({
    success: true
  });
});

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
module.exports = router;

