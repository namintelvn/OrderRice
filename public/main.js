var socket = io("http://localhost:3000");
var registerDialog;
var itemPrice = 32000;
var countRegister = 0;

socket.on("server-register-failed", function(){
  $('#register_label').html('Someone take your name then change it.')
});

socket.on("server-register-success", function(data){
  countRegister = -1;
  registerDialog.dialog('close');
  localStorage.setItem('name', data);
});

socket.on("server-getlistfood", function(data){
  $('#content').html(data);
  $('img').each(function(index, value) {
    $(value).attr('src', 'https://www.anzi.com.vn' + $(value).attr('src'));
  })
  $('.des').remove();
  $('.update').remove();
  $('.name').each(function(indev, value) {
    var itemName = $(this).text().trim();
    $(this).after(`<button name="${itemName}" class="btn-order btn btn-primary">Order</button>`);
    socket.emit("client-order", {name: itemName, flag: 0});
  })
  $('.btn-order').each(function(indev, value) {
    $(value).click(function(params) {
      if(!localStorage.getItem('name')) {
        return;
      }
      if($(this).text().trim() == 'Order') {
        $(this).text('Cancel').removeClass('btn-primary').addClass('btn-danger');
        socket.emit("client-order", {name: $(this).attr('name'), flag: 1});
      } else {
        $(this).text('Order').addClass('btn-primary').removeClass('btn-danger');
        socket.emit("client-order", {name: $(this).attr('name'), flag: -1});
      }
    })
  })
  $('#order').css('display','');
});

socket.on("server-getlistorder", function(data){
  var listOrder = data.orderItems;
  var count = 0;
  $('#order tbody').html('');
  for (const key in listOrder) {
    if (listOrder.hasOwnProperty(key)) {
      const quantity = listOrder[key];
      count+= quantity
      $('#order tbody').append(`<tr><td>${key}</td><td>${quantity}</td><td>${itemPrice.toLocaleString()} đ</td></tr>`)
    }
  }
  $('#orderCount').text(count);
  $('#orderMoney').text((count * itemPrice).toLocaleString() + ' đ');
  if(data.log !== '') {
    $('textarea').text($('textarea').text() + '\n' + data.log);
  }
});

$(document).ready(function(){
  init();
  register();
  getListFood();
  socket.emit("client-getlistorder", '');

  function init() {
    var dateNow = new Date();
    $('#timeNow').html('THỰC ĐƠN (' + dateNow.getDate() + '/' + (dateNow.getMonth() + 1) + '/' + dateNow.getFullYear() + ')')
    registerDialog = $( "#dialog-register" ).dialog({
      autoOpen: false,
      buttons: {
        "Register": addUser,
      },
      close: function() {
        switch (countRegister) {
          case -1: 
            return;
          case 0:
            $('#register_label').html('Tell me who are you ?')
            countRegister++;
            break;
          case 1:
            $('#register_label').html('Don\'t make ask twice! Who the fuck are you?')
              countRegister++;
              break;
          case 2:
            $('#register_label').html('You wanna die? Last chance, who are you?')
              countRegister++;
              break;  
          default:
            window.close();
            break;
        }
        registerDialog.dialog('open')
      }
    });
  }

  function getListFood() {
    socket.emit("client-getlistfood");
  }

  function register() {
    const targetName = localStorage.getItem('name');
    if(!targetName) {
      registerDialog.dialog('open')
    } else {
      socket.emit("client-register", {targetName, flag: 0});
    }
  }

  function addUser() {
    if(!$('#register_name').val()) {
      return;
    }
    socket.emit("client-register", {targetName: $("#register_name").val(), flag: 1});
  }
});
