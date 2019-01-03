const express = require('express'),
    app = express(),
    bodyParser = require('body-parser');

const local = true;
const dir = __dirname;
const directory_separator = local ? '\\' : '/';
const base_directory = dir.substr(0, dir.lastIndexOf(directory_separator));



var ws_port = 4006;
var port = 4000;
var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({port: ws_port});

//Server
var server = app.listen(port, function () {
    console.log(' server live at http://localhost:%s/', port);
});

//Static files
app.use(express.static(base_directory + '/public'));


var socket = require('socket.io');
var io = socket(server);
//list of socket connections
var SOCKET_LIST = {};
var connections = [];
var users = [];

io.on('connection',function(socket){
    connections.push(socket);
    // console.log('Connected: %s sockets connected',connections.length );
    // socket.id = Math.floor(Math.random() * Math.floor(9999) + 1001);
    // SOCKET_LIST[socket.id] = {"socket": socket};
    //
    //
    // var user_ids = Object.keys(SOCKET_LIST);
    // var num_users = Object.keys(SOCKET_LIST).length+1;



    socket.on('send_message',function(data){
        //sent message to every socket
        io.sockets.emit('new_message', {timestamp:getTimeStamp(),message:data.message,username:data.username});
    });

    //updateUserList("connect");

    //Delete users
    socket.on('disconnect',function(){
        users.splice(users.indexOf(socket.username),1);
        updateUsernames();
        connections.splice(connections.indexOf(socket),1);
        console.log('Disconnected: %s sockets connected', connections.length )
    });


    //New user - socket username = data
    socket.on("new_user",function(data,callback){
        callback(true);
        socket.username = data;
        users.push(socket.username);
        console.log(users);
        updateUsernames();
    });

    //console.log(SOCKET_LIST[socket.id].username);


    function getTimeStamp(){
        return new Date().getHours()+':'+ new Date().getMinutes()+ ':'+ new Date().getSeconds()+'';
    }

    function updateUsernames(){
        io.sockets.emit('get_users',users);
    }
});



//Set view engine for templating
app.set('view engine', 'ejs');

//displaying what's been requested - debug
app.use(function (req, res, next) {

    console.log(`${req.method} request for '${req.url}'`);
    next();
});


app.use(bodyParser.urlencoded({extended: true}));


app.get('/lobby/:id',function(req,res){
    res.render(base_directory+'/views/lobby.ejs',{lobbyId: req.body.id});
});




