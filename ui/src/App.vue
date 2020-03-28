<template>
  <v-app id="inspire">
    <!-- 
    <v-navigation-drawer
      v-model="drawer"
      app
      clipped
    >      
      <v-list dense>
        <v-list-item link @click="display = 'status'">
          <v-list-item-action>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Status</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link @click="display = 'controlPanel'">
          <v-list-item-action>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Control Panel</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    not sure I'm going to use the drawer, but leaving it here for a bit in case I change my mind -->

    <v-app-bar
      app
      clipped-left
    >
      <!-- the old drawer openclose
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      -->
      <v-toolbar-title>Pi Controller</v-toolbar-title>
      <!-- Could put a start/stop button here on the title. That would make it always available at the top
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
      <v-expansion-panels
        :accordion=true
        :multiple=true
      >
        <v-expansion-panel
          :isActive=true
        >
          <v-expansion-panel-header>Status</v-expansion-panel-header>
          <v-expansion-panel-content>
            <p>some buttons and current message. Should pin this one open</p>
            <!-- start/stop buttons?, running or not running, current settings, last N messages -->
          </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-header>Change Settings</v-expansion-panel-header>
          <v-expansion-panel-content>
            <p>Settings</p>
            <v-switch
              v-model="on"
              :label="`Power: ${on ? 'On' : 'Off'}`"
            ></v-switch>
            <v-divider></v-divider>
            <v-slider
              v-model="smokerSetTemp"
              :label="`Smoker Set Temp`"
              thumb-label="always"
              :max=400
              :min=200>
              </v-slider>
          </v-expansion-panel-content>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-header>Data</v-expansion-panel-header>
          <v-expansion-panel-content>
            The pretty graphs
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
  //import serverApi from './serverApi.ts'



  import io from 'socket.io-client';
  import * as dataDefinitions from '../../shared/dataDefinitions'; // eslint-disable-line no-unused-vars

  const serverRootUrl = `http://localhost:3001`;
  console.log(`Connecting to: ${serverRootUrl}`);

  let currentSettings: dataDefinitions.controlPanel = {
    on: false,
    runId: '',
    smokerSetTemp: 350,
  };


  // probably can fix the this context by binding appropriately, but hack it for now. Nope, still doesn't work. Not sure things are cascading to child controls the way I expected
  let me = null;
  
  export default {
    props: {
      source: String,
    },



    data: () => ({
      drawer: null,
      // indicates which of the display modes we are in. 'status' will show the runtime status screen, 'controlPanel' will show the settings
      display: 'status',
      controlPanel: currentSettings,
    }),



    created () {
      this.$vuetify.theme.dark = true;
      
      const socket = io(serverRootUrl);

      me = this;
      // probably will need to bind this in these callbacks
      socket.on('connect', function() {
        console.log('socket is connected');

        // Read the current settings - any changes will come through the socket message. Reading them
        // here in order to pick up any settings that might have been made while we were disconnected
        fetch(`${serverRootUrl}/controlPanel`)
          .then((res: { json: () => any; }) => res.json())
          .then((settings: dataDefinitions.controlPanel) => {
            console.log('Read initial controlPanel from server', settings);
            me.handleSettings(settings);
          });

      })
      .on('io:controlPanel', (data) => {
        const settings: dataDefinitions.controlPanel = data.msg;
        console.log('got updated settings from the server', settings);
        me.handleSettings(settings);
      });
    },

    methods: {
      handleSettings(newSettings: dataDefinitions.controlPanel) {
        console.log('handleSettings called', newSettings);
        me.controlPanel = {...newSettings};
      }
    },
/*
created: function() {
    console.log("created called");
    setInterval( () => {
      console.log("interval called");
      this.updateSettings();
    }, 10000);

  },
  methods: {
    updateSettings() {
      console.log("update settings called")
      this.onOff = !this.onOff;
    },
*/


    components: {
    }
  }
</script>