

import commandLine = require('commander');

// set up the command line
commandLine
  .option('-s, --server <address>', 'the server address', 'localhost')
  .option('p, --port <number>', 'the port number', 3001)

commandLine.parse(process.argv);

console.log(`Connecting to: ${commandLine.server}:${commandLine.port}`);


console.log('hi');
