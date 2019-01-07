class UserModel {
    constructor(){
        this.count = 0;
        this.users = [];
        //all observers will be notified
        this.observers = [];
    }

    newUserArray(users){
        this.users = users;
        this.notifyObservers();
    }

    addObserver(o){
        this.observers.push(o);
    }

    notifyObservers(){
        for (let o of  this.observers){
            o.update(this);
        }
    }
}


class userListObserver{
    constructor(elementId){
        this.element = document.getElementById(elementId);
    }

    update(model){
        var users = model.users;

        var html = '';
        users.forEach(function(user){
            html += '<li data-id="'+user.id+'" >' + user.username + '</li>';
        });
        this.element.innerHTML= html;
    }
}



