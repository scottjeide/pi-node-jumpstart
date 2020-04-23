import * as VueChartJs from 'vue-chartjs'

const chartOptions = {
  fill: false,
  scales: {
    xAxes: [{
        type: 'time',
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Time'
        },
        distribution: 'linear',
        ticks: {
            autoSkip: true,
            beginAtZero: true,
            maxTicksLimit: 8
        },
        gridLines: {
            display: false
        }
    }],
    yAxes: [{
      ticks: {
          beginAtZero: true
      },
      gridLines: {
          display: true
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
  responsive: true
}

export default {
  extends: VueChartJs.Line,

  // This creates and watches the chartData prop
  mixins: [VueChartJs.mixins.reactiveProp],
  mounted() {
    this.renderChart(this.chartData, chartOptions);
  }
}
