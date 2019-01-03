// Tests for structure/html
QUnit.test("#Unit test 1 testing page title", function(assert){
    assert.ok($(document).attr('title').indexOf("Bandpractice")!=-1,"Checking that the page title is Bandpractice");
});

//Check user form area exists
QUnit.test("#Unit test 2 testing user form area", function(assert){
    assert.ok($("#div_user_form_area").length > 0,"Checking that the user form area exists");
});

//Check user form exists
QUnit.test("#Unit test 3 testing user form ", function(assert){
    assert.ok($("#frm_user_form").length > 0,"Checking that the user form exists");
});



//Set username

//Invalid username can't progress 

//Connected to websocket

//Can write chat message

//Can receive chat message




