import commandLine = require('commander');
const fetch = require('node-fetch');
import io = require('socket.io-client');



// set up the command line parser
// See https://github.com/tj/commander.js#readme for a bunch of examples
commandLine
  .option('-s, --server <address>', 'the server address', 'localhost')
  .option('p, --port <number>', 'the port number', 3001)

commandLine.parse(process.argv);

const serverRootUrl = `http://${commandLine.server}:${commandLine.port}`;
console.log(`Connecting to: ${serverRootUrl}`);


// see if we can hit the rest API
fetch(`${serverRootUrl}/data`)
  .then(res => res.text())
  .then(body => console.log(body));


// and listen for something from the server on our socket
const socket = io(serverRootUrl);
socket.on('connect', function() {
  console.log('socket is connected');

});

// send a message every few seconds to the server
let heartbeatCount = 0;
setInterval(() => {
  console.log('sending message to server');
  socket.emit('clientMessage', {client: true, count: heartbeatCount++, time: new Date()});
}, 3000);

socket.on('heartbeat', function(data) {
  console.log('received heartbeat: ' + JSON.stringify(data));
});

socket.on('clientMessage', function(data) {
  console.log('received clientMessage: ' + JSON.stringify(data));
});

socket.on('disconnect', function() {
  console.log('disconnected');
});

