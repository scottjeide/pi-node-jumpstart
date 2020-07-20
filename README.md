# pi-node-jumpstart
pi-node-jumpstart is a simple node js client/server app for monitoring and controlling raspberry pi projects in realtime.

It seems like every time I have an idea for a fun pi controller project, I spend more time messing with the app code than actually doing something useful on the pi. The goal of this project is to have a base working UI, server, client, and DB that I can just quickly fork and get to work.

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

# Using
* Install typescript
  ```bash
  sudo npm install -g typescript
  ```
* Rebuild the three projects
  ```bash
  pushd server && npm install && tsc && popd
  pushd client && npm install && tsc && popd
  pushd ui && npm install && npm run build && popd
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
  cd client
  node build/client/src/index.js
  ```

For more information and tutorials for adding new measurements and controls, see the [wiki](https://github.com/scottjeide/pi-node-jumpstart/wiki)
 
