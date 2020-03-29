import * as VueChartJs from 'vue-chartjs'

const chartOptions = {
  scales: {
    yAxes: [{
        ticks: {
            beginAtZero: true
        },
        gridLines: {
            display: true
        }
    }],
    xAxes: [{
        ticks: {
            beginAtZero: true
        },
        gridLines: {
            display: false
        }
    }]
  },
  legend: {
      display: true
  },
  tooltips: {
      enabled: true,
      mode: 'single',
      callbacks: {
          label: function(tooltipItems, data) {
              return tooltipItems.yLabel;
          }
      }
  },
  responsive: true,
  maintainAspectRatio: false,
  height: 200
}

export default {
  extends: VueChartJs.Line,

  // This creates and watches the chartData prop
  mixins: [VueChartJs.mixins.reactiveProp],
  mounted() {
    this.renderChart(this.chartData, chartOptions);

    /*
    // Overwriting base render method with actual data.
    this.renderChart({
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      datasets: [
        {
          label: 'GitHub Commits',
          backgroundColor: '#f87979',
          data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
        }
      ]
    })
    */
  }
}
