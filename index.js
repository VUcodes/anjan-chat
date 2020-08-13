var path    = require('path');
var express = require('express');
var app = express();
var server  = require('http').createServer(app);
var io      = require('socket.io').listen(server);

var htmlPath = path.join(__dirname, 'html');


app.use(express.static(htmlPath));
// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
//     res.sendFile(__dirname + '/assets/loader.gif');    
// });

var users = [];

function removeTags(str) {
    if ((str===null) || (str===''))
    return false;
    else
    str = str.toString();
    return str.replace( /(<([^>]+)>)/ig, '');
 }

function setUser(id,friend,room,role){
    const user={id,friend,room,role};
    users.push(user);
    if(users.length % 2 == 0){  
        var currentLength = users.length;
        users[currentLength-1].friend=users[currentLength-2].id;
        users[currentLength-2].friend=users[currentLength-1].id;
        users[currentLength-1].role=2;
        users[currentLength-1].room=users[currentLength-2].id; 
        users[currentLength-2].room=users[currentLength-1].id; 
    }else{
        users[users.length-1].role=1;
    }


    // users[users.length-1].room= "room"+Math.floor(Math.ceil(users.length/2));
    
    // console.log(users);
    // console.log(users[0]);
}

io.on('connection', (socket) => {

    socket.on('join',()=>{
        setUser(socket.id,'','');
        const found = users.find(element => element.id == socket.id);        
        socket.join(found.room);
        if(found.role==2){
            socket.emit('joinMessage',"stranger Joined");
            socket.to(found.room).emit('joinMessage',"stranger Joined");
        }
        // console.log("j ");
        // console.log(users);
    });

    socket.on('chat message', (msg) => {
        msg=removeTags(msg);
        const found = users.find(element => element.id == socket.id);     
        socket.to(found.room).emit('chat message',msg);
    });
    
    socket.on('disconnect', () => {
        const found = users.find(element => element.id == socket.id);
        if(found){            
            
            socket.to(found.room).emit('disconnectMessage',"stranger disconnected");

            if(found.friend){
                // console.log("f i ");
                // console.log(users.indexOf(found.id));
                // console.log("f f ");
                // console.log(users.indexOf(found.friend));
                users.splice(users.indexOf(found.friend),1);
                users.splice(users.indexOf(found.id),1);
            }else{
                // console.log("I i ");
                // console.log(users.indexOf(found.id));
                users.splice(users.indexOf(found.id),1);
            }
            // console.log("d "+users);
        }        
    });
});

io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets

server.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});