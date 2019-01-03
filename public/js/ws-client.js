$(document).ready(function(){



    //DOM Elements
    var $chat_box = $("#chat_box");
    var $user_list = $("#user_list");
    var $txt_message = $("#txt_message");
    var $user_name = $("#txt_username");
    var $lobby_id = $("#hid_lobby_id");
    var $frm_message = $("#frm_message");
    var $user_form_area = $("#div_user_form_area");
    var $user_form = $("#frm_user_form");
    var $div_lobby_container = $("#div_lobby_container");

    $div_lobby_container.hide();

    //Emit Socket events
    var socket = io.connect('http://localhost:4000');


    //message form submitted
    $frm_message.on("submit", function () {
        socket.emit('send_message',{message:$txt_message.val(),username:$user_name.val()});
        $txt_message.val("");
    });

    //Listen for new message
    socket.on('new_message',function(data){
        printMessage(data);
    });

    //New User
    $user_form.on("submit", function (e) {
        e.preventDefault();
        socket.emit('new_user',{lobby:$lobby_id,username:$user_name.val()}, function(data){
            if(data){
                $user_form_area.hide();
                $div_lobby_container.show();
            }
        });
    });

    socket.on('get_users',function(data){
        console.log(data);
        var html = '';
        for(i = 0; i < data.length; i++){
            html+= '<li >'+data[i].username+'</li>';
        }
        printToUserList(html);
    });



    function printToUserList(message){
        $user_list.html(message);
    }

    function printMessage(data) {
        console.log(data);
        $chat_box.append("<p>"+data.timestamp+":"+"<b>"+data.username+" ></b>"+data.message+"</p>");
    }

});//end ready

