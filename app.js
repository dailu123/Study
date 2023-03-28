<!DOCTYPE html>
<html>
<head>
	<title>Core Banking Event Trigger Near Real Time Dashboard</title>
	<style>
		body {
			background-color: #1c1c1c;
			font-family: Arial, sans-serif;
		}

		h1 {
			color: #fff;
			text-align: center;
			margin-top: 30px;
            font-size: 50px;
            text-shadow: 2px 2px #3498db;
            animation: title 1s ease-in-out infinite alternate;
		}

		.container {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			align-items: center;
			margin-top: 50px;
		}

		.metric {
			background-color: #2c2c2c;
			box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
			margin: 20px;
			padding: 20px;
			width: 11.5%;
			height: 200px;
			border-radius: 20px;
			position: relative;
			overflow: hidden;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
		}

		h2 {
			font-size: 24px;
			margin-bottom: 20px;
			color: #fff;
		}

		.value {
			font-size: 50px;
			font-weight: bold;
			color: #3498db;
			margin-bottom: 10px;
			animation: value 1s ease-in-out infinite alternate;
            display: flex;
            align-items: center;
            justify-content: center;
		}

		.label {
			font-size: 16px;
			color: #bbb;
			text-align: center;
			margin-bottom: 30px;
		}

		.chart {
			width: 100%;
			height: 100%;
			position: absolute;
			top: 0;
			left: 0;
			display: none;
			align-items: flex-end;
			justify-content: center;
		}

		.bar {
			width: 20px;
			margin: 0 10px;
			background-color: #3498db;
			border-radius: 5px 5px 0 0;
			animation-duration: 2s;
			animation-fill-mode: forwards;
			animation-timing-function: ease-in-out;
		}

		.bar-1 {
			height: 0%;
			animation-name: bar1;
		}

		.bar-2 {
			height: 0%;
			animation-name: bar2;
			animation-delay: 0.2s;
		}

		.bar-3 {
			height: 0%;
			animation-name: bar3;
			animation-delay: 0.4s;
		}

        .metric:nth-child(4) .value,
        .metric:nth-child(5) .value,
        .metric:nth-child(6) .value {
            font-size: 40px;
            color: #2ecc71;
            position: relative;
            text-align: center;
        }

        .metric:nth-child(4) .value::after,
        .metric:nth-child(5) .value::after,
        .metric:nth-child(6) .value::after {
            content: "s";
            font-size: 20px;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            right: -10px;
        }

		@keyframes value {
			from {
				transform: translateY(0);
			}
			to {
				transform: translateY(-10px);
			}
		}

		@keyframes bar1 {
			from {
				height: 0%;
			}
		}

		@keyframes bar2 {
			from {
				height: 0%;
			}
		}

		@keyframes bar3 {
			from {
				height: 0%;
			}
		}

        @keyframes title {
            from {
                transform: translateY(0);
            }
            to {
                transform: translateY(-10px);
            }
        }
	</style>
</head>
<body>
	<h1>Core Banking Event Trigger Near Real Time Dashboard</h1>
	<div class="container">
		<div class="metric">
			<h2>HUB -> GCP</h2>
			<div class="value">0</div>
            <div class="label">Data sent from HUB to GCP in the last 24hours</div>
			<div class="chart">
                <div class="bar bar-1"></div>
                <div class="bar bar-2"></div>
                <div class="bar bar-3"></div>
            </div>
		</div>
		<div class="metric">
			<h2>GCP Received</h2>
			<div class="value">0</div>
			<div class="label">Data received by GCP in the last 24hours</div>
			<div class="chart">
                <div class="bar bar-1"></div>
                <div class="bar bar-2"></div>
                <div class="bar bar-3"></div>
            </div>
		</div>
		<div class="metric">
			<h2>To consumer</h2>
			<div class="value">0</div>
			<div class="label">Data forwarded to downstream users in the last 24hours</div>
			<div class="chart">
                <div class="bar bar-1"></div>
                <div class="bar bar-2"></div>
                <div class="bar bar-3"></div>
            </div>
		</div>
        <div class="metric">
			<h2>Average Latency </h2>
			<div class="value">0</div>
			<div class="label">Average Latency in the last 30 minutes</div>
			<div class="chart">
                <div class="bar bar-1"></div>
                <div class="bar bar-2"></div>
                <div class="bar bar-3"></div>
            </div>
		</div>
        <div class="metric">
			<h2>Maximum Latency</h2>
			<div class="value">0</div>
			<div class="label">Maximum Latency in the last 30 minutes</div>
			<div class="chart">
                <div class="bar bar-1"></div>
                <div class="bar bar-2"></div>
                <div class="bar bar-3"></div>
            </div>
		</div>
        <div class="metric">
			<h2>Minimum Latency</h2>
			<div class="value">0</div>
			<div class="label">Minimum Latency in the last 30 minutes</div>
			<div class="chart">
                <div class="bar bar-1"></div>
                <div class="bar bar-2"></div>
                <div class="bar bar-3"></div>
            </div>
		</div>
        <div id="main" style="width: 800px;height:600px;"></div>

    
    <script src="./echarts.min.js"></script>
    <!-- Import ECharts theme -->
    <script src="./macarons.js"></script>
    <script>
    // Initialize ECharts instance
var chart = echarts.init(document.getElementById("main"), "macarons");

