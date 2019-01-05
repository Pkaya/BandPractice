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
//var instruments = [];

//**********************************************************************************************************************
// Socket Listen / Emit functionality
//**********************************************************************************************************************

//Initiate Socket connection
io.on('connection', function (socket) {
    //Create random number as no db used

    var id = Math.floor(Math.random() * 9999) + 1001;
    socket.id = id;

    connections[socket.id] = socket;

    //[3] New user - socket.username = data
    socket.on("new_user", function (data, callback) {
        callback(true);

        users[socket.id] = data;

        //If there is an instrument push it to instruments array
        if (data.instrument !== undefined) {
            //instruments.push(data.instrument);
        }

        updateUsernames(id);
    });


    //Listen to send_message and emit new_message
    socket.on("send_message", function (data) {
        //sent message to every socket
        io.sockets.emit('new_message', {timestamp: getTimeStamp(), message: data.message, username: data.username});
    });

    socket.on("send_key", function (data) {
        io.sockets.emit('get_key', {instrument: data.instrument, key: data.key});
    });

    //Delete users
    socket.on("disconnect", function () {
        delete connections[socket.id];
        delete users[socket.id];
    });
    //instruments.splice(instruments.indexOf(socket.instrument),1);
    updateUsernames(id);
    console.log('Disconnected: %s sockets connected', Object.keys(connections).length)
});


function getTimeStamp() {
    return new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds() + '';
}

function updateUsernames(id) {
    io.sockets.emit('get_users', {users: users, my_id:id });
}

function updateInstruments() {
    //io.sockets.emit('get_instruments',instruments);
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


function pre_o(object){
    Object.getOwnPropertyNames(object).forEach(function(val,idx,array){
        console.log(object[idx]);
        console.log(object[val]);
    });
}

//Debug functions
function pre_r(array) {
    var string = "----------------------Array----------------------\n";

    for (i = 0; i < array.length; i++) {
        string += "[" + i + "]" + ": " + JSON.stringify(array[i]) + "\n";
    }
    console.log(string);
}




