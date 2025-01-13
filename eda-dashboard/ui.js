<template>
  <v-container fluid>
    <!-- Date Picker -->
    <v-row class="mb-5">
      <v-col cols="12" sm="6" md="4">
        <v-menu
          v-model="menu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="290px"
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
          <v-date-picker
            v-model="selectedDate"
            @input="menu = false"
            :max="today"
          ></v-date-picker>
        </v-menu>
      </v-col>
    </v-row>

    <!-- Metrics Cards -->
    <v-row>
      <!-- Total Events -->
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="primary">mdi-counter</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h5">{{ metrics.totalEvents }}</div>
              <div class="caption">Last Minute Increase: {{ metrics.totalEventsIncrement }}</div>
              <div class="caption">Total Events Today</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Successful Events -->
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="success">mdi-check-circle</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h5">{{ metrics.successfulEvents }}</div>
              <div class="caption">Last Minute Increase: {{ metrics.successfulEventsIncrement }}</div>
              <div class="caption">Successful Events</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Failed Events -->
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="red">mdi-close-circle</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h5">{{ metrics.failedEvents }}</div>
              <div class="caption">Last Minute Increase: {{ metrics.failedEventsIncrement }}</div>
              <div class="caption">Failed Events</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Failure Rate -->
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="orange">mdi-percent</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h5">{{ metrics.failureRate }}%</div>
              <div class="caption">Calculated from today's events</div>
              <div class="caption">Failure Rate</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- EDA Backlog -->
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="purple">mdi-truck-delivery</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h5">{{ metrics.edaBacklog }}</div>
              <div class="caption">Last Minute Increase: {{ metrics.edaBacklogIncrement }}</div>
              <div class="caption">EDA Backlog</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- HUB Backlog -->
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="teal">mdi-truck-delivery</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h5">{{ metrics.hubBacklog }}</div>
              <div class="caption">Last Minute Increase: {{ metrics.hubBacklogIncrement }}</div>
              <div class="caption">HUB Backlog</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Section -->
    <v-row>
      <!-- Top 10 Events by Volume -->
      <v-col cols="12" md="6">
        <v-card outlined>
          <v-card-title>Top 10 Events by Volume</v-card-title>
          <v-card-text>
            <div ref="topEventsChart" style="height: 400px;"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Top 10 Events with High Delays -->
      <v-col cols="12" md="6">
        <v-card outlined>
          <v-card-title>Top 10 Events with High Delays</v-card-title>
          <v-card-text>
            <div ref="highDelaysChart" style="height: 400px;"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- EDA Backlog Trend -->
      <v-col cols="12" md="6">
        <v-card outlined>
          <v-card-title>EDA Backlog Trend</v-card-title>
          <v-card-text>
            <div ref="edaBacklogChart" style="height: 300px;"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- HUB Backlog Trend -->
      <v-col cols="12" md="6">
        <v-card outlined>
          <v-card-title>HUB Backlog Trend</v-card-title>
          <v-card-text>
            <div ref="hubBacklogChart" style="height: 300px;"></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "Overview",
  data() {
    return {
      menu: false, // Controls the date picker menu
      selectedDate: this.formatDate(new Date()), // Default to today's date
      today: this.formatDate(new Date()), // Today's date for max date in date picker

      // Metrics data
      metrics: {
        totalEvents: 1000,
        totalEventsIncrement: 15,
        successfulEvents: 800,
        successfulEventsIncrement: 12,
        failedEvents: 200,
        failedEventsIncrement: 3,
        failureRate: 20,
        edaBacklog: 500,
        edaBacklogIncrement: 10,
        hubBacklog: 300,
        hubBacklogIncrement: 8,
      },

      // Mock data for charts
      topEventsData: [
        { name: "Event A", value: 150 },
        { name: "Event B", value: 120 },
        { name: "Event C", value: 100 },
        { name: "Event D", value: 90 },
        { name: "Event E", value: 80 },
        { name: "Event F", value: 70 },
        { name: "Event G", value: 60 },
        { name: "Event H", value: 50 },
        { name: "Event I", value: 40 },
        { name: "Event J", value: 30 },
      ],
      highDelaysData: [
        { name: "Event X", value: 300 },
        { name: "Event Y", value: 250 },
        { name: "Event Z", value: 200 },
        { name: "Event W", value: 180 },
        { name: "Event V", value: 160 },
        { name: "Event U", value: 140 },
        { name: "Event T", value: 120 },
        { name: "Event S", value: 100 },
        { name: "Event R", value: 80 },
        { name: "Event Q", value: 60 },
      ],
      edaBacklogTrend: [
        { time: "00:00", backlog: 500 },
        { time: "06:00", backlog: 520 },
        { time: "12:00", backlog: 480 },
        { time: "18:00", backlog: 530 },
        { time: "24:00", backlog: 500 },
      ],
      hubBacklogTrend: [
        { time: "00:00", backlog: 300 },
        { time: "06:00", backlog: 310 },
        { time: "12:00", backlog: 290 },
        { time: "18:00", backlog: 320 },
        { time: "24:00", backlog: 300 },
      ],
    };
  },
  mounted() {
    this.renderCharts();
    this.startRealTimeUpdates();
  },
  beforeUnmount() {
    clearInterval(this.updateInterval);
  },
  methods: {
    /**
     * Formats a Date object to 'yyyy-MM-dd' string.
     * @param {Date} date 
     * @returns {String}
     */
    formatDate(date) {
      const year = date.getFullYear();
      const month = (`0${date.getMonth() + 1}`).slice(-2);
      const day = (`0${date.getDate()}`).slice(-2);
      return `${year}-${month}-${day}`;
    },

    /**
     * Renders all charts using ECharts.
     */
    renderCharts() {
      this.renderTopEventsChart();
      this.renderHighDelaysChart();
      this.renderEdaBacklogTrendChart();
      this.renderHubBacklogTrendChart();
    },

    /**
     * Renders the Top 10 Events by Volume chart.
     */
    renderTopEventsChart() {
      const chart = echarts.init(this.$refs.topEventsChart);
      const option = {
        title: {
          text: "Top 10 Events by Volume",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        xAxis: {
          type: "category",
          data: this.topEventsData.map(item => item.name),
          axisLabel: {
            rotate: 45,
            interval: 0,
          },
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Volume",
            type: "bar",
            data: this.topEventsData.map(item => item.value),
            itemStyle: {
              color: "#3f51b5",
            },
          },
        ],
      };
      chart.setOption(option);
      window.addEventListener("resize", () => chart.resize());
    },

    /**
     * Renders the Top 10 Events with High Delays chart.
     */
    renderHighDelaysChart() {
      const chart = echarts.init(this.$refs.highDelaysChart);
      const option = {
        title: {
          text: "Top 10 Events with High Delays",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        xAxis: {
          type: "category",
          data: this.highDelaysData.map(item => item.name),
          axisLabel: {
            rotate: 45,
            interval: 0,
          },
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Delay (ms)",
            type: "bar",
            data: this.highDelaysData.map(item => item.value),
            itemStyle: {
              color: "#f44336",
            },
          },
        ],
      };
      chart.setOption(option);
      window.addEventListener("resize", () => chart.resize());
    },

    /**
     * Renders the EDA Backlog Trend chart.
     */
    renderEdaBacklogTrendChart() {
      const chart = echarts.init(this.$refs.edaBacklogChart);
      const option = {
        title: {
          text: "EDA Backlog Trend",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
        },
        xAxis: {
          type: "category",
          data: this.edaBacklogTrend.map(item => item.time),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "EDA Backlog",
            type: "line",
            data: this.edaBacklogTrend.map(item => item.backlog),
            smooth: true,
            itemStyle: {
              color: "#9c27b0",
            },
            areaStyle: {
              color: "rgba(156, 39, 176, 0.2)",
            },
          },
        ],
      };
      chart.setOption(option);
      window.addEventListener("resize", () => chart.resize());
    },

    /**
     * Renders the HUB Backlog Trend chart.
     */
    renderHubBacklogTrendChart() {
      const chart = echarts.init(this.$refs.hubBacklogChart);
      const option = {
        title: {
          text: "HUB Backlog Trend",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
        },
        xAxis: {
          type: "category",
          data: this.hubBacklogTrend.map(item => item.time),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "HUB Backlog",
            type: "line",
            data: this.hubBacklogTrend.map(item => item.backlog),
            smooth: true,
            itemStyle: {
              color: "#009688",
            },
            areaStyle: {
              color: "rgba(0, 150, 136, 0.2)",
            },
          },
        ],
      };
      chart.setOption(option);
      window.addEventListener("resize", () => chart.resize());
    },

    /**
     * Starts real-time updates for metrics and charts.
     */
    startRealTimeUpdates() {
      // Simulate real-time data updates every minute
      this.updateInterval = setInterval(() => {
        this.updateMetrics();
        this.updateCharts();
      }, 60000); // 60000 ms = 1 minute
    },

    /**
     * Updates metrics with mock data.
     */
    updateMetrics() {
      // Simulate metric increments
      this.metrics.totalEvents += this.getRandomInt(5, 20);
      this.metrics.totalEventsIncrement = this.getRandomInt(5, 20);

      this.metrics.successfulEvents += this.getRandomInt(3, 15);
      this.metrics.successfulEventsIncrement = this.getRandomInt(3, 15);

      this.metrics.failedEvents += this.getRandomInt(1, 10);
      this.metrics.failedEventsIncrement = this.getRandomInt(1, 10);

      // Recalculate failure rate
      const total = this.metrics.successfulEvents + this.metrics.failedEvents;
      this.metrics.failureRate = total > 0 ? ((this.metrics.failedEvents / total) * 100).toFixed(2) : 0;

      this.metrics.edaBacklog += this.getRandomInt(2, 10);
      this.metrics.edaBacklogIncrement = this.getRandomInt(2, 10);

      this.metrics.hubBacklog += this.getRandomInt(1, 8);
      this.metrics.hubBacklogIncrement = this.getRandomInt(1, 8);
    },

    /**
     * Updates charts with new mock data.
     */
    updateCharts() {
      // Update Top Events Chart
      this.topEventsData = this.topEventsData.map(item => ({
        ...item,
        value: item.value + this.getRandomInt(1, 10),
      }));
      this.renderTopEventsChart();

      // Update High Delays Chart
      this.highDelaysData = this.highDelaysData.map(item => ({
        ...item,
        value: item.value + this.getRandomInt(5, 20),
      }));
      this.renderHighDelaysChart();

      // Update EDA Backlog Trend
      const currentTime = this.getCurrentTime();
      this.edaBacklogTrend.push({ time: currentTime, backlog: this.metrics.edaBacklog });
      if (this.edaBacklogTrend.length > 10) this.edaBacklogTrend.shift();
      this.renderEdaBacklogTrendChart();

      // Update HUB Backlog Trend
      this.hubBacklogTrend.push({ time: currentTime, backlog: this.metrics.hubBacklog });
      if (this.hubBacklogTrend.length > 10) this.hubBacklogTrend.shift();
      this.renderHubBacklogTrendChart();
    },

    /**
     * Generates a random integer between min and max (inclusive).
     * @param {Number} min 
     * @param {Number} max 
     * @returns {Number}
     */
    getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Gets the current time in 'HH:mm' format.
     * @returns {String}
     */
    getCurrentTime() {
      const now = new Date();
      const hours = (`0${now.getHours()}`).slice(-2);
      const minutes = (`0${now.getMinutes()}`).slice(-2);
      return `${hours}:${minutes}`;
    },
  },
};
</script>

<style scoped>
/* Style for Metric Cards */
.v-card {
  transition: transform 0.3s;
}
.v-card:hover {
  transform: translateY(-5px);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .v-card-title {
    font-size: 1.2rem;
  }
  .text-h5 {
    font-size: 1.5rem;
  }
}
</style>



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