// Configuration
var option = {
  // Chart title
  title: {
    text: "Data volume every 30 minutes in recent days",
  },
  // X axis configuration
  xAxis: {
    type: "category",
    boundaryGap: false,
    // X axis data
    data: ["3/20", "3/21", "3/22", "3/23", "3/24", "3/25"],
  },
  // Y axis configuration
  yAxis: {
    type: "value",
    // Y axis unit
    axisLabel: {
      formatter: "{value} B",
    },
  },
  // Chart data
  series: [
    {
      name: "Data volume sent from HUB to GCP",
      type: "line",
      // Data
      data: [120, 132, 101, 134, 90, 230],
    },
    {
      name: "Data volume received by GCP",
      type: "line",
      // Data
      data: [220, 182, 191, 234, 290, 330],
    },
    {
      name: "Data volume forwarded to downstream users",
      type: "line",
      // Data
      data: [150, 232, 201, 154, 190, 330],
    },
  ],
};

// Display chart with specified configuration and data
chart.setOption(option);
    
        
    </script>
	<script>
		const hubData = document.querySelector('.metric:nth-child(1) .value');
		const gcpData = document.querySelector('.metric:nth-child(2) .value');
		const userData = document.querySelector('.metric:nth-child(3) .value');
        const avgDelay = document.querySelector('.metric:nth-child(4) .value');
        const maxDelay = document.querySelector('.metric:nth-child(5) .value');
        const minDelay = document.querySelector('.metric:nth-child(6) .value');

		// Animate HUB to GCP data
		const hubBar1 = document.querySelector('.metric:nth-child(1) .bar-1');
		const hubBar2 = document.querySelector('.metric:nth-child(1) .bar-2');
		const hubBar3 = document.querySelector('.metric:nth-child(1) .bar-3');

		let hubDataCount = 0;
		let hubDataInterval = setInterval(() => {
			hubDataCount += Math.floor(Math.random() * 100) + 1;
			hubData.innerHTML = hubDataCount.toLocaleString();
			hubBar1.style.height = `${hubDataCount / 100}%`;
			hubBar2.style.height = `${hubDataCount / 100 - 20}%`;
			hubBar3.style.height = `${hubDataCount / 100 - 40}%`;
			if (hubDataCount > 5000) clearInterval(hubDataInterval);
		}, 1000);

        // Animate GCP Received data
		const gcpBar1 = document.querySelector('.metric:nth-child(2) .bar-1');
		const gcpBar2 = document.querySelector('.metric:nth-child(2) .bar-2');
		const gcpBar3 = document.querySelector('.metric:nth-child(2) .bar-3');

		let gcpDataCount = 0;
		let gcpDataInterval = setInterval(() => {
			gcpDataCount += Math.floor(Math.random() * 100) + 1;
			gcpData.innerHTML = gcpDataCount.toLocaleString();
			gcpBar1.style.height = `${gcpDataCount / 100}%`;
			gcpBar2.style.height = `${gcpDataCount / 100 - 20}%`;
			gcpBar3.style.height = `${gcpDataCount / 100 - 40}%`;
			if (gcpDataCount > 5000) clearInterval(gcpDataInterval);
		}, 1000);

        // Animate Forwarded to Users data
		const userBar1 = document.querySelector('.metric:nth-child(3) .bar-1');
		const userBar2 = document.querySelector('.metric:nth-child(3) .bar-2');
		const userBar3 = document.querySelector('.metric:nth-child(3) .bar-3');

		let userDataCount = 0;
		let userDataInterval = setInterval(() => {
			userDataCount += Math.floor(Math.random() * 100) + 1;
			userData.innerHTML = userDataCount.toLocaleString();
			userBar1.style.height = `${userDataCount / 100}%`;
			userBar2.style.height = `${userDataCount / 100 - 20}%`;
			userBar3.style.height = `${userDataCount / 100 - 40}%`;
			if (userDataCount > 5000) clearInterval(userDataInterval);
		}, 1000);

        // Animate average delay data
		const avgDelayBar1 = document.querySelector('.metric:nth-child(4) .bar-1');
		const avgDelayBar2 = document.querySelector('.metric:nth-child(4) .bar-2');
		const avgDelayBar3 = document.querySelector('.metric:nth-child(4) .bar-3');

		let avgDelayCount = 0;
		let avgDelayInterval = setInterval(() => {
			avgDelayCount = Math.floor(Math.random() * 2) + 9;
			avgDelay.innerHTML = avgDelayCount.toLocaleString();
			if (avgDelayCount > 5000) clearInterval(avgDelayInterval);
		}, 1000);

        // Animate max delay data
		const maxDelayBar1 = document.querySelector('.metric:nth-child(5) .bar-1');
		const maxDelayBar2 = document.querySelector('.metric:nth-child(5) .bar-2');
		const maxDelayBar3 = document.querySelector('.metric:nth-child(5) .bar-3');

		let maxDelayCount = 0;
		let maxDelayInterval = setInterval(() => {
			maxDelayCount = Math.floor(Math.random() * 30) + 15;
			maxDelay.innerHTML = maxDelayCount.toLocaleString();
			if (maxDelayCount > 5000) clearInterval(maxDelayInterval);
		}, 1000);

        // Animate min delay data
		const minDelayBar1 = document.querySelector('.metric:nth-child(6) .bar-1');
		const minDelayBar2 = document.querySelector('.metric:nth-child(6) .bar-2');
		const minDelayBar3 = document.querySelector('.metric:nth-child(6) .bar-3');

		let minDelayCount = 0;
		let minDelayInterval = setInterval(() => {
			minDelayCount = Math.floor(Math.random() * 3) + 2;
            minDelay.innerHTML = minDelayCount.toLocaleString();
			if (minDelayCount > 5000) clearInterval(minDelayInterval);
		}, 1000);

        // Animate title
        const title = document.querySelector('h1');
        title.style.animationName = 'title';
        title.style.animationDuration = '2s';
        title.style.animationFillMode = 'forwards';
        title.style.animationTimingFunction = 'ease-in-out';
    </script>
</body>
