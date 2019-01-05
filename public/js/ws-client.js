$(document).ready(function () {

//**********************************************************************************************************************
// Initiation Code
//**********************************************************************************************************************
    var local = true;
    var local_address = 'http://localhost:4000';
    var server_address = 'http://34.220.11.223';
    var address_to_use = local ? local_address : server_address;

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


    //Initially hide the lobby
    $div_lobby_container.hide();

    //Emit Socket events
    var socket = io.connect(address_to_use);


    var sounds = {
        "guitar":[
            {"char": "a", "filename": "key1"},
            {"char": "s", "filename": "key2"},
            {"char": "d", "filename": "key3"},
            {"char": "f", "filename": "key4"},
            {"char": "g", "filename": "key5"},
            {"char": "h", "filename": "key6"},
            {"char": "j", "filename": "guitar1"},
            {"char": "k", "filename": "guitar2"},
            {"char": "l", "filename": "guitar3"},
            {"char": ";", "filename": "guitar4"},
            {"char": "'", "filename": "guitar5"}
        ],
        "drums":[
            {"char": "a", "filename": "rim"},
            {"char": "s", "filename": "snare"},
            {"char": "d", "filename": "snare2"},
            {"char": "f", "filename": "kick"},
            {"char": "g", "filename": "kick2"},
            {"char": "h", "filename": "bob1"},
            {"char": "j", "filename": "bob2"},
            {"char": "k", "filename": "bob3"},
            {"char": "l", "filename": "bob4"},
            {"char": ";", "filename": "bob5"},
        ],
        "vox":[
            {"char": "a", "filename": "jyea"},
            {"char": "s", "filename": "awgh"},
            {"char": "d", "filename": "hey"},
            {"char": "f", "filename": "yeauh"},
            {"char": "g", "filename": "ugh"},
            {"char": "h", "filename": "aweyeah"},
            {"char": "j", "filename": "ha"},
            {"char": "k", "filename": "holdup"},
            {"char": "l", "filename": "huh"},
            {"char": ";", "filename": "another"},
        ]

    };


//**********************************************************************************************************************
// Socket Listen / Emit functionality
//**********************************************************************************************************************
    // [1] Events which only listen to server
    // [2] Events which emit to server
    // [3] Events which listen to server and emit to server


    //[1] Listen for new message from server
    socket.on('new_message', function (data) {
        printMessage(data);
    });

    //[1] Update users
    socket.on('get_users', function (data) {
        var html = '';
        loopTrhoughObject(data.users,function(val){
            html += '<li >' + data.users[val].username + '</li>';
        });

        // var temp_obj = data.users;
        // delete temp_obj[data.my_id];
        //
        // loopTrhoughObject(temp_obj,function(val){
        //     var other_instrument = temp_obj[val].instrument;
        //
        //     buildInstrument(other_instrument);
        // });

        /**
         * Todo - have all instruments built and show when other users are connected
         */
        //build other users instruments
       // buildInstrument(data.instrument);

        printToUserList(html);
    });

     //[1] Update instruments to see what's available
    socket.on('get_instruments', function (data) {
        //disableInstruments();
        //disable and uncheck items in data and default to first other option
        for (i = 0; i < data.length; i++) {
            var instrument = data[i];
            var target_instr = $(":radio[value=" + instrument + "]");
            //find radio element
            if (target_instr !== undefined) {
                target_instr.closest('div').hide();
            }
        }
    });

    //[1] Get key from server and play correct sounds
    socket.on("get_key", function (data) {
        //console.log(data);

        var filename = returnFileName(sounds,data.instrument,data.key);

        if (filename !== false) {
            new Audio('/sounds/'+'/'+data.instrument+'/' + filename + '.mp3').currentTime = 0;
            new Audio('/sounds/' +'/'+data.instrument+'/' + filename + '.mp3').play();
        }
        doBounce($("#div_" + filename), 3, '30px', 50);
    });

    //[1] Send out keystroke to server
    $(document).keypress(function (event) {
        var keyCode = event.which;
        var keyChar = String.fromCharCode(event.which);
        var $sel_instrument_val = $("input[name=optinstrument]:checked").val();

        //Send keycode only if lobby div is visibile and box is active
        if ($div_lobby_container.is(":visible") && $('#instrument_box').hasClass("box-active")) {
            socket.emit('send_key', {instrument: $sel_instrument_val, key: keyChar});
            console.log(keyCode);
        }
    });

    //[2] Send this new user - send username lobby and instrument selected to server
    $user_form.on("submit", function (e) {
        e.preventDefault();
        var $sel_instrument_val = $("input[name=optinstrument]:checked").val();


        buildInstruments();

        socket.emit('new_user', {lobby: $lobby_id.val(), username: $user_name.val(), instrument: $sel_instrument_val
        }, function (data) {
            //server needs to give the go ahead for username
            if (data) {
                $user_form_area.hide();
                $div_lobby_container.show();
            }
        });
    });

    //[2] Send message when message form submitted
    $frm_message.on("submit", function () {
        socket.emit('send_message', {message: $txt_message.val(), username: $user_name.val()});
        $txt_message.val("");
    });

//**********************************************************************************************************************
// //Functions and Helper methods
//**********************************************************************************************************************

    /**
     * Apply a function to an object
     * @param object
     * @param func
     */
    function loopTrhoughObject(object,func){
        Object.getOwnPropertyNames(object).forEach(func);
    }

    function printToUserList(message) {
        $user_list.html(message);
    }

    /**
     * Print message from server
     * @param data
     */
    function printMessage(data) {
        $chat_box.append("<p>" + data.timestamp + ":" + "<b>" + data.username + " ></b>" + data.message + "</p>");
    }


    function returnFileName(object, instrument, char) {
        var file_name = "";

        loopTrhoughObject(object,function(val,idx){
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

        loopTrhoughObject(sounds,function(val,idx){
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
    function doBounce(element, times, distance, speed) {
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
        $("#chat_box").removeClass("box-active");
    });

    $("#chat_box").on("click", function () {
        $(this).addClass("box-active");
        $("#instrument_box").removeClass("box-active");
    });


});//end ready

