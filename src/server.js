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
    console.log('Server live at port: %s', port);
});

//Static files
app.use(express.static(base_directory + '/public'));

//Declare socket.io
var socket = require('socket.io');
var io = socket(server);


var Message = function (lobby_id = false, type, message_body, username) {
    return {
        lobby_id: lobby_id,
        type: type,
        message_body: message_body,
        username: username,
        timestamp: getTimeStamp(),
    }
};

//Keep track of connections, users and instruments
var connections = {};
var users = {};
var available_instruments_1 = ['guitar','vox','drums'];
var available_instruments_2 = ['guitar','vox','drums'];


//**********************************************************************************************************************
// Socket Listen and Emit functionality
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

    //Array to use
    var available_instr_array  =  socket.lobby == 1 ? available_instruments_1 : available_instruments_2;

    emitToLobby(connections, 'get_instruments', socket.lobby, available_instr_array);

    socket.on("request_lobby_info",function(data){
        socket.emit('get_lobby_info',rawObject(users));
    });

    // New user
    socket.on("new_user", function (data, callback) {

        var user = data;
        var connection_message = user.username + " has joined the lobby";
        callback(true);
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
            var index = available_instr_array.indexOf(instrument);
            if (index > -1) {
                available_instr_array.splice(index, 1);
            }
        }



        //Send messages to client
        emitToLobby(connections, 'new_message', lobby_id, new Message(false, 'info_join', connection_message, ''));
        updateUsernames(connections, id, lobby_id);
        emitToLobby(connections, 'get_instruments', lobby_id, available_instr_array);
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

    //Send the pressed key to users
    socket.on("send_key", function (data) {
        var this_lobby_id = socket.lobby;

        emitToLobby(connections, 'get_key', this_lobby_id, data)
    });


    //Delete users
    socket.on("disconnect", function () {
        console.log("disconnect requested");
        var username = chkProperty(users[socket.id], 'username');
        var instrument = chkProperty(users[socket.id], 'instrument');
        var connection_message = username + " has left the lobby";
        var lobby_id = socket.lobby;

        //Array to use
        var available_instr_array  = lobby_id == 1 ? available_instruments_1 : available_instruments_2;

        delete users[socket.id];

        updateUsernames(connections, id, lobby_id);

        //send user connected message
        if(username.length > 0) {
            emitToLobby(connections, 'new_message', lobby_id, new Message(false, 'info_leave', connection_message, ''));
        }

        //Make instrument available
        if (instrument) {
            var index = available_instr_array.indexOf(instrument);
            if (index === -1) {
                available_instr_array.push(instrument);
            }
        }

        emitToLobby(connections, 'get_instruments', lobby_id, available_instr_array);
        delete connections[socket.id];

    });


    console.log('Disconnected: %s sockets connected', Object.keys(connections).length)
});


//**********************************************************************************************************************
// Socket functions and helper methods
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

//User body parser
app.use(bodyParser.urlencoded({extended: true}));

//Set view engine for templating
app.set('view engine', 'ejs');

//Display what's been requested - debug
app.use(function (req, res, next) {
    console.log(`${req.method} request for '${req.url}'`);
    next();
});


//Default page
app.get('/', function (req, res) {
    //Include index file  (public files are distributed by express)
    res.sendFile(base_directory + '/public/lobbies.html');
});

//Use template for lobby to dynamically display
app.get('/lobby/:id', function (req, res) {
    res.render(base_directory + '/views/lobby.ejs', {lobbyId: req.params.id});
});

//API - Check username
app.use('/checkusername',function(req,res){
    var username = req.body.username;
    res.send(checkUserNameValid(username));
});

//**********************************************************************************************************************
// Other functionality
//**********************************************************************************************************************

/**
 * Check if user name is valid
 * @param username
 * @returns {{error_msg: string, valid: boolean, users}}
 */
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
 * Check if user name already exists
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
 * Returns object without first keys
 * @param object
 * @returns {*[]}
 */
function rawObject(object){
   return Object.keys(object).map(function (key) {
        return object[key];
    });
}




