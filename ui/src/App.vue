<template>
  <v-app id="mainApp">

    <v-app-bar
      app
      clipped-left
    >
      <v-toolbar-title>Pi Controller</v-toolbar-title>
      <!-- Could put a on/off button here on the title. That would make it always available at the top? Either that or just make a fixed panel at the top that has the status + settings
      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>      
      -->
    </v-app-bar>

    <v-content>
      <!-- cards might be better too - especially for fixed content like the status & data -->
      <v-expansion-panels
        :accordion=true
        :multiple=true
      >
        <v-expansion-panel
          :isActive=true
        >
          <v-expansion-panel-header>Control Panel</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-switch
              v-model="currentSettings.on"
              :label="`Power: ${currentSettings.on ? 'On' : 'Off'}`"
            ></v-switch>
            <v-text-field
              v-model.number="currentSettings.checkInterval"
              label="Check Interval (in seconds)"
              type="number"
              :outlined=true
            ></v-text-field>
            <v-text-field
              v-model.trim="currentSettings.checkUrl"
              label="URL to check"
              :outlined=true
            ></v-text-field>

            <v-text-field
              v-model="currentSettings.id"
              label="Settings ID"
              placeholder=" "
              readonly
              disabled
              :outlined=false
            ></v-text-field>

            <div class="my-2">
              <!-- Make this enabled/disabled based on if new settings == currentSettings -->
              <v-btn depressed color="primary">Apply</v-btn>
            </div>              

            <v-textarea
              readonly
              :outlined=true
              label="Messages"
              placeholder=" "
              v-model="messageText"

            >
            </v-textarea>
            <!-- start/stop buttons?, running or not running, current settings, last N messages -->

          </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-header>Change Settings</v-expansion-panel-header>
          <v-expansion-panel-content>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-header>Data</v-expansion-panel-header>
          <v-expansion-panel-content>
            <lineChart :chartData="chartData"/>
          </v-expansion-panel-content>
        </v-expansion-panel>

      </v-expansion-panels>
    </v-content>

    <v-footer app>
      <span>&copy; 2020</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
  import io from 'socket.io-client';
  import * as dataDefinitions from '../../shared/dataDefinitions'; // eslint-disable-line no-unused-vars
  import lineChart from './components/lineChart';
  import _ from 'lodash';

  const serverRootUrl = `http://localhost:3001`;
  console.log(`Connecting to: ${serverRootUrl}`);

  

  // Next steps: Add the messages and the data (maybe make some timers on the server or client just generate some)

  // dynamically add the labels based on the data definitions


  let self = null;
  
  export default {
    props: {
      source: String,
    },


    data: () => ({
      
      // serverSettings contains the latest know settings from the server
      serverSettings: dataDefinitions.defaultSettings,

      // currentSettings is whatever settings the UI is currently showing
      currentSettings: dataDefinitions.defaultSettings,

      settingsChanged: false,

      messageText: "",
      messages: [],      
      chartData: {
        labels: [],
        datasets: [
          {
            label: 'Smoker Temp',
            backgroundColor: '#FF0033',
            borderColor:  '#FF0033',
            data: [],
            fill: false,
          },
          {
            label: 'Meat Temp',
            backgroundColor: '#0033FF',
            borderColor:  '#0033FF',
            data: [],
            fill: false,
          }
        ]
      },
    }),

    created () {
      self = this;

      this.$vuetify.theme.dark = true;

      function handleServerSettings(serverSettings: dataDefinitions.settings) {
        console.log('handleSettings called', serverSettings);
        self.serverSettings = {...serverSettings};
        self.currentSettings = {...serverSettings};
      }

      const socket = io(serverRootUrl);
      socket.on('connect', function() {
        console.log('socket is connected');

        // Grab the current settings
        fetch(`${serverRootUrl}/settings`)
          .then((res: { json: () => any; }) => res.json())
          .then((settings: dataDefinitions.settings) => {
            console.log('Read initial settings from server', settings);
            handleServerSettings(settings);
          });
      })
      
      // Pick up any changes a different client might be making to the current settings
      .on('io:settings', (data) => {
        const settings: dataDefinitions.settings = data.msg;
        console.log('got updated settings from the server', settings);
        handleServerSettings(settings);
      })
      
      // Watch for any runtime messages
      .on('io:runtimeMessage', (data) => {
        const message: dataDefinitions.runtimeMessage = data.msg;
        console.log('got new runtime message', message.text);

        self.messages.unshift(message.text);
        if (self.messages.length > 10) {
          self.messages.pop();
        }

        self.messageText = self.messages.join("\n");
      })

      // watch for the measurements
      .on('io:measurement', (data) => {
        const measurement: dataDefinitions.measurement = data.msg;
        console.log('got new measurement', measurement);

        // TODO: need to find something better for label. Maybe just a tick every minute or something?
        // a label per datapoint is really messy
        const now = new Date();
        self.addData(now.toString(), measurement);
      })
      ;

      self.$watch('currentSettings', self.currentSettingsChanged, {deep: true});
    },

    methods: {
      addData: (label, measurement:dataDefinitions.measurement) => {
        self.chartData.labels.push(label);

        self.chartData.datasets[0].data.push(measurement.responseTime);

        // it won't pick up the dynamic stuff we added unless we assign app.chartData to a new object
        self.chartData = {...self.chartData}
      },

      currentSettingsChanged: () => {

/*
            <!-- Note that the .trim and .number in the v-model bindings are pretty important so the underlying currentSettings object maintains
            the right types and doesn't keep any extra whitespace on the strings. Might be good to add some type checking if possible
            when we process the changes so I can remember what it's for. 
            Rather than just using lodash's equal method, it might be better to manual grab keys & check types and values
            so I can give a good log message to remind future me. At least for number and bool values
            Or I could manually coerce the properties back to the proper type and just let the UI be a little less type loose
            Or maybe even make the server coerce the types. That might even be better - could compare vs what we have in the default
            settings object to infer the typescript types and maintain them. I think I'll probably do that
            Plus I'd rather not pull in lodash too if I'm trying to keep this a relatively simple thing
             -->
             */


          self.settingsChanged = !_.isEqual(self.currentSettings, self.serverSettings);

          console.log("settings changed event", self.settingsChanged);
      }

    },

    components: {
      'lineChart': lineChart,
    }

  }
</script>