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


//Keep track of connections and users
var connections = {};
var users = {};
var instruments = [];

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
        timestamp:getTimeStamp(),
    }
};

var User = function (id, lobby_id, username, instrument, type) {
    return  {
        id : id,
        lobby_id: lobby_id,
        username: username,
        instrument: instrument,
        type: type
    }
};

var Key = function(lobby_id, instrument,char){
    return{
        lobby_id : lobby_id,
        instrument : instrument,
        char: char,
    }
}

// var User = function (id, lobby_id, username, instrument, type) {
//
//     var self = {
//         self.username = username;
//     self.instrument = instrument;
//     self.type = type;
// }
//     return self;
// };




//**********************************************************************************************************************
// Socket Listen / Emit functionality
//**********************************************************************************************************************

//Initiate Socket connection
io.on('connection', function (socket) {
    //Create random number as no db used

    var id = Math.floor(Math.random() * 9999) + 1001;
    socket.id = id;

    connections[socket.id] = socket;

    // New user
    socket.on("new_user", function (data, callback) {
        callback(true);
        var user = {};

        var user_type = returnUserType(connections,data);
        user.id = socket['id'];
        Object.assign(user, data);


        users[socket.id] = user;


        socket.lobby = chkProperty(data,'lobby_id');

        //If there is an instrument push it to instruments array
        if (chkProperty(data,instruments)) {
            instruments.push(data.instrument);
        }

        updateUsernames(connections, id,socket.lobby);
        updateInstruments(chkProperty(data,'lobby_id'));
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
        emitToLobby(connections,'new_message',this_lobby_id,message)
    });

    socket.on("send_key", function (data) {
        console.log(data);
        var this_lobby_id = socket.lobby;
        var key = {};
        Object.assign(key, data);

        emitToLobby(connections,'get_key',this_lobby_id,key)
        //io.sockets.emit('get_key', {instrument: data.instrument, char: data.char});
    });

    //Delete users
    socket.on("disconnect", function () {
        updateUsernames(connections, id,socket.lobby);
        console.log(socket.lobby);
        updateInstruments();
        delete connections[socket.id];
        delete users[socket.id];
    });



    //instruments.splice(instruments.indexOf(socket.instrument),1);

    console.log('Disconnected: %s sockets connected', Object.keys(connections).length)
});


//**********************************************************************************************************************
// Socket Functions
//**********************************************************************************************************************

function emitToLobby(conn_array,event_name,lobby_id,obj_to_emit){
    for (var i in conn_array){
        let connection = conn_array[i];


        if(connection.lobby === lobby_id){

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
function updateUsernames(connections,id,lobby_id) {
   var same_lobby_users = {};

   console.log(users);

    for (var i in users){
        let user = users[i];
        if (chkProperty(user,'lobby_id') === lobby_id){
            same_lobby_users[i] = user;
        }
    }
    emitToLobby(connections,'get_users',lobby_id, {users: same_lobby_users, my_id:id });
}

function updateInstruments() {
    io.sockets.emit('get_instruments',instruments);
}

function sendConnectionInfoMsg(){
    io.sockets.emit('get_connection_info',instruments);
}

/**
 * returns property of object if it exists
 * @param object
 * @param prop
 * @returns {*}
 */
function chkProperty(object,prop){
    if (object.hasOwnProperty(prop)){
       return (object[prop]);
    }
    return undefined;
}

/**
 * Returns user type
 * @param connections
 * @param data
 * @returns {string}
 */
function returnUserType(connections, data){
    var user_type = '';

    if (Object.keys(connections).length === 1){
        user_type = "leader";
    }
    else if (Object.keys(connections).length > 1){
        user_type = "regular";
    }
    else if (chkProperty(data,'spectator')){
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


// function pre_o(object){
//     Object.getOwnPropertyNames(object).forEach(function(val,idx,array){
//         console.log(object[idx]);
//         console.log(object[val]);
//     });
// }





