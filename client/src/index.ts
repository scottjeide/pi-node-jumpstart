import commandLine = require('commander');
const restClient = require('axios').default;
 


// set up the command line
// See https://github.com/tj/commander.js#readme for a bunch of examples
commandLine
  .option('-s, --server <address>', 'the server address', 'localhost')
  .option('p, --port <number>', 'the port number', 3001)

commandLine.parse(process.argv);

const serverRootUrl = `http://${commandLine.server}:${commandLine.port}`;
console.log(`Connecting to: ${serverRootUrl}`);


const apiClient = restClient.create({
  baseURL: serverRootUrl,
  timeout: 1000
  // can set up headers here as well
});


apiClient.get('/data')
.then(function (response) {
  console.log(response.data);
  console.log(response.status);
  console.log(response.statusText);
  console.log(response.headers);
  console.log(response.config);
});



