const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
//require('./src/main.js');
require('./src/main-exceljs.js');
app.set('trust proxy', 'loopback');
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'POST,GET');
  res.header('X-Powered-By', ' 3.2.1');
  // res.header("Content-Type", "application/json;charset=utf-8");
  next();
});
//设置解析数据
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
//定位首页
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendfile(`${__dirname}/public/index.html`);
});


http.listen(3001, () => console.log('Example app listening on port 3001!'));
