const express = require('express');
const path =  require('path');
const morgan = require('morgan');
const app = express();
var httpContext = require('express-http-context')
const bodyParser = require("body-parser");
const uuid = require('uuid')
const upload = require('express-fileupload')
//setting
app.set('port', process.env.port || 3001);
app.use(express.static(path.join(__dirname, '../public')));
app.use(httpContext.middleware);
app.use((req,res,next)=>{
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
app.use('/api/validate', require ('../app/routes/validation.routes'));
app.get('/*', (req,res)=>{
  res.json({
    success: false,
    msg: 'Access Denied'
  })
})
app.use(upload())
app.post('/upload', (req,res)=>{
  const username=req.body.username
  console.log(data.files)
  var key = 'selfie'
  if(req.files.selfie == undefined){
    key = 'ID'
  }
  var image = req.files[key].mimetype.split('/')
  if(image[0]=='image'&&(image[1]=='png'||image[1]=='jpg')){
    req.files[key].mv('./src/public/uploaded/'+username+'_'+key+'.'+image[1],err=>{
      if(err){
        console.log(err)
        res.json({
          success: false,
          msg: 'Error saving the '+key+' file.'
        })
      }else{
        res.json({
          success: true,
          msg: 'Done'
        })
      }
    })

  }else{
    res.json({
      success: false,
      msg: 'Invalid file or format for '+key
    })
  }
})
module.exports = app;