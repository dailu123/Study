// src/services/api.js

import axios from 'axios';
import Vue from 'vue';

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080/api', // Backend API base URL
  timeout: 10000, // Request timeout in milliseconds
});

// Request interceptor to add headers or authentication tokens if needed
api.interceptors.request.use(
  config => {
    // Example: Add an Authorization header if a token exists
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses globally
api.interceptors.response.use(
  response => {
    // Any status code within the range of 2xx causes this function to trigger
    return response;
  },
  error => {
    // Any status codes outside the range of 2xx cause this function to trigger
    // Emit a global notification for errors
    Vue.prototype.$notify({
      type: 'error',
      message: error.response && error.response.data ? error.response.data.message : 'An error occurred while processing your request.',
    });
    return Promise.reject(error);
  }
);

export default api;

<!-- src/App.vue -->

<template>
  <v-app>
    <!-- Top App Bar and Sidebar Code (unchanged) -->
    <!-- ... -->

    <!-- Snackbar for Global Notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" top>
      {{ snackbar.message }}
      <v-btn text @click="snackbar.show = false">
        Close
      </v-btn>
    </v-snackbar>

    <!-- Main Content Area -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <!-- Footer Code (unchanged) -->
    <!-- ... -->
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      drawer: true, // Controls the visibility of the sidebar
      snackbar: {
        show: false,
        message: '',
        color: 'error', // Default color
      },
    };
  },
  methods: {
    /**
     * Displays a notification message.
     * @param {Object} options - Contains message and optional color.
     */
    $notify(options) {
      this.snackbar.message = options.message;
      this.snackbar.color = options.color || 'error';
      this.snackbar.show = true;
    },
  },
  created() {
    // Listen for notify events from child components
    this.$root.$on('notify', this.$notify);
  },
  beforeUnmount() {
    // Clean up the event listener
    this.$root.$off('notify', this.$notify);
  },
};
</script>

<style>
/* Global styles (if any) */
</style>


// src/main.js

import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify'; // Vuetify plugin
import api from './services/api'; // Axios API service

const app = createApp(App);

// Make the $notify method available globally via the event bus
app.config.globalProperties.$notify = function(options) {
  this.$root.$emit('notify', options);
};

app.use(vuetify).mount('#app');
<!-- src/views/EventAnalysis.vue -->

<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        Event Analysis - Success, Failures, and Failure Rate
        <!-- Date Picker -->
        <v-spacer></v-spacer>
        <v-menu
          ref="menu"
          v-model="menu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="selectedDate"
              label="Select Date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker v-model="selectedDate" @input="menu = false"></v-date-picker>
        </v-menu>
      </v-card-title>
      <v-card-text>
        <!-- Loading Overlay -->
        <v-overlay :value="loading">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-overlay>
        <!-- Error Alert -->
        <v-alert v-if="error" type="error" dismissible @input="error = false">
          {{ errorMessage }}
        </v-alert>
        <!-- ECharts Container -->
        <div ref="eventAnalysisChart" style="height: 600px;"></div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import * as echarts from "echarts";
import api from "@/services/api"; // Import the unified API service

export default {
  name: "EventAnalysis",
  data() {
    return {
      eventData: [], // Stores the fetched event data
      loading: false, // Controls the display of the loading animation
      selectedDate: this.formatDate(new Date()), // Default to today's date
      menu: false, // Controls the visibility of the date picker menu
      error: false, // Controls the display of the error alert
      errorMessage: "", // Stores error messages
    };
  },
  mounted() {
    this.fetchEventData(); // Fetch data when the component is mounted
    window.addEventListener("resize", this.resizeChart); // Adjust chart on window resize
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.resizeChart); // Clean up the event listener
  },
  watch: {
    selectedDate(newDate, oldDate) {
      if (newDate !== oldDate) {
        this.fetchEventData(); // Refetch data when the selected date changes
      }
    },
  },
  methods: {
    /**
     * Formats a Date object to 'yyyy-MM-dd' string.
     * @param {Date} date - The date to format.
     * @returns {String} - Formatted date string.
     */
    formatDate(date) {
      const year = date.getFullYear();
      const month = (`0${date.getMonth() + 1}`).slice(-2);
      const day = (`0${date.getDate()}`).slice(-2);
      return `${year}-${month}-${day}`;
    },

    /**
     * Retrieves the last three days including the provided date.
     * @param {String} date - The reference date in 'yyyy-MM-dd' format.
     * @returns {Array<String>} - Array of the last three dates.
     */
    getLastThreeDays(date) {
      const current = new Date(date);
      const dates = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(current);
        d.setDate(current.getDate() - i);
        dates.push(this.formatDate(d));
      }
      return dates;
    },

    /**
     * Fetches event data from the backend API.
     */
    async fetchEventData() {
      this.loading = true; // Show loading animation
      this.error = false; // Hide error alert
      try {
        const response = await api.get("/event-data", {
          params: {
            date: this.selectedDate, // Pass the selected date as a query parameter
          },
        });
        this.eventData = response.data; // Store the fetched data
        this.renderEventAnalysisChart(); // Render the chart with the new data
      } catch (error) {
        console.error("Error fetching event data:", error);
        this.error = true;
        this.errorMessage = "Failed to load event data. Please try again later.";
      } finally {
        this.loading = false; // Hide loading animation
      }
    },

    /**
     * Renders the ECharts visualization with the fetched data.
     */
    renderEventAnalysisChart() {
      if (!this.eventData || this.eventData.length === 0) {
        return; // Do not render if there's no data
      }

      const chart = echarts.init(this.$refs.eventAnalysisChart);
      this.chart = chart; // Keep a reference to the chart instance for resizing

      // Generate the last three days' dates
      const dates = this.getLastThreeDays(this.selectedDate);

      // Prepare data for the chart
      const eventNames = this.eventData.map(event => event.eventName);
      const successCounts = this.eventData.map(event => event.successCount);
      const failureCounts = this.eventData.map(event => event.failureCount);
      const failureRates = this.eventData.map(event => event.failureRate);
      const highlightFlags = this.eventData.map(event => event.failureRate > 30); // Highlight events with failure rate > 30%

      const option = {
        title: {
          text: "Event Success, Failures, and Failure Rate",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            let tooltip = `<b>${params[0].axisValue}</b><br/>`;
            params.forEach((item) => {
              if (item.seriesName === "Failure Rate (%)") {
                tooltip += `${item.marker} ${item.seriesName}: ${item.data.toFixed(2)}%<br/>`;
              } else {
                tooltip += `${item.marker} ${item.seriesName}: ${item.data}<br/>`;
              }
            });
            return tooltip;
          },
        },
        legend: {
          data: ["Success", "Failure", "Failure Rate (%)"],
          top: "10%",
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: eventNames,
          axisLabel: {
            interval: 0,
            rotate: 45, // Rotate labels for better readability
            fontSize: 8,
          },
        },
        yAxis: [
          {
            type: "value",
            name: "Count",
            position: "left",
            axisLabel: {
              formatter: "{value}",
            },
          },
          {
            type: "value",
            name: "Failure Rate (%)",
            position: "right",
            axisLabel: {
              formatter: "{value}%",
            },
            min: 0,
            max: 100,
          },
        ],
        dataZoom: [
          {
            type: "slider",
            start: 0,
            end: 100,
          },
          {
            type: "inside",
            start: 0,
            end: 100,
          },
        ],
        series: [
          {
            name: "Success",
            type: "bar",
            stack: "total",
            data: successCounts,
            itemStyle: {
              color: "#4CAF50", // Green color for success
            },
            barWidth: "60%",
          },
          {
            name: "Failure",
            type: "bar",
            stack: "total",
            data: failureCounts,
            itemStyle: {
              // Red if failure rate > 30%, else yellow
              color: (params) => highlightFlags[params.dataIndex] ? "#FF5252" : "#FFC107",
            },
            barWidth: "60%",
          },
          {
            name: "Failure Rate (%)",
            type: "line",
            yAxisIndex: 1,
            data: failureRates,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: {
              color: "#FFC107", // Yellow color for failure rate
            },
            itemStyle: {
              // Red if failure rate > 30%, else yellow
              color: (params) => highlightFlags[params.dataIndex] ? "#FF5252" : "#FFC107",
            },
          },
        ],
      };

      chart.setOption(option);
    },

    /**
     * Resizes the chart to fit the container when the window size changes.
     */
    resizeChart() {
      if (this.chart) {
        this.chart.resize();
      }
    },
  },
};
</script>

<style scoped>
/* Ensure the chart container fills the card */
div[ref="eventAnalysisChart"] {
  width: 100%;
  height: 600px;
}
</style>
