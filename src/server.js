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
var instruments = [];

io.on('connection',function(socket){
    connections.push(socket);
    updateInstruments();

    // var user_ids = Object.keys(SOCKET_LIST);
    // var num_users = Object.keys(SOCKET_LIST).length+1;

    //New user - socket.username = data
    socket.on("new_user",function(data,callback){
        callback(true);
        users.push(data);
        pre_r(users);

        if(data.instrument!== undefined){
            instruments.push(data.instrument);
        }

        updateUsernames();
    });


    //Listen to send_message and emit new_message
    socket.on('send_message',function(data){
        //sent message to every socket
        io.sockets.emit('new_message', {timestamp:getTimeStamp(),message:data.message,username:data.username});
    });

    //Delete users
    socket.on('disconnect',function(){
        connections.splice(connections.indexOf(socket),1);
        users.splice(users.indexOf(socket.username),1);
        instruments.splice(users.indexOf(socket.instrument),1);
        updateUsernames();
        console.log('Disconnected: %s sockets connected', connections.length )
    });


    function getTimeStamp(){
        return new Date().getHours()+':'+ new Date().getMinutes()+ ':'+ new Date().getSeconds()+'';
    }

    function updateUsernames(){
        io.sockets.emit('get_users',users);
    }

    function updateInstruments(){
        io.sockets.emit('get_instruments',instruments);
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


//Default page
app.get('/', function (req, res) {
    //Include index file  (public files are distributed by express)
    res.sendFile(base_directory + '/public/lobbies.html');
});

//Use template for lobby to dynamically display
app.get('/lobby/:id',function(req,res){
    res.render(base_directory+'/views/lobby.ejs',{lobbyId: req.params.id});
});



//Debug functions
function pre_r(array){
    var string = "----------------------Array----------------------\n";

   for (i= 0;i <array.length; i++){
       string+= "["+i+"]"+": "+JSON.stringify(array[i])+"\n";
   }
   console.log(string);
}
