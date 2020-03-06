
// This file is shared across the clients and server for the data & api schema definition.

// The server uses it to know what rest apis to expose, what socket.io messages to send, and
// what tables to use for persistence.

// The clients use it to know what types of data it can read/write from the server, and what
// the corresponding api endpoints and socket.io messages will be named. 

// If you want to add more settings, controls, or data points to be logged, just add them here
// and then make the corresponding client code changes to use them. Everything else should 
// dynamically update.

/*
Some thoughts on this approach:
Not sure I like it yet. Trying to keep a somewhat single spot to go to when I want to change
things like configuration options and measurements. Lumping them all together as a single common
thing with different meta information when they don't all behave the same way might be confusing.
Maybe if just make them 3 separate classes with obvious things to change if you want to add more measurements
or configuration options might be more clear?

If I want to customize it to be able to do different data measurements (not all on the same post/timer) you'd 
need to create a new dataMeasurement object with it's own endpoints/etc, but that isn't super obvious.
Maybe a base measurement class and make it obvious that you can add/remove more properties to a measurement.
And /measurement/measurementNameN as the endpoints/tables.

It would be nice if it just generated the table names and message names off of the class name. Simpler and less likely
to screw it up if I'm hacking around and adding things later.

Haven't really thought much about how to integrate these with the client side code yet. Don't want the get/puts to be
part of the same schema definition class. Maybe need a different class that wraps the schema definitions and adds the 
appropriate methods. Or just expose the endpoint names from them and use that to build up the URLs on the client side.

The create/getMeta is kind of weird when they aren't really classes. Maybe they should be

Exposing things like table names to the client isn't ideal, but I'm OK with that in this use case
if it keeps things simpler.

If we declare things like this, we could have the UI code automatically put in the given control
types (bool = toggle, range = slider, number = text box, etc)

When re-using this, the only thing I can think I might want to add another table/endpoint for are other measurements.
Messages and settings would probably only have one of them. The only slight caveat is that when I'm making a new 'run' 
I'd likely want to separate out messages and config from previous ones. Later on down the road I might end up wanting
to save/load configurations, but that wouldn't likely be different config classes and supporting older ones. Although could
technically data drive things by pulling out the schema stuff into something that's just persisted in the DB.

*/


const schema = {

  // the data the clients are measuring and logging to the server
  dataMeasurement: {
    // creates a new empty data object. This example is measuring smokerTemp and meatTemp
    create: () => ({
      smokerTemp: 0,
      meatTemp: 0,
    }),

    // returns the metadata used to know how the data measurements are exposed
    getMeta: () => ({
      // defines how it is stored in the db
      db: {
        multi: true, // contains arbitrary number of rows
        table: 'dataMeasurements', // stored in a table named dataMeasurements
      },

      // declares what should be exposed over rest
      rest : {
        url: '/dataMeasurements',
        put: true,
        get: true,
      },

      // declares what messages will be posted by the server when new items of this type are written
      socket: {
        // when something of this type is written to the server, it will be also be broadcast out as this socket message
        onWrite: 'io:dataMeasurements'
      },
    })
  },


  // the endpoint for client runtime messages. Messages that clients post to this will be added to the runtime
  // messages table and can be viewed in the UI
  runtimeMessage: {
    // creates a new empty runtimeMessage object
    create: () => ({
      text: '',
    }),

    // returns the metadata used to know how the data measurements are exposed
    getMeta: () => ({
      // defines how it is stored in the db
      db: {
        multi: true, // contains arbitrary number of rows
        table: 'runtimeMessage', // stored in a table named runtimeMessages
      },

      // declares what should be exposed over rest
      rest : {
        url: '/runtimeMessage',
        put: true,
        get: true,
      },

      // declares what messages will be posted by the server when new items of this type are written
      socket: {
        // when something of this type is written to the server, it will be also be broadcast out as this socket message
        onWrite: 'io:runtimeMessage'
      },
    }),
  },


  // the endpoint for the controlPanel / settings
  controlPanel: {
    // creates a new empty runtimeMessage object
    create: () => ({
      run: false,
      minTemp: 0,
      maxTemp: 100,
    }),

    // returns the metadata used to know how the controlPanel is exposed
    getMeta: () => ({
      // defines how it is stored in the db
      db: {
        multi: false, // contains just a single row
        table: 'controlPanel', // stored in a table named runtimeMessages
      },

      // declares what should be exposed over rest
      rest : {
        url: '/controlPanel',
        put: true,
        get: true,
      },

      // declares what messages will be posted by the server when new items of this type are written
      socket: {
        // when something of this type is written to the server, it will be also be broadcast out as this socket message
        onWrite: 'io:controlPanel'
      },
    }),
  },

};
