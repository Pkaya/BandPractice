const express = require('express'),
    app = express(),
    bodyParser = require('body-parser');

const local = true;
var ws_port = 4006;
var port = 4000;

/**********************************************************************************************************************/
var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({port: ws_port});

wss.on("connection", function (ws) {

    ws.on("message", function (message) {

        if (message === 'exit') {
            ws.close();
        } else {

            wss.clients.forEach(function (client) {
                client.send(message);
            });
        }
    });
    ws.send("Welcome to Bandpractice chat");
});

/**********************************************************************************************************************/

app.set('view engine', 'ejs');

//displaying what's been requested - debug
app.use(function (req, res, next) {

    console.log(`${req.method} request for '${req.url}'`);
    next();
});


const dir = __dirname;
const directory_separator = local ? '\\' : '/';
const base_directory = dir.substr(0, dir.lastIndexOf(directory_separator));
//define a static folder for files to be distributed
app.use(express.static(base_directory + '/public'));

app.use(bodyParser.urlencoded({extended: true}));


//Distribute homepage
app.get('/', function (req, res) {
    //Include index file  (public files are distributed by express)
    const index_location = base_directory + '/public/index.html';

    res.sendFile(index_location);
});


app.get('/lobbies', function (req, res) {
    //Include index file  (public files are distributed by express)
    var lobby_list_location = base_directory + '/public/lobbies.html';
    res.sendFile(lobby_list_location);
});

app.get('/lobby',function(req,res){
    var lobby_id = req.query.lobbyId;
    res.render(base_directory+'/views/lobby.ejs',{lobbyName: lobby_id});
})



app.use('/checkusername', function (req, res) {
    //if validates then send true
    var username = req.query.username;

    if (username != undefined) {
        if (username.length > 0) {
            res.send("success");
        }
        else{
            res.send("fail");
        }
    }
});


//Server
app.listen(port, function () {
    console.log(' server live at http://localhost:%s/', port);
});
