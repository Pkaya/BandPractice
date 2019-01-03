$(document).ready(function(){

    //DOM Login
    var $user_form_area = $("#div_user_form_area");
    var $user_form = $("#frm_user_form");

    //DOM Chat
    var $chat_box = $("#chat_box");
    var $user_list = $("#user_list");
    var $txt_message = $("#txt_message");
    var $user_name = $("#txt_username");
    var $lobby_id = $("#hid_lobby_id");
    var $frm_message = $("#frm_message");
    var $div_lobby_container = $("#div_lobby_container");

    //DOM Instrument


    //Initially hide the lobby
    $div_lobby_container.hide();

    //Emit Socket events
    var socket = io.connect('http://localhost:4000');

    //New User - send username lobby and instrument selected
    $user_form.on("submit", function (e) {
        var $sel_instrument_val = $("input[name=optinstrument]:checked").val();

        e.preventDefault();
        console.log($user_name.val());
        socket.emit('new_user',{lobby:$lobby_id.val(),username:$user_name.val(),instrument:  $sel_instrument_val}, function(data){
            //server needs to give the go ahead for username
            if(data){
                $user_form_area.hide();
                $div_lobby_container.show();
            }
        });
    });

    //Message form submitted
    $frm_message.on("submit", function () {
        socket.emit('send_message',{message:$txt_message.val(),username:$user_name.val()});
        $txt_message.val("");
    });

    //Listen for new message from server
    socket.on('new_message',function(data){
        printMessage(data);
    });

    //Update users
    socket.on('get_users',function(data){
        console.log(data);
        var html = '';
        for(i = 0; i < data.length; i++){
            html+= '<li >'+data[i].username+'</li>';
        }
        printToUserList(html);
    });

    //Update Instruments
    socket.on('get_instruments',function(data){
        //disableInstruments();
        //disable and uncheck items in data and default to first other option
        for (i=0 ; i < data.length; i++){
            var instrument = data[i];
            var target_instr = $(":radio[value="+instrument+"]");
            //find radio element
            if (target_instr !== undefined ){
                target_instr.closest('div').hide();
            }
        }

        console.log(data);
    });


    //Functions and Helper methods
    function printToUserList(message){
        $user_list.html(message);
    }

    //Check server for data format
    function printMessage(data) {
        console.log(data);
        $chat_box.append("<p>"+data.timestamp+":"+"<b>"+data.username+" ></b>"+data.message+"</p>");
    }


    //$(":radio[value=piano]").prop('checked',true);

});//end ready

