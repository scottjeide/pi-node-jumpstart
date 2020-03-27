<template>
  <div>
    <p>I'm the controlPanel</p>
    <v-divider></v-divider>
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
  </div>
</template>

<script lang="ts">
console.log('panel opened');



export default {
 
  props: ['initialSettings'],

  // exports the properties that are bound to the UI of the component
  data: function() {
    return this.initialSettings;
  },
  
  // called when the component is loaded
  created: function() {
    
    // make the connection to the server here? (or maybe outside of the component?)
    // Might be good to have some sort of indicator on these to show if connected to the server or not.
    // maybe could put that in the main component though
    console.log("created called");
    
    /* Just some temporary stuff for testing how to react to changes from the server
    setInterval( () => {
      console.log("interval called");
      this.updateSettings();
    }, 10000);
    */
  },
  
  // The methods available to the component
  methods: {
    updateSettings() {
      console.log("update settings called")
      this.on = !this.on;
    },
  },

  // called when the bound properties change so we can make the update on the server
  watch: {
    // watch for any of our data values changing. Just watching them all so we don't need
    // to add an explicit watcher for each setting property when more are added to the 
    // controlPanel dataDefinition
    $data: {
      handler: function(newSettings, oldSettings)  {
        // This is called both when the user makes a change in the UI as well as when
        // we make a change to the data from the background/server. Will need to detect that
        // and handle it so we don't keep bouncing the settings to the server

        // Might need a debounce on this. When dragging the slider it calls back a ton
        console.log('old setting', oldSettings, 'new setting', newSettings);        
      },
      deep: true
    },
  } 
  // can we do props here too? Like passing in a URL or something? Not yet really sure if I want the server update logic to live
  // inside the component or outside of it though
}
</script>