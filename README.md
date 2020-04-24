# pi-node-jumpstart
pi-node-jumpstart is a simple node js client/server app for monitoring and controlling raspberry pi projects in realtime.

It seems like every time I have an idea for a fun pi controller project, I spent more time messing with the app code than actually doing something useful on the pi. The goal of this project is to have a base working UI, server, client, and DB that I can just quickly fork and get to work.

This project supports realtime monitoring, measurement charting, control, and DB persistance for saving any collected data.

The sample provided fetches a given URL and logs the response time, battery level, and wifi signal strength at the given interval.


# Components
## Server
The server is a node & express based web server that exposes a handful of rest APIs for loading/saving data. Any changes made through the API are broadcast over web sockets so connected clients and browsers can react to changes and measurements as they happen. Data is persisted to Redis.

## Client
The client is the node app that does the actual monitoring and controlling on the PI. Multiple clients can be connected to the same server if you have more than one PI collecting data.

## UI
The UI uses vuejs and chartjs to control and monitor the system.

![Controller UI](/docs/images/controller.png)

![Chart UI](/docs/images/chart.png)

# Developer Guide
To add support for any new controls or measurements:
* update the _measurement_ or _settings_ interfaces in _shared/dataDefinitions.ts. This will make the new measurements and settings available to all the projects.
* Update the function _handleSettings_ in _client/src/index.ts_ to handle any new settings and start collecting any new measurements.
* Update the UI to show/edit any additional settings in the < form > at the top of _ui/src/app.vue_
* Update the UI to graph any new measurements by adding them to the _chartData_ const
* Install typescript
  ```bash
  npm install -g typescript
  ```
* Rebuild the three projects
  ```bash
  pushd server && tsc && popd
  pushd client && tsc && popd
  pushd ui && npm run build && popd
  ```
* Start redis if not already running
  ```bash
  redis-server
  ```
* Start the server
  ```bash
  cd server
  node build/server/src/index.js
  ```
* Start the client
  ```bash
  # to start the client
  cd client
  node build/client/src/index.js
  ```
