$(document).ready(function () {
    //Thông số vòng quay
    let duration = 15; //Thời gian kết thúc vòng quay
    let spins = 15; //Quay nhanh hay chậm 3, 8, 15
    let color = [
        '#eae56f',
        '#89f26e',
        '#7de6ef',
        '#e7706f',
        '#eae56f',
        '#89f26e',
        '#7de6ef',
        '#e7706f'   
    ];
    let theWheel = {
        'numSegments': 8,     // Chia 8 phần bằng nhau
        'outerRadius': 212,   // Đặt bán kính vòng quay
        'textFontSize': 18,    // Đặt kích thước chữ
        'rotationAngle': 0,     // Đặt góc vòng quay từ 0 đến 360 độ.
        'segments': [],      // Các thành phần bao gồm màu sắc và văn bản.
        'animation': {
            'type': 'spinToStop',
            'duration': duration,
            'spins': spins,
            'soundTrigger': 'pin',         //Chỉ định chân là để kích hoạt âm thanh
            'callbackFinished': alertPrize,    //Hàm hiển thị kết quả trúng giải thưởng
        },
        'pins':
        {
            'number': 32   //Số lượng chân. Chia đều xung quanh vòng quay.
        }
    };

    function initWheel() {
        var listUser = []
        $('#dialog-listUser input:checked').each(function() {
            listUser.push($(this).attr('name'));
        });
        if(listUser.length == 0) {
            return;
        }
        theWheel['numSegments'] = listUser.length;
        theWheel['pins']['number'] = listUser.length * 6;
        theWheel['segments'] = listUser.map((item, index) => {
            return { 'fillStyle': color[index], 'text': item }
        });
        theWheel = new Winwheel(theWheel);
        listUserGameDialog.dialog('close');
        wheelGameDialog.dialog('open');
    }

    //startSpin
    function start() {
        theWheel.stopAnimation(false);
        theWheel.rotationAngle = 0;
        theWheel.draw();
        theWheel.startAnimation();
    };

    //Result
    function alertPrize(indicatedSegment) {
        alert("Congratulation " + indicatedSegment.text);
    }
    listUserGameDialog = $('#dialog-listUser').dialog({
        autoOpen: false,
        width: '470px',
        title: 'Choose who will join this game.',
        buttons: {
            "Comfirm": initWheel
        }
    })

    wheelGameDialog = $('#dialog-random').dialog({
        autoOpen: false,
        width: '470px',
        buttons: {
            "Wheel": start
        }
    })

    $('#random').click(function() {
        if(socket) {
            socket.emit("client-getUsers");
        }
    })
});