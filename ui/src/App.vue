<template>
  <v-app id="inspire">
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

    <v-app-bar
      app
      clipped-left
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>Pi Controller</v-toolbar-title>
    </v-app-bar>

    <v-content>
      <v-container
        class="fill-height"
        fluid
      >
        <v-row
          justify="center"
        >
          <v-col class="grow">


            <div v-if="display === 'status'">
              <status/>
            </div>

            <div v-if="display === 'controlPanel'">
              <controlPanel 
                v-bind:initialSettings="controlPanel">
              </controlPanel>
            </div>


          </v-col>
        </v-row>
      </v-container>
    </v-content>

    <v-footer app>
      <span>&copy; 2020</span>
    </v-footer>
  </v-app>
</template>

<script>
  import controlPanel from './components/controlPanel.vue'
  import status from './components/status.vue'
  import serverApi from './serverApi.ts'

  
  export default {
    props: {
      source: String,
    },
    data: () => ({
      drawer: null,
      // indicates which of the display modes we are in. 'status' will show the runtime status screen, 'controlPanel' will show the settings
      display: 'status',
      controlPanel: serverApi.controlPanel,
    }),
    created () {
      this.$vuetify.theme.dark = true;
      serverApi.connect();

    },
    components: {
      'controlPanel': controlPanel,
      'status': status,
    }
  }
</script>