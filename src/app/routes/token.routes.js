const express = require('express');
const router = express.Router();
const auth = require("../../config/auth");
const dbConnection = require('../../config/dbconnection');
const connection = dbConnection();
var mysql = require('mysql');
setInterval(()=>{
    connection.query("SELECT 1")
  }, 5000)

router.post('/sync', auth.checkToken , (req, res)=>{
    var i = 0
    if(req.body.token!=undefined){
        connection.query("DELETE FROM `token` WHERE `username` = "+mysql.escape(req.body.username))
        req.body.token.map((data)=>{
            i+=1
            connection.query("INSERT INTO `token`(`id` , `username`, `secret`, `description`) VALUES ("+i+","+mysql.escape(req.body.username)+","+mysql.escape(data.secret)+","+mysql.escape(data.description)+")")
        })
        res.json({
            success: true
        })
    }
})
router.post('/get', auth.checkToken , (req, res)=>{
        connection.query("SELECT * FROM `token` WHERE `username` = "+mysql.escape(req.body.username),(err, result)=>{
            if(err){res.json({success: false, message: JSON.stringify(err)})}else{
            var token = []
            result.map((data)=>{
                token.push({
                    id: data.id,
                    secret: data.secret,
                    token: '',
                    description: data.description
                })
            })
            res.json({
                success: true,
                token: token
            })
        }
        })
})



module.exports = router;