const defineSupportCode = require('cucumber').defineSupportCode;
const assert = require('assert');

defineSupportCode(function({ Given, Then, When }) {
    var username = "";
    var valid = "false";

    Given('The username {stringInDoubleQuotes}', function (username) {
        username = username;
    });
    When('I validate', function () {
        if(username.length > 3 ){
            valid = true;
        }
    });
    Then('I end up with {stringInDoubleQuotes}', function (input) {
        assert.equal(valid, input);
    });
});