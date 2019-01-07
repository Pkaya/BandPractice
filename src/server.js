//**********************************************************************************************************************
// Initiation Code
//**********************************************************************************************************************

const express = require('express'),
    app = express(),
    bodyParser = require('body-parser');

const local = true;
const dir = __dirname;
const directory_separator = local ? '\\' : '/';
const base_directory = dir.substr(0, dir.lastIndexOf(directory_separator));

//if local deploy on 4000 else 80
var port = local ? 4000 : 80;


//Server
var server = app.listen(port, function () {
    console.log(' server live at port: %s', port);
});

//Static files
app.use(express.static(base_directory + '/public'));


var socket = require('socket.io');
var io = socket(server);




//
// factory = {
//     create: function (entity,lobby_id) {
//         var e;
//
//         switch (entity) {
//             case 'user':
//                 e = {
//                     lobby_id: lobby_id,
//                 };
//                 break;
//
//             case 'key':
//                 e =  {
//                     lobby_id: lobby_id,
//             };
//             break;
//             case 'message':
//                 e = {
//                     lobby_id: lobby_id,
//                     timestamp:getTimeStamp(),
//                 }
//         }
//         return e;
//     }
// };


var Message = function (lobby_id = false, type, message_body, username) {
    return {
        lobby_id: lobby_id,
        type: type,
        message_body: message_body,
        username: username,
        timestamp: getTimeStamp(),
    }
};

var User = function (id, lobby_id, username, instrument, type) {
    return {
        id: id,
        lobby_id: lobby_id,
        username: username,
        instrument: instrument,
        type: type
    }
};

var Key = function (lobby_id, instrument, char) {
    return {
        lobby_id: lobby_id,
        instrument: instrument,
        char: char,
    }
};

//Keep track of connections and users
var connections = {};
var users = {};
var available_instruments = ['guitar','vox','drums'];

//**********************************************************************************************************************
// Socket Listen / Emit functionality
//**********************************************************************************************************************

//Initiate Socket connection
io.on('connection', function (socket) {
    socket.lobby = socket.handshake.query['lobby_id'];

    //Create random number as no db used
    var id = Math.floor(Math.random() * 9999) + 1001;
    //Give this socket the new id
    socket.id = id;
    //Add to connections array
    connections[socket.id] = socket;


    emitToLobby(connections, 'get_instruments', socket.lobby, available_instruments);


    socket.on("request_lobby_info",function(data){
        socket.emit('get_lobby_info',rawObject(users))
    });

    // New user
    socket.on("new_user", function (data, callback) {
        callback(true);
        var user = data;
        var connection_message = user.username + " has joined the lobby";
        var user_type = returnUserType(users, user);
        user.type = user_type;

        console.log("user type:" + user_type);

        //Give user the dynamically created id
        user.id = socket['id'];

        //Add to users array
        users[socket.id] = user;


        //Get users instrument
        var instrument = chkProperty(user, 'instrument');
        var lobby_id = socket.lobby;



        //Remove this users instrument from the instruments array
        if (instrument) {
            var index = available_instruments.indexOf(instrument);
            if (index > -1) {
                available_instruments.splice(index, 1);
            }
        }

        //Send messages to client
        emitToLobby(connections, 'new_message', lobby_id, new Message(false, 'info_join', connection_message, ''));
        updateUsernames(connections, id, lobby_id);
        emitToLobby(connections, 'get_instruments', lobby_id, available_instruments);
    });


    //Listen to send_message and emit new_message
    socket.on("send_message", function (data) {
        var this_lobby_id = users[socket.id].lobby_id;
        var message = {};

        //assign data to message object
        Object.assign(message, data);
        message.timestamp = getTimeStamp();
        message.username = users[socket.id].username;

        //emit to users in this lobby
        emitToLobby(connections, 'new_message', this_lobby_id, message)
    });


    socket.on("send_key", function (data) {
        console.log(data);
        var this_lobby_id = socket.lobby;
        var key = {};
        Object.assign(key, data);

        emitToLobby(connections, 'get_key', this_lobby_id, key)
    });

    socket.on("request_instruments",function(data){
        console.log(data);
        emitToLobby(connections, 'get_instruments', chkProperty(data,'lobby_id'), available_instruments);
    });


    //Delete users
    socket.on("disconnect", function () {
        var username = chkProperty(users[socket.id], 'username');
        var instrument = chkProperty(users[socket.id], 'instrument');
        var connection_message = username + " has left the lobby";
        var lobby = socket.lobby;

        delete users[socket.id];

        updateUsernames(connections, id, lobby);

        //send user connected message
        if(username.length > 0) {
            emitToLobby(connections, 'new_message', lobby, new Message(false, 'info_leave', connection_message, ''));
        }

        //Make instrument available
        if (instrument) {
            var index = available_instruments.indexOf(instrument);
            if (index === -1) {
                available_instruments.push(instrument);
            }
        }

        emitToLobby(connections, 'get_instruments', lobby, available_instruments);
        delete connections[socket.id];

    });

    console.log('Disconnected: %s sockets connected', Object.keys(connections).length)
});


