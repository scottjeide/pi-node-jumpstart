import * as express from 'express';
import { json } from 'body-parser';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as morgan from 'morgan';

// Set up express and some defaults

const app = express();
app.use(helmet());
app.use(json());
app.use(cors());
app.use(morgan('combined'));



// See if we can define the apis in some sort of a basic schema
const schema = {
  // the endpoint for the data we are collecting
  data: {
    // maybe add some type information in here too
    fields: [
      'reading1',
      'reading2'
    ],

    // something to flag it as N items

    // and a temporary hack to hold entries in memory until I wire up the db
    db: [{reading1: 123, reading2:321}, {reading1: 654, reading2:456}]
  },

  // the endpoint for the controlPanel
  controlPanel: {
    fields: [
      'run',
      'status'
    ],

    // maybe something here to flag is as there should only be one item

    // temp 'db'
    db: [{run: false, status:''}]
    
  }


  
}


// Set up a get handler for each of the endpoints
for(const endpoint in schema) {
  app.get('/' + endpoint, (req, res) => {
    res.send(schema[endpoint].db);
  });
  
  /*
  app.put('/' + endpoint, (req, res) => {
  });
  */
}



  
// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});

