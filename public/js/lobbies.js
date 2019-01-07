$(document).ready(function () {

//**********************************************************************************************************************
// Initiation Code
//**********************************************************************************************************************
    var local = true;
    var local_address = 'http://localhost:4000';
    var server_address = 'http://52.33.25.101';
    var address_to_use = local ? local_address : server_address;

    //Emit Socket events
    var socket = io.connect(address_to_use);


//**********************************************************************************************************************
// Socket Listen / Emit functionality
//**********************************************************************************************************************

    socket.emit('request_lobby_info', {});


    // setInterval(function(){
    //     socket.emit('request_lobby_info', {});
    // },2000);

    // socket.on("get_lobby_info",function(data){
    //     console.log(data);
    // })


    var test_obj = {
        1584: {lobby_id: "1", username: "Pina", instrument: "guitar", id: 1584},
        2320: {lobby_id: "1", username: "John", instrument: "vox", id: 2320}
    };

    var test_arr2 = [
        {lobby_id: "1", username: "Pina", instrument: "guitar", id: 1584},
        {lobby_id: "1", username: "John", instrument: "vox", id: 2320}
    ];

    var remove_keys = Object.keys(test_obj).map(function (key, idx) {
        return test_obj[key];
    });

    console.log(remove_keys);

});//end ready

