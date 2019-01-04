$(document).ready(function(){
    //test new comment 2
    var local =  false;
    var local_address = 'http://localhost:4000';
    var server_address = 'http://34.220.11.223';

    var address_to_use = local? local_address : server_address;


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



   //  var arr = [
   //      { lobby: '1', username: 'test', instrument: 'guitar' },
   //      { lobby: '1', username: 'gadsf', instrument: 'guitar' } ];
   //  console.log(arr);
   //
   // //arr.splice(arr.indexOf("test"),1);
   //
   //  console.log(arr.indexOf("test"));



    //Initially hide the lobby
    $div_lobby_container.hide();

    //Emit Socket events
    var socket = io.connect(address_to_use);

    var drumsounds =
        [
            //drums
            {"char": "q", "filename": "kick"},
            {"char": "w", "filename": "snare"},
            {"char": "u", "filename": "bob3"},
            //guitar

        ];

    var guitarsounds = [
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
    ];




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

        switch($sel_instrument_val){
            case "guitar":
                buildInstrument(guitarsounds);
                break;
            case "drums":
                buildInstrument(drumsounds);
        }

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



    //Get Key
    socket.on("get_key",function(data){
        console.log(data);

        var filename = "";
        switch(data.instrument){
            case "guitar":
                filename = returnFileName(guitarsounds,data.key);
                break;
            case "drums":
                filename = returnFileName(drumsounds,data.key);
        }


        if (filename !== false) {
            new Audio('/sounds/'+filename + '.mp3').currentTime = 0;
            new Audio('/sounds/'+filename + '.mp3').play();
        }

        console.log(data.filename);

        doBounce($("#div_"+filename), 3, '30px', 50);
    });


    console.log(returnFileName(guitarsounds,'a'));

    function returnFileName(array,char) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].char === char) {
                return array[i].filename;
            }
        }
        return false;
    }



//******************************************************
// Audio functionality
//******************************************************

    $(document).keypress(function (event) {
        var keyCode = event.which;
        var keyChar = String.fromCharCode(event.which);
        var $sel_instrument_val = $("input[name=optinstrument]:checked").val();

        //Send keycode only if lobby div is visibile and box is active
        if($div_lobby_container.is(":visible") && $('#instrument_box').hasClass("box-active")){
            socket.emit('send_key',{instrument: $sel_instrument_val, key:keyChar});
            console.log(keyCode);
        }
    });



    $("#instrument_box").on ("click",function(){
        $(this).addClass("box-active");
        $("#chat_box").removeClass("box-active");
    });

    $("#chat_box").on ("click",function(){
        $(this).addClass("box-active");
        $("#instrument_box").removeClass("box-active");
    });



    function buildInstrument(array){
        for (var i = 0; i < array.length; i++) {
            var char = array[i].char;
            var filename = array[i].filename;

            var keydiv = '<div class="col-md-1 audio-box" id="div_'+filename+'">'+filename+'<span>['+char+']</span></div>';
            $("#instrument_box").append(keydiv);

        }
    }

    // new Audio('/sounds/guitar1' + '.mp3').play();


    function doBounce(element, times, distance, speed) {
        for(var i = 0; i < times; i++) {
            element.animate({marginTop: '-='+distance}, speed)
                .animate({marginTop: '+='+distance}, speed);
        }
    }


});//end ready

