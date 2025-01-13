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

    <!-- Metrics Cards in a Single Row -->
    <v-row>
      <!-- Total Events -->
      <v-col cols="12" sm="6" md="2">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="primary">mdi-counter</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h6">{{ metrics.totalEvents }}</div>
              <div
                class="caption"
                :class="{
                  'text-success': metrics.totalEventsIncrement >= 0,
                  'text-error': metrics.totalEventsIncrement < 0,
                }"
              >
                {{ metrics.totalEventsIncrement >= 0 ? '+' : '' }}{{ metrics.totalEventsIncrement }}
              </div>
            </v-col>
          </v-row>
          <v-card-subtitle class="grey--text text--darken-1">Total Events Today</v-card-subtitle>
        </v-card>
      </v-col>

      <!-- Successful Events -->
      <v-col cols="12" sm="6" md="2">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="success">mdi-check-circle</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h6">{{ metrics.successfulEvents }}</div>
              <div
                class="caption"
                :class="{
                  'text-success': metrics.successfulEventsIncrement >= 0,
                  'text-error': metrics.successfulEventsIncrement < 0,
                }"
              >
                {{ metrics.successfulEventsIncrement >= 0 ? '+' : '' }}{{ metrics.successfulEventsIncrement }}
              </div>
            </v-col>
          </v-row>
          <v-card-subtitle class="grey--text text--darken-1">Successful Events</v-card-subtitle>
        </v-card>
      </v-col>

      <!-- Failed Events -->
      <v-col cols="12" sm="6" md="2">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="red">mdi-close-circle</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h6">{{ metrics.failedEvents }}</div>
              <div
                class="caption"
                :class="{
                  'text-success': metrics.failedEventsIncrement >= 0,
                  'text-error': metrics.failedEventsIncrement < 0,
                }"
              >
                {{ metrics.failedEventsIncrement >= 0 ? '+' : '' }}{{ metrics.failedEventsIncrement }}
              </div>
            </v-col>
          </v-row>
          <v-card-subtitle class="grey--text text--darken-1">Failed Events</v-card-subtitle>
        </v-card>
      </v-col>

      <!-- Failure Rate -->
      <v-col cols="12" sm="6" md="2">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="orange">mdi-percent</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h6">{{ metrics.failureRate }}%</div>
              <div class="caption">Calculated</div>
            </v-col>
          </v-row>
          <v-card-subtitle class="grey--text text--darken-1">Failure Rate</v-card-subtitle>
        </v-card>
      </v-col>

      <!-- EDA Accumulated -->
      <v-col cols="12" sm="6" md="2">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="purple">mdi-truck-delivery</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h6">{{ metrics.edaAccumulated }}</div>
              <div
                class="caption"
                :class="{
                  'text-success': metrics.edaAccumulatedIncrement >= 0,
                  'text-error': metrics.edaAccumulatedIncrement < 0,
                }"
              >
                {{ metrics.edaAccumulatedIncrement >= 0 ? '+' : '' }}{{ metrics.edaAccumulatedIncrement }}
              </div>
            </v-col>
          </v-row>
          <v-card-subtitle class="grey--text text--darken-1">EDA Accumulated</v-card-subtitle>
        </v-card>
      </v-col>

      <!-- HUB Accumulated -->
      <v-col cols="12" sm="6" md="2">
        <v-card outlined class="pa-4">
          <v-row align="center">
            <v-col cols="3">
              <v-icon large color="teal">mdi-truck-delivery</v-icon>
            </v-col>
            <v-col cols="9">
              <div class="text-h6">{{ metrics.hubAccumulated }}</div>
              <div
                class="caption"
                :class="{
                  'text-success': metrics.hubAccumulatedIncrement >= 0,
                  'text-error': metrics.hubAccumulatedIncrement < 0,
                }"
              >
                {{ metrics.hubAccumulatedIncrement >= 0 ? '+' : '' }}{{ metrics.hubAccumulatedIncrement }}
              </div>
            </v-col>
          </v-row>
          <v-card-subtitle class="grey--text text--darken-1">HUB Accumulated</v-card-subtitle>
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

      <!-- EDA Accumulated Trend -->
      <v-col cols="12" md="6">
        <v-card outlined>
          <v-card-title>EDA Accumulated Trend</v-card-title>
          <v-card-text>
            <div ref="edaAccumulatedTrendChart" style="height: 300px;"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- HUB Accumulated Trend -->
      <v-col cols="12" md="6">
        <v-card outlined>
          <v-card-title>HUB Accumulated Trend</v-card-title>
          <v-card-text>
            <div ref="hubAccumulatedTrendChart" style="height: 300px;"></div>
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
        edaAccumulated: 500,
        edaAccumulatedIncrement: 10,
        hubAccumulated: 300,
        hubAccumulatedIncrement: 8,
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
      edaAccumulatedTrend: [
        { time: "00:00", accumulated: 500 },
        { time: "06:00", accumulated: 520 },
        { time: "12:00", accumulated: 480 },
        { time: "18:00", accumulated: 530 },
        { time: "24:00", accumulated: 500 },
      ],
      hubAccumulatedTrend: [
        { time: "00:00", accumulated: 300 },
        { time: "06:00", accumulated: 310 },
        { time: "12:00", accumulated: 290 },
        { time: "18:00", accumulated: 320 },
        { time: "24:00", accumulated: 300 },
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
      this.renderEdaAccumulatedTrendChart();
      this.renderHubAccumulatedTrendChart();
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
     * Renders the EDA Accumulated Trend chart.
     */
    renderEdaAccumulatedTrendChart() {
      const chart = echarts.init(this.$refs.edaAccumulatedTrendChart);
      const option = {
        title: {
          text: "EDA Accumulated Trend",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
        },
        xAxis: {
          type: "category",
          data: this.edaAccumulatedTrend.map(item => item.time),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "EDA Accumulated",
            type: "line",
            data: this.edaAccumulatedTrend.map(item => item.accumulated),
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
     * Renders the HUB Accumulated Trend chart.
     */
    renderHubAccumulatedTrendChart() {
      const chart = echarts.init(this.$refs.hubAccumulatedTrendChart);
      const option = {
        title: {
          text: "HUB Accumulated Trend",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
        },
        xAxis: {
          type: "category",
          data: this.hubAccumulatedTrend.map(item => item.time),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "HUB Accumulated",
            type: "line",
            data: this.hubAccumulatedTrend.map(item => item.accumulated),
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

      this.metrics.edaAccumulated += this.getRandomInt(2, 10);
      this.metrics.edaAccumulatedIncrement = this.getRandomInt(2, 10);

      this.metrics.hubAccumulated += this.getRandomInt(1, 8);
      this.metrics.hubAccumulatedIncrement = this.getRandomInt(1, 8);
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

      // Update EDA Accumulated Trend
      const currentTime = this.getCurrentTime();
      this.edaAccumulatedTrend.push({ time: currentTime, accumulated: this.metrics.edaAccumulated });
      if (this.edaAccumulatedTrend.length > 10) this.edaAccumulatedTrend.shift();
      this.renderEdaAccumulatedTrendChart();

      // Update HUB Accumulated Trend
      this.hubAccumulatedTrend.push({ time: currentTime, accumulated: this.metrics.hubAccumulated });
      if (this.hubAccumulatedTrend.length > 10) this.hubAccumulatedTrend.shift();
      this.renderHubAccumulatedTrendChart();
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

/* Style for captions */
.caption {
  font-size: 0.75rem;
  margin-top: 4px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .v-card-subtitle {
    font-size: 0.9rem;
  }
}

@media (max-width: 600px) {
  .text-h6 {
    font-size: 1.2rem;
  }
  .caption {
    font-size: 0.6rem;
  }
}
</style>
