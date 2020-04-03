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
const Mnemonic = require('bitcore-mnemonic')
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



setInterval(() => {
  connection.query("SELECT 1")
}, 5000)

router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.json(errors);
  }

  connection.query('SELECT * FROM user WHERE email = ' + mysql.escape(req.body.email2), async (err, result) => {

    if (result.length >= 1) {
      return res.json({ email_err: "Email already exists" });
    } else {


      connection.query('SELECT * FROM user WHERE username = ' + mysql.escape(req.body.username2), (err, result) => {
        if (result.length >= 1) {
          return res.json({ username_err: "Username already exists" });
        } else {
          bcrypt.genSalt(10, (err, salt) => {
            var mnemonic = new Mnemonic()
            var secret = crypto.pbkdf2Sync(req.body.password2, 'salt', 2048, 48, 'sha512');
            var cipher = crypto.createCipher('aes-256-cbc', secret);
            let encrypted = '';
            encrypted += cipher.update(mnemonic.toString(), 'utf8', 'hex');
            encrypted += cipher.final('hex');

            secret = crypto.pbkdf2Sync(mnemonic.toString(), 'salt', 2048, 48, 'sha512');
            cipher = crypto.createCipher('aes-256-cbc', secret);
            let encrypted2 = '';
            encrypted2 += cipher.update('Frase correcta', 'utf8', 'hex');
            encrypted2 += cipher.final('hex');

            bcrypt.hash(req.body.password2, salt, (err, hash) => {
              if (err) throw err;
              req.body.password2 = hash;
              connection.query('INSERT INTO user SET?', {
                username: req.body.username2,
                password: req.body.password2,
                email: req.body.email2,
                mnemonic: encrypted,
                secret: encrypted2
              }, (err, result) => {
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
                      '</b><b>' + mnemonic + '</b><br/>'
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
              });
            })
          })
        }
      })
    }
  })

});

router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
  if (!isValid) {
    return res.json(errors);
  }
  const username = req.body.username;
  const password = req.body.password;
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
              res.json({
                success: true,
                token: token,
                username: username,
                email: result[0].email
              });
            }
          );

        } else {
          if (result == undefined) {
            return res.json({ password_err: "Undefined result" });
          }
          return res.json({ password_err: "Incorrect password" });
        }
      });
    }


  });
});

router.post("/password/change", (req, res) => {
  const password = req.body.password;
  var new_password = req.body.new_password;
  const username = req.body.username;

  connection.query('SELECT * FROM user WHERE username = ' + mysql.escape(username), (err, result) => {

    if (result.length < 1 && result != undefined) {
      return res.json({ success: false, username_err: "Username not found" });
    } else {
      bcrypt.compare(password, result[0].password).then(isMatch => {
        if (isMatch) {
          if (new_password.length > 6) {
            bcrypt.genSalt(10, (err, salt) => {
              //decrypt mnemonic
              var hash = crypto.pbkdf2Sync(password, 'salt', 2048, 48, 'sha512');
              var cipher = crypto.createDecipher('aes-256-cbc', hash);
              let decrypted = '';
              decrypted += cipher.update(result[0].mnemonic, 'hex', 'utf8');
              decrypted += cipher.final('utf8');
              console.log(decrypted)
              //encrypt mnemonic
              secret = crypto.pbkdf2Sync(new_password, 'salt', 2048, 48, 'sha512');
              cipher = crypto.createCipher('aes-256-cbc', secret);
              let encrypted = '';
              encrypted += cipher.update(decrypted, 'utf8', 'hex');
              encrypted += cipher.final('hex');

              bcrypt.hash(new_password, salt, (err, hash) => {
                if (err) throw err;
                new_password = hash;
                connection.query('UPDATE user SET ? WHERE username = ' + mysql.escape(username), {
                  password: new_password,
                  mnemonic: encrypted
                }, (err, result) => {
                  if (err) { console.log(err); res.json({ success: false }) } else {
                    res.json({
                      success: true
                    })
                  }
                })
              })
            })
          } else {
            res.json({
              success: false,
              password_err: 'Invalid password'
            })
          }



        } else {
          if (result == undefined) {
            return res.json({ password_err: "Undefined result" });
          }
          return res.json({ password_err: "Incorrect password" });
        }
      });
    }


  });
})

