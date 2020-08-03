var express = require("express");
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");

var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(process.env.PORT || 3000);

const request = require('request');

var currentDate = '';
var orderUsers = [];
var orderItems = {};

io.on("connection", function (socket) {
  var newDate = new Date();
  var newDateString = newDate.getFullYear() + '-' + (newDate.getMonth() + 1) + '-' + newDate.getDate();
  if (currentDate !== newDateString) {
    orderItems = {};
    currentDate = newDateString;
  }

  socket.on("client-register", function (data) {
    var orderName = data.targetName;
    var flag = data.flag;

    if (flag == 1 && orderUsers.indexOf(orderName) >= 0) {
      socket.emit("server-register-failed");
    } else {
      orderUsers.push(orderName);
      socket.orderUser = orderName;
      if (flag == 1) {
        socket.emit("server-register-success", orderName);
      }
    }
  });

  socket.on("client-getlistfood", function () {
    request.post('https://www.anzi.com.vn/home/getListMenu',
      { form: { date: currentDate } },
      function (err, res, body) {
        if (err) {
          socket.emit("error", err);
          return;
        }
        var html = body.match(/(?<=<body>)([\s\S]+)(?=<\/body>)/g);
        socket.emit("server-getlistfood", html);
      }
    )
  });

  socket.on("client-order", function (data) {
    var name = data.name;
    if (!orderItems[name]) {
      orderItems[name] = {
        orderUser: {},
        quantity: 0
      }

    }
    if (socket.orderUser && data.flag != 0) {
      if (data.flag == 1) {
        orderItems[name].orderUser[socket.orderUser] = true;
      } else if (data.flag == -1) {
        orderItems[name].orderUser[socket.orderUser] = false;
      }
    }
    orderItems[name].quantity = orderItems[name].quantity + data.flag;

    // get log
    var and = '';
    var log = '';
    if (data.flag == 1) {
      and = ' order ';
    } else if (data.flag == -1) {
      and = ' cancel order ';
    }

    if (data.flag != 0) {
      log = socket.orderUser + and + data.name;
    }

    io.sockets.emit("server-getlistorder", { orderItems, log });
  });

  socket.on("client-getlistorder", function (data) {
    io.sockets.emit("server-getlistorder", { orderItems, log: '' });
  });
});

app.get("/", function (req, res) {
  res.render("index");
});
