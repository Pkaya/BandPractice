$(document).ready(function () {

//**********************************************************************************************************************
// Initiation Code
//**********************************************************************************************************************
    var local = true;
    var local_address = 'http://localhost:4000';
    var server_address = 'http://52.33.25.101';
    var address_to_use = local ? local_address : server_address;

    //DOM Login
    var $user_form_area = $("#div_user_form_area");
    var $user_form = $("#frm_user_form");
    var $user_name = $("#txt_username");
    var $errors = $("#div_errors");
    //DOM Chat
    var $chat_box = $("#chat_box");
    var $txt_message = $("#txt_message");
    var $lobby_id = $("#hid_lobby_id");
    var $frm_message = $("#frm_message");
    var $div_lobby_container = $("#div_lobby_container");


    //Initially hide the lobby
    $div_lobby_container.hide();

    //Emit Socket events
    var query_lobby = 'lobby_id='+$lobby_id.val();
    var socket = io.connect(address_to_use,{query:query_lobby});


    const usermodel = new UserModel();
    const user_list_observer = new userListObserver('ul_user_list');

    usermodel.addObserver(user_list_observer);

//**********************************************************************************************************************
// Socket Listen / Emit functionality
//**********************************************************************************************************************
    // [1] Events which only listen to server
    // [2] Events which emit to server
    // [3] Events which listen to server and emit to server

    var Message = function (lobby_id, type, message_body) {
        var self = {
            lobby_id: lobby_id,
            type: type,
            message_body: message_body,
        };
        return self;
    };

    var User = function (lobby_id, username, instrument) {
        return  {
            lobby_id: lobby_id,
            username: username,
            instrument: instrument,
        }
    };

    /**
     *
     * @param lobby_id
     * @param instrument
     * @param char
     * @returns {{lobby_id: *, instrument: *, char: *}}
     * @constructor
     */
    var Key = function(lobby_id, instrument,char){
        return{
            lobby_id : lobby_id,
            instrument : instrument,
            char: char,
        }
    };


    //[1] Listen for new message from server
    socket.on('new_message', function (data) {
        console.log("new message received");
       // console.log(data);

        printMessage(data);
    });


    //[1] Update users
    socket.on('get_users', function (data) {
        console.log(data);
        usermodel.newUserArray(data.users);
    });

    // //[1] Poll instruments
    // setInterval(function(){
    //     socket.emit('request_instruments', {lobby_id: $lobby_id.val()});
    // },1000);

     //[1] Update instruments to see what's available
    socket.on('get_instruments', function (data) {
        console.log(data);
        //disableInstruments();
        //disable and uncheck items in data and default to first other option
        for (i = 0; i < data.length; i++) {

            var instrument = data[i];
            var target_instr = $(":radio[value=" + instrument + "]");
            //find radio element
            if (target_instr !== undefined) {
                target_instr.closest('div').removeClass('hidden');
            }
        }
    });





    //[1] Get key from server and play correct sounds
    socket.on("get_key", function (data) {
        console.log(data);

        var filename = returnFileName(sounds,data.instrument,data.char);

        if (filename !== false) {
            new Audio('/sounds/'+'/'+data.instrument+'/' + filename + '.mp3').currentTime = 0;
            new Audio('/sounds/' +'/'+data.instrument+'/' + filename + '.mp3').play();
        }
        doBounce($("#div_" + filename), 3, '30px', 50);
    });

    //[1] Send out keystroke to server
    $(document).keypress(function (event) {
        var key_code = event.which;
        var key_char = String.fromCharCode(key_code);
        var $sel_instrument_val = $("input[name=optinstrument]:checked").val();

        var key = new Key($lobby_id.val(),$sel_instrument_val,key_char);

        //Send keycode only if lobby div is visibile and box is active
        if ($div_lobby_container.is(":visible") && $('#instrument_box').hasClass("box-active")) {
            socket.emit('send_key', key);

        }
    });

    //[2] Send this new user - send username lobby and instrument selected to server
    $user_form.on("submit", function (e) {
        e.preventDefault();

        $.post(address_to_use+'/checkusername',{username:$user_name.val()},function (data) {
            if(data.valid){
                $errors.addClass('hidden');
                var $sel_instrument_val = $("input[name=optinstrument]:checked").val();
                var user = new User($lobby_id.val(),$user_name.val(),$sel_instrument_val);

                buildInstruments();

                socket.emit('new_user', user, function (data) {
                    //server needs to give the go ahead for username
                    if (data) {
                        $user_form_area.hide();
                        $div_lobby_container.show();
                    }
                });
            }else{
                $errors.removeClass('hidden');
                $errors.html(data.error_msg);
            }
        })


        //make request to server to check usernames

        // var $sel_instrument_val = $("input[name=optinstrument]:checked").val();
        // var user = new User($lobby_id.val(),$user_name.val(),$sel_instrument_val);
        //
        // buildInstruments();
        //
        // socket.emit('new_user', user, function (data) {
        //     //server needs to give the go ahead for username
        //     if (data) {
        //         $user_form_area.hide();
        //         $div_lobby_container.show();
        //     }
        // });
    });

    //[2] Send message when message form submitted
    $frm_message.on("submit", function () {
        var message = new Message($lobby_id.val(),"public",$txt_message.val() );
        socket.emit('send_message', message);
        $txt_message.val("");
    });

//**********************************************************************************************************************
// //Functions and Helper methods
//**********************************************************************************************************************

    /**
     * Loop through associate array {this will be a standard object}
     * @param object
     * @param func
     */
    function loopthroughAssociativeArray(object,func){
        Object.getOwnPropertyNames(object).forEach(func);
    }

    function loopthroughObject(object,func){
        Object.keys(object).forEach(func);
    }


    /**
     * Print message from server
     * @param data
     */
    function printMessage(data) {
        var message = data;

        switch(message.type){
            case 'public':
                $chat_box.append("<p>" + data.timestamp + ":" + "<b>" + data.username + " ></b>" + data.message_body + "</p>");
                break;
            case 'info_join':
                $chat_box.append("<p><i class='lobby-join'>" + data.timestamp + ":" + data.message_body + "</i></p>");
                break;
            case 'info_leave':
                $chat_box.append("<p><i class='lobby-leave'>" + data.timestamp + ":" + data.message_body + "</i></p>");
                break;
        }
    }


    function returnFileName(object, instrument, char) {
        var file_name = "";

        loopthroughAssociativeArray(object,function(val,idx){
            var key_name = Object.keys(object)[idx];

            if (instrument === key_name) {

                for (var i = 0; i < object[val].length; i++) {
                    //console.log(object[val][i]);
                    if (object[val][i].char === char) {
                        //return object[val][i].filename;
                        //return "yes";
                        file_name = object[val][i].filename;
                    }
                }
            }
        });
        return file_name;
    }


    /**
     * Build all instruments
     */
    function buildInstruments() {
        var $instrument_box = $("#instrument_box");

        loopthroughAssociativeArray(sounds,function(val,idx){
            var instr_name = Object.keys(sounds)[idx];

            var instrument_wrapper = '<div class="row row-instrument">';
            for (var i = 0; i < sounds[val].length; i++) {

                var char = sounds[val][i].char;
                var filename = sounds[val][i].filename;

                var keydiv = '<div class="col-md-1 audio-box" id="div_' + filename + '">' + filename + '<span>[' + char + ']</span></div>';
                instrument_wrapper+= (keydiv);
            }
            instrument_wrapper+= '</div>';

            $instrument_box.append(instrument_wrapper+'<br><h4>'+instr_name+'</h4>');
        });
    }

    /**
     * Bounce effect for keyboard keys
     * @param element
     * @param times
     * @param distance
     * @param speed
     */
    function doBounce(element, times = 3, distance = '30px', speed =50) {
        for (var i = 0; i < times; i++) {
            element.animate({marginTop: '-=' + distance}, speed)
                .animate({marginTop: '+=' + distance}, speed);
        }
    }


//******************************************************
// Temp functionality
//******************************************************



    $("#instrument_box").on("click", function () {
        $(this).addClass("box-active");
        $("#txt_message").removeClass("box-active");
    });

    $("#txt_message").on("click", function () {
        $(this).addClass("box-active");
        $("#instrument_box").removeClass("box-active");
    });

});//end ready