router.post("/password/recover", (req, res) => {
  var password = req.body.password;
  const mnemonic = req.body.mnemonic;
  const username = req.body.username;

  connection.query('SELECT * FROM user WHERE username = ' + mysql.escape(username), (err, result) => {

    if (result.length < 1 && result != undefined) {
      return res.json({ success: false, username_err: "Username not found" });
    } else {

      if (password.length > 6) {
        bcrypt.genSalt(10, (err, salt) => {
          //veirify mnemonic
          var hash = crypto.pbkdf2Sync(mnemonic, 'salt', 2048, 48, 'sha512');
          var cipher = crypto.createDecipher('aes-256-cbc', hash);
          cipher.setAutoPadding(false)
          let decrypted = '';
          decrypted += cipher.update(result[0].secret, 'hex', 'utf8');
          decrypted += cipher.final('utf8')
          console.log(JSON.stringify(decrypted).slice(1, 15) == 'Frase correcta')
          if (JSON.stringify(decrypted).slice(1, 15) == 'Frase correcta') {
            secret = crypto.pbkdf2Sync(password, 'salt', 2048, 48, 'sha512');
            cipher = crypto.createCipher('aes-256-cbc', secret);
            let encrypted = '';
            encrypted += cipher.update(mnemonic, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            bcrypt.hash(password, salt, (err, hash) => {
              if (err) throw err;
              password = hash;
              connection.query('UPDATE user SET ? WHERE username = ' + mysql.escape(username), {
                password,
                mnemonic: encrypted
              }, (err, result) => {
                if (err) { console.log(err); res.json({ success: false }) } else {
                  res.json({
                    success: true
                  })
                }
              })
            })
          } else {
            return res.json({ success: false, mnemonic_err: "Invalid mnemonic words" });
          }
        })


      } else {
        res.json({
          success: false,
          password_err: 'Invalid password'
        })
      }
    }


  });
})

router.post("/", auth.checkToken, (req, res) => {
  res.json({
    success: true
  });
});

router.post("/kyc/document", (req, res) => {
  const secret = req.body.secret
  const username = req.body.username
  const kyc = req.body.kyc
  const from_ = req.body.from_
  if (secret == 'ecZDUVwAf4PbKxvKzfZf8GSDy46sJeezXKFT6Z3g4545DUZuvrtbWzDAXxARucVfmnpV7TNfAdrxfH8vsmcyC4Bw7ENLY7KzBT7mYpnkLQvDg3MDkDUmbxRU2aWwCbRf') {
    connection.query("UPDATE user SET ? WHERE username = " + mysql.escape(username), {
      kyc,
      from_
    }, (err, result) => {
      if (err) { console.log(err); res.json({ success: false, msg: 'Error saving documents' }) } else {
        res.json({
          success: true,
          msg: 'Done'
        })
      }
    })
  } else {
    res.json({
      success: false,
      msg: 'Invalid secret'
    })
  }
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
router.post("/email/secret", (req,res)=>{
  const secret = req.body.secret
  connection.query("SELECT username, email FROM user WHERE secret = "+mysql.escape(secret), (err,result)=>{
    if (err) { console.log(err); res.json({ success: false, msg: 'Error getting data.' }) } else {
      if(result.length>0){
        connection.query("UPDATE user SET ? WHERE username = " + mysql.escape(result[0].username),{
          verified_mail: true
        }, (err, relt)=>{
          if (err) { console.log(err); res.json({ success: false, msg: 'Error getting data.' }) } else {
            res.json({
              success: true,
              username: result[0].username,
              email: result[0].email
            })
          }
        })
      }else{
        res.json({
          success: false,
          msg: 'Invalid secret'
        })
      }
    }
  })
})
router.post("/kyc/level", (req, res) => {
  const secret = req.body.secret
  const username = req.body.username
  if (secret == 'ecZDUVwAf4PbKxvKzfZf8GSDy46sJeezXKFT6Z3g4545DUZuvrtbWzDAXxARucVfmnpV7TNfAdrxfH8vsmcyC4Bw7ENLY7KzBT7mYpnkLQvDg3MDkDUmbxRU2aWwCbRf') {
    connection.query("SELECT kyc, verified_mail, verified_kyc, verified_mail_date, verified_kyc_date FROM user WHERE username = " + mysql.escape(username), (err, result) => {
      if (err) { console.log(err); res.json({ success: false, msg: 'Error getting data.' }) } else {
        var level = 0
        var status = 0
        if (result.length > 0) {
          var date = new Date(result[0].verified_mail_date)
          var now = Date.now()
          var time_elapsed = now - date.getTime()
          console.log(Math.floor(time_elapsed / 60000))
          time_elapsed = Math.floor(time_elapsed / 60000)
          result[0].verified_mail == 1 ? level = 1 : result[0].verified_mail_date == null ? status = 0 : time_elapsed > 30 ? status = 0 : status = 1
          if (level == 1) {
            result[0].verified_kyc == 1 ? level = 2 : result[0].kyc == null ? status = 0 : status = 1
          }
          res.json({
            success: true,
            level,
            status,
            time_elapsed
          })
        } else {
          res.json({
            success: false,
            msg: 'Username do not exist.'
          })
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

