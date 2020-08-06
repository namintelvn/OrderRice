var socket = io(window.location.href);
var registerDialog;
var captureOrderDialog;
var listUserGameDialog;
var wheelGameDialog;
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
    var currentSrc = $(value).attr('src');
    if(currentSrc != '') {
      $(value).attr('src', 'https://www.anzi.com.vn' + $(value).attr('src'));
    }
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
  var listCurrentUserOrder = [];
  $('#order tbody').html('');

  var currentUser = localStorage.getItem('name');
  for (const key in listOrder) {
    if (listOrder.hasOwnProperty(key)) {
      const quantity = listOrder[key].quantity;
      const orderUser = listOrder[key].orderUser;
      count+= quantity
      $('#order tbody').append(`
        <tr>
          <td>${key}</td>
          <td>${quantity}</td>
          <td>${itemPrice.toLocaleString()} đ</td>
          <td>${Object.keys(orderUser).filter(item => (orderUser[item] == true))}</td>
        </tr>
      `);
      if(orderUser[currentUser]) {
        listCurrentUserOrder.push(key);
      }
    }
  }
  for (const item of listCurrentUserOrder) {
    $(`.btn-order[name="${item}"]`).text('Cancel').removeClass('btn-primary').addClass('btn-danger');
  }
  $('#orderCount').text(count);
  $('#orderMoney').text((count * itemPrice).toLocaleString() + ' đ');
  if(data.log !== '') {
    $('textarea').text($('textarea').text() + '\n' + data.log);
  }
});

socket.on("error", function(error){
  console.log(error);
});

socket.on("server-getUsers", function(listUser){
  var html = ''
  listUser.map(item => {
    html += `<input type="checkbox" name="${item}">
              <label>${item}</label><br>`
  });
  $('#dialog-listUser').html(html);
  listUserGameDialog.dialog('open')
});

$(document).ready(function(){
  init();
  register();
  getListFood();
  socket.emit("client-getlistorder", '');

  function init() {
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

    captureOrderDialog = $( "#dialog-capture-order" ).dialog({
      autoOpen: false,
      title: '* Press right mouse then choose "Copy Image"',
      width: 'auto'
    });

    $('#capture_order').click(function(){
      getScreenshotOfElement();
    })
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
    socket.emit("client-register", {targetName: escape($("#register_name").val()), flag: 1});
  }

  function getScreenshotOfElement() {
    $('#order td:nth-child(4)').css('display','none');
    html2canvas(document.querySelector("#order table")).then(canvas => {
      canvas.toBlob(function(blob) { 
        const item = new ClipboardItem({ "image/png": blob });
        try {
          navigator.clipboard.write([item]);
          $('#order td:nth-child(4)').css('display','');
          setTimeout(() => {
            alert('Ctrl-V to paste order list image.')
          }, 100);
        } catch (error) {
          console.log(error);
          openImagePopup(blob);
        }
      });
    });
  }

  function openImagePopup(blob) {
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    $('#img-capture-order').attr('src', imageUrl);
    captureOrderDialog.dialog('open');
  }
});
