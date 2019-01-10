var local = true;
var local_storage_enable = true;
var local_address = 'http://localhost:4000';
var server_address = 'http://3.8.140.68';
var address_to_use = local ? local_address : server_address;

$(document).ready(function () {

//**********************************************************************************************************************
// Observer Pattern
//**********************************************************************************************************************

    /**
     * Keeps track of users activities
     */
    class UserModel {
        constructor() {
            this.count = 0;
            this.user = {};
            this.users = [];
            this.messagehistory = [];
            //all observers will be notified
            this.observers = [];
        }

        newUserArray(users) {
            this.users = users;
            this.notifyObservers();
        }

        addThisUser(user) {
            this.user = user;
        }

        addToMessages(message) {
            this.messagehistory.unshift(message)
            this.notifyObservers();
        }

        addObserver(o) {
            this.observers.push(o);
        }

        notifyObservers() {
            for (let o of  this.observers) {
                o.update(this);
            }
        }
    }

    /**
     * Used to update the user list
     */
    class userListObserver {
        constructor(elementId) {
            this.element = document.getElementById(elementId);
        }

        update(model) {
            var users = model.users;

            var html = '';
            $('.instr-header').find('span').html("");
            //Loop throuhg users and build list items in the User navigation list
            users.forEach(function (user) {
                var img = '<img class="leader-img" src="/images/crown.png">';
                var img_inc = user.type === 'leader' ? img : '';
                var leader = user.type === 'leader' ? "true" : "false";
                var instr = user.instrument;
                var username = user.username;
                var span_username = '<span class="span-username">' + username + '</span>';

                //Build the list item for user navigation
                html +=
                    '<li class="li-users"data-id="' + user.id + '" data-leader="' + leader + '">' + span_username + ' ' + img_inc + ' ' +
                    '<span class="li-' + instr + '">' + instr + '</span>' +
                    '<ul class="context-menu hidden"><li class="whisper">whisper</li></ul></li>';

                $('.instr-header[data-instrument="' + instr + '"]').find('span').html('<span class="user-header li-' + instr + '">' + "  " + username + '</span>');
            });
            this.element.innerHTML = html;
        }
    }

    /**
     * Outputs message history to console for the moment
     */
    class messagesObserver {
        //Todo write functionality to return last message when pressing up in input box
        constructor(elementId) {
        }

        update(model) {
            //console.log(model.messagehistory);
        }
    }

    //Observer pattern register observers
    const usermodel = new UserModel();
    const user_list_observer = new userListObserver('ul_user_list');

    const consoleObserver = new messagesObserver();
    usermodel.addObserver(user_list_observer);
    usermodel.addObserver(consoleObserver);

    //Other class definitions

    /**
     * Message class
     * @param lobby_id
     * @param type
     * @param message_body
     * @param recipient
     * @returns {{lobby_id: *, type: *, message_body: *, recipient: boolean}}
     * @constructor
     */
    var Message = function (lobby_id, type, message_body, recipient = false) {
        var self = {
            lobby_id: lobby_id,
            type: type,
            message_body: message_body,
            recipient: recipient,
        };
        return self;
    };

    /**
     * User class
     * @param lobby_id
     * @param username
     * @param instrument
     * @returns {{lobby_id: *, username: *, instrument: *}}
     * @constructor
     */
    var User = function (lobby_id, username, instrument) {
        return {
            lobby_id: lobby_id,
            username: username,
            instrument: instrument,
        }
    };

    /**
     *Key class
     * @param lobby_id
     * @param instrument
     * @param char
     * @returns {{lobby_id: *, instrument: *, char: *}}
     * @constructor
     */
    var Key = function (lobby_id, instrument, char) {
        return {
            lobby_id: lobby_id,
            instrument: instrument,
            char: char,
        }
    };


//**********************************************************************************************************************
// Initiation Code
//**********************************************************************************************************************
    //DOM localStorage
    var $btn_logout = $('.btn-logout');
    var $signed_in = $('.signed-in');

    //DOM Login
    var $user_form_area = $("#div_user_form_area");
    var $user_form = $("#frm_user_form");
    var $user_name = $("#txt_username");
    var $errors = $("#div_errors");

    //DOM Chat
    var $chat_box = $("#div_chat_box");
    var $txt_message = $("#txt_message");
    var $lobby_id = $("#hid_lobby_id");
    var $frm_message = $("#frm_message");
    var $div_lobby_container = $("#div_lobby_container");
    var $user_navbar = $(".user-navbar");
    var $instrument_box = $("#instrument_box");

    //LocalStorage
    var username_local = localStorage.getItem('username');

    //Initially hide the lobby containers
    hideLobbyContainer();

    //Emit Socket events
    var query_lobby = 'lobby_id=' + $lobby_id.val();
    var socket = io.connect(address_to_use, {query: query_lobby});

    var all_instruments = ['guitar', 'vox', 'drums'];

//**********************************************************************************************************************
// Socket Listen / Emit functionality
//**********************************************************************************************************************
    // [1] Events which only listen to server
    // [2] Events which emit to server
    // [3] Events which listen to server and emit to server

    //[1] Listen for new message from server
    socket.on('new_message', function (data) {
        usermodel.addToMessages(data);
        printMessage(data);
    });

    //[1] Update users
    socket.on('get_users', function (data) {
        usermodel.newUserArray(data.users);
    });

    //[1] Update instruments to see what's available
    socket.on('get_instruments', function (data) {

        //disable and uncheck items in data and default to first other option
        for (let i = 0; i < data.length; i++) {

            var instrument = data[i];
            var target_instr = $(":radio[value=" + instrument + "]");
            //find radio element
            if (target_instr !== undefined) {
                target_instr.closest('div').removeClass('hidden');
            }
        }

        var taken_instruments = $(all_instruments).not(data).get();
        if(taken_instruments.length === all_instruments.length){
            // Todo Lobby full action
        }

        //Hide taken instruments
        for (let i = 0; i < taken_instruments.length; i++) {
            $(":radio[value=" + taken_instruments[i] + "]").closest('div').addClass('hidden');

        }
    });

    //[1] Get key from server and play correct sounds
    socket.on("get_key", function (data) {

        var filename = returnFileName(sounds, data.instrument, data.char);

        if (filename !== false && filename.length > 0) {
            new Audio('/sounds/' + '/' + data.instrument + '/' + filename + '.mp3').currentTime = 0;
            new Audio('/sounds/' + '/' + data.instrument + '/' + filename + '.mp3').play();
        }
        doBounce($("#div_" + filename), 3, '30px', 50);
    });

    //[1] Send out keystroke to server
    $(document).keypress(function (event) {
        var key_code = event.which;
        var key_char = String.fromCharCode(key_code);
        var $sel_instrument_val = $("input[name=optinstrument]:checked").val();

        var key = new Key($lobby_id.val(), $sel_instrument_val, key_char);

        //Send keycode only if lobby div is visibile and box is active
        if ($div_lobby_container.is(":visible") && $instrument_box.hasClass("box-active")) {
            socket.emit('send_key', key);
        }
    });

    //[2] Send this new user - send username lobby and instrument selected to server
    $user_form.on("submit", function (e) {
        e.preventDefault();

        //Send ajax request
        $.post(address_to_use + '/checkusername', {username: $user_name.val()}, function (data) {
            if (data.valid) {
                $errors.addClass('hidden');
                var $sel_instrument_val = $("input[name=optinstrument]:checked").val();
                var user = new User($lobby_id.val(), $user_name.val(), $sel_instrument_val);

                buildInstruments();

                socket.emit('new_user', user, function (data) {
                    //server needs to give the go ahead for username
                    if (data) {
                        //add user to observer pattern
                        usermodel.addThisUser(data);
                        var username = data.username;
                        if(local_storage_enable) {
                            localStorage.setItem('username', username);
                        }
                        showLobbyContainer();
                        $('.span-username').html(username);
                    }
                });
            } else {
                $errors.removeClass('hidden');
                $errors.html(data.error_msg);
            }
        })
    });

    //[2] Send message when message form submitted
    $frm_message.on("submit", function () {
        var message = new Message($lobby_id.val(), "public", $txt_message.val());
        var full_msg = $txt_message.val();

        var split_string = $txt_message.val().split(' ');
        var first_split = split_string[0];
        var recipient_split = split_string[1];

        var msg_clean = full_msg.replace(first_split + ' ' + recipient_split, '');

        var whisper_format = "/w";

        if (first_split === whisper_format) {
            message = new Message($lobby_id.val(), "private", msg_clean, recipient_split);
        }

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
    function loopthroughAssociativeArray(object, func) {
        Object.getOwnPropertyNames(object).forEach(func);
    }

    /**
     * Print message from server
     * @param data
     */
    function printMessage(data) {
        var message = data;
        var timestamp = message.timestamp;
        var username = message.username;
        var message_body = message.message_body;

        switch (message.type) {
            case 'public':
                $chat_box.append("<p>" + timestamp + ":" + "<b>" + username + " ></b>" + message_body + "</p>");
                break;
            case 'private':
                $chat_box.append("<p class='whisper'>" + timestamp + ":" + "" +
                    "<b>&nbsp;From&nbsp;" + username + "</b> > to <b>" + data.recipient + ":</b>" + message_body + "</p>");
                break;
            case 'info_join':
                $chat_box.append("<p><i class='lobby-join'>" + timestamp + ":" + message_body + "</i></p>");
                break;
            case 'info_leave':
                $chat_box.append("<p><i class='red'>" + timestamp + ":" + message_body + "</i></p>");
                break;
        }
    }

    /**
     * Return file name of requested instrument and key
     * @param object
     * @param instrument
     * @param char
     * @returns {string}
     */
    function returnFileName(object, instrument, char) {
        var file_name = "";

        loopthroughAssociativeArray(object, function (val, idx) {
            var key_name = Object.keys(object)[idx];

            if (instrument === key_name) {

                for (var i = 0; i < object[val].length; i++) {
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

        loopthroughAssociativeArray(sounds, function (val, idx) {
            var instr_name = Object.keys(sounds)[idx];
            var instr_name_uppercase = instr_name.charAt(0).toUpperCase() + instr_name.slice(1);
            var instr_name_header = '<h4 class="instr-header" data-instrument="' + instr_name + '">' + instr_name_uppercase + '<span class="user-header"></span></h4>';

            var instrument_wrapper = '<div class="row row-instrument">';

            var start_opacity = 0.40;
            var start_opacity_grad = 0.40;
            var increment_by = 0.10;
            var color_to_use = 'green';
            var color_to_use_grad = 'green';

            for (var i = 0; i < sounds[val].length; i++) {

                var char = sounds[val][i].char;
                var filename = sounds[val][i].filename;

                //colours for gradients
                var green = 'rgba(158,225,96,' + start_opacity + ')';
                var blue = 'rgba(35,127,190,' + start_opacity + ')';
                var orange = 'rgba(210,100,50,' + start_opacity + ')';

                var green_grad = 'rgba(49,119,100,' + start_opacity_grad + ')';
                var blue_grad = 'rgba(21,88,128,' + start_opacity_grad + ')';
                var orange_grad = 'rgba(230,110,60,' + start_opacity_grad + ')';


                switch (instr_name) {
                    case 'guitar':
                        color_to_use = green;
                        color_to_use_grad = green_grad;
                        break;
                    case 'vox':
                        color_to_use = orange;
                        color_to_use_grad = orange_grad;
                        break;
                    case 'drums':
                        color_to_use = blue;
                        color_to_use_grad = blue_grad;

                        break;
                }

                var keydiv = '<div class="col-md-1 col-xs-3 audio-box" ' +
                    'style="background-image: linear-gradient(to bottom right, ' + color_to_use + ', ' + color_to_use_grad + ');"' +
                    'id="div_' + filename + '">' + filename + '<p>[' + char + ']</p></div>';
                instrument_wrapper += (keydiv);

                start_opacity = start_opacity + increment_by;
                start_opacity_grad = start_opacity_grad + increment_by;
            }
            instrument_wrapper += '</div>';

            $instrument_box.append(instr_name_header + instrument_wrapper + '<br>');
        });
    }

    /**
     * Bounce effect for keyboard keys
     * @param element
     * @param times
     * @param distance
     * @param speed
     */
    function doBounce(element, times = 3, distance = '30px', speed = 50) {
        for (var i = 0; i < times; i++) {
            element.animate({marginTop: '-=' + distance}, speed)
                .animate({marginTop: '+=' + distance}, speed);
        }
    }

    /**
     * Hide container which has lobby specific content
     */
    function hideLobbyContainer() {
        var items_to_hide = [$div_lobby_container, $user_navbar,$signed_in,$btn_logout];


        toggleVisibilityLobbyContainer(items_to_hide, true);
    }

    /**
     * Dispaly container which has lobby specific content
     */
    function showLobbyContainer() {

        var items_to_show = [$div_lobby_container, $user_navbar];

        if(local_storage_enable){
            items_to_show.push($signed_in);
            items_to_show.push($btn_logout)
        }

        toggleVisibilityLobbyContainer(items_to_show);
        $user_form_area.hide();
    }

    /**
     * Toggle visibility of specified element items from array
     * @param array
     * @param hide
     */
    function toggleVisibilityLobbyContainer(array, hide) {
        for (let i = 0; i < array.length; i++) {
            if (hide) {
                array[i].hide();
            } else {
                array[i].show();
            }
        }
    }

    /**
     * Set radio buttons automatically
     */
    function setChecked() {
        $('body').find('.radio-inline:not(.hidden):first').find("input:radio[name=optinstrument]").prop("checked", true).addClass('pressed-border');
    }

//******************************************************
// Other functionality
//******************************************************

    //Make sure connection doesn't timeout
    setInterval(function () {
        socket.emit('ping');
    }, 10000);

    //This is not ideal but jquery is bugging when I try to directly set the radio button
    // setting anything else works but not this :(
    setTimeout(function () {
        setChecked()
    }, 120);

    setChecked();


    //Show how many characters have been typed
    $user_name.on("keyup", function () {
        $(this).parent().find('span').html($(this).val().length);
    });

    //Event delegation  on clicking a user name in users section
    $user_navbar.on("click", ".li-users", function () {
        $(this).children('ul').toggleClass("hidden");
    });

    //Event delegation  on clicking whisper from context menu
    $user_navbar.on("click", ".whisper", function () {
        var username = $(this).parent().parent().find('.span-username').html();
        $txt_message.val("/w " + username + " ").trigger("focus").trigger("click");

        //Weird bug this isn't working for some reason
        $(this).parent().addClass("hidden");
    });

    //When instrument icon or panel is clicked
    $(".radio-inline,.instr-image").on("click", function () {
        $(this).closest('.form-control').find(':radio').prop("checked", true);
        $(this).closest('.form-control').addClass('pressed-border');
        $(this).closest('.form-control').siblings().removeClass('pressed-border');
    });

    $instrument_box.on("click", function () {
        $(this).addClass("box-active");
        $txt_message.removeClass("box-active");
    });

    //when the message box is clicked
    $txt_message.on("click", function () {
        $(this).addClass("box-active");
        $instrument_box.removeClass("box-active");
        $(".tip-text").removeClass('hidden').effect("slide");
    });

    $('.instr-box-link').on("click",function(){
        $instrument_box.trigger('click');
    })

    //Sign in automatically if localstorage exists
    if(local_storage_enable) {
        if (username_local) {
            if (username_local.length > 0) {
                $signed_in.find('span').html(' ' + username_local);
                $user_name.val(username_local);
                $("#btn_submit").trigger("click");
            }
        }
    }

    //Delete localStorage when logged out
    if(local_storage_enable) {
        $btn_logout.on("click", function () {
            if (username_local) {
                localStorage.removeItem('username');
            }
            location.reload();
        })
    }
});//end ready