//**********************************************************************************************************************
// Socket Functions
//**********************************************************************************************************************

function emitToLobby(conn_array, event_name, lobby_id, obj_to_emit) {
    for (var i in conn_array) {
        let connection = conn_array[i];

        if (connection.lobby === lobby_id) {
            connection.emit(event_name, obj_to_emit);
        }
    }
}

/**
 * Take in connections array, id and lobby id of passed through user and update users in same lobby
 * @param connections
 * @param id
 * @param lobby_id
 */
function updateUsernames(connections, id, lobby_id) {
    var same_lobby_users = [];

    for (var i in users) {
        let user = users[i];
        if (chkProperty(user, 'lobby_id') === lobby_id) {
            same_lobby_users.push(user);
        }
    }

    emitToLobby(connections, 'get_users', lobby_id, {
        users: same_lobby_users,
        my_id: id,
    });
}


/**
 * returns property of object if it exists
 * @param object
 * @param prop
 * @returns {*}
 */
function chkProperty(object, prop) {
    if (object !== undefined) {
        if (object.hasOwnProperty(prop)) {
            return (object[prop]);
        }
    }
    return '';
}

/**
 *
 * @param users
 * @param data
 * @returns {string}
 */
function returnUserType(users, data) {
    var user_type = '';

    if (Object.keys(users).length === 0) {
        user_type = "leader";
    } else if (Object.keys(users).length >= 1) {
        user_type = "regular";
    } else if (chkProperty(data, 'spectator')) {
        user_type = "spectator";
    }
    return user_type;
}

/**
 * Return current time in H:m:i
 * @returns {string}
 */
function getTimeStamp() {
    return new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds() + '';
}


//**********************************************************************************************************************
// Serving and Routing functionality
//**********************************************************************************************************************

//Set view engine for templating
app.set('view engine', 'ejs');

//displaying what's been requested - debug
app.use(function (req, res, next) {

    console.log(`${req.method} request for '${req.url}'`);
    next();
});

app.use(bodyParser.urlencoded({extended: true}));

//Default page
app.get('/', function (req, res) {
    //Include index file  (public files are distributed by express)
    res.sendFile(base_directory + '/public/lobbies.html');
});

//Use template for lobby to dynamically display
app.get('/lobby/:id', function (req, res) {
    res.render(base_directory + '/views/lobby.ejs', {lobbyId: req.params.id});
});

app.use('/checkusername',function(req,res){
    var username = req.body.username;
    res.send(checkUserNameValid(username));
});


function checkUserNameValid(username){
    var valid = false;
    var msg = '';

    if(username.length <4){
        msg = "The username is too short (must be longer than 8 characters)";
        valid = false;
    }
    else if (username.length > 13){
        msg = "The username is too long (max 13 characters)";
        valid = false;
    }
    else if (userNameTaken(username) === true){
        valid = false;
        msg = "This username is already taken";
    }
    else{
        valid = true;
    }

    return {error_msg:msg, valid: valid,users: users}
}

/**
 * Check if Username already exists
 * @param username
 * @returns {boolean}
 */
function userNameTaken(username){
    var remove_keys = Object.keys(users).map(function (key) {
        return users[key];
    });

    var usernamesArray = Object.keys(remove_keys).map(function(k){
        return remove_keys[k].username;
    });

    //Return an array of usernames
   return Boolean (Object.values(usernamesArray).indexOf(username) > -1);
}

/**
 * Returns object without keys
 * @param object
 * @returns {*[]}
 */
function rawObject(object){
   return Object.keys(object).map(function (key) {
        return object[key];
    });
}




