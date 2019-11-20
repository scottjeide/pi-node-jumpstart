import commandLine = require('commander');
const fetch = require('node-fetch');
 


// set up the command line
// See https://github.com/tj/commander.js#readme for a bunch of examples
commandLine
  .option('-s, --server <address>', 'the server address', 'localhost')
  .option('p, --port <number>', 'the port number', 3001)

commandLine.parse(process.argv);

const serverRootUrl = `http://${commandLine.server}:${commandLine.port}`;
console.log(`Connecting to: ${serverRootUrl}`);


fetch(`${serverRootUrl}/data`)
  .then(res => res.text())
  .then(body => console.log(body));



