$(document).ready(function () {

//**********************************************************************************************************************
// Initiation Code
//**********************************************************************************************************************
    var local = false;
    var local_address = 'http://localhost:4000';
    var server_address = 'http://3.8.140.68';
    var address_to_use = local ? local_address : server_address;

    //Emit Socket events
    var socket = io.connect(address_to_use);


//**********************************************************************************************************************
// Socket Listen / Emit functionality
//**********************************************************************************************************************

    socket.emit('request_lobby_info', {});

    socket.on("get_lobby_info", function (data) {
        console.log(data);

        var lobby1 = [];
        var lobby2 = [];

        for (let i = 0; i < data.length; i++) {
            var row = data[i];

            if (row.lobby_id == 1) {
                lobby1.push(row);
            } else {
                lobby2.push(row);
            }
        }

        var instruments_lobby1 = Object.keys(lobby1).map(function (k) {
            return lobby1[k].instrument;
        });

        var instruments_lobby2 =  Object.keys(lobby2).map(function(k){
            return lobby2[k].instrument;
        });

        var no_users_lobby1 = Object.keys(instruments_lobby1).length;
        var no_users_lobby2 = Object.keys(instruments_lobby2).length;

        $("#lobby1_usercount").html("Users ("+no_users_lobby1+"/3)");
        $("#lobby2_usercount").html("Users ("+no_users_lobby2+"/3)");

        var instr_lobby1_html = '';
        var instr_lobby2_html = '';

        for (let i = 0; i< instruments_lobby1.length;i++){
            instr_lobby1_html+= "<li>"+instruments_lobby1[i]+"</li>";
        }

        for (let i = 0; i< instruments_lobby2.length;i++){
            instr_lobby2_html+= "<li>"+instruments_lobby2[i]+"</li>";
        }

        $("#ul_lobby1_instruments").html(instr_lobby1_html);
        $("#ul_lobby2_instruments").html(instr_lobby2_html);
    });

    setInterval(function(){
        socket.emit('request_lobby_info', {});
    },2000);

});//end ready


