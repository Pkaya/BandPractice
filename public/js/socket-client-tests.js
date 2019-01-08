//**********************************************************************************************************************
// Tests for structure/html
//**********************************************************************************************************************
QUnit.test("Testing page title", function(assert){
    assert.ok($(document).attr('title').indexOf("Bandpractice")!=-1,"Checking that the page title is Bandpractice");
});

//Check user form area exists
QUnit.test("Testing user form area", function(assert){
    assert.ok($("#div_user_form_area").length > 0,"Checking that the user form area exists");
});

//Check user form exists
QUnit.test("Testing user form exists", function(assert){
    assert.ok($("#frm_user_form").length > 0,"Checking that the user form exists");
});

//**********************************************************************************************************************
// Tests for behavior/JavaScript
//**********************************************************************************************************************

//Test that clicking on drums image selects correct radio button
QUnit.test("Testing the behavior of image click  ", function(assert){
    //store value of currently checked item;
    var selected_radio = $('input[type=radio]:checked');
    var selected_val =  selected_radio.prop("checked");

    var $drums_img = $("#img_drums");
    var drum_radio= $drums_img.closest('.form-control').find(':radio');

    //triger click of img
    $drums_img.trigger("click");
    //
    assert.equal(drum_radio.prop("checked"),true,"Checking that clicking the instrument image selects the correct radio button");
    //Reset
    selected_radio.prop("checked",selected_val);
});

//Test that clicking on the message textbox
QUnit.test("Testing the behavior clicking chat message box", function(assert){
    var $message_box = $("#txt_message");
    //Store element which current has box-active class
    var $active_elem = $('body').find('.box-active');

    //triger click of message box
    $message_box.trigger("click");
    //
    assert.equal($message_box.hasClass('box-active'),true,"Checking that clicking the message box adds class of box-active");

    $active_elem.addClass('box-acitve');
    $message_box.removeClass('box-acitve');
});
