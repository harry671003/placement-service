<script>

import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Colors } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, Colors)

import { useStore } from '../store/store'

export default {
  name: 'BarChart',
  components: { Bar },
  computed: {
    chartData() {
      const store = useStore()
      const ingesters = store.cortex.ingesters

      const labels = []
      const memorySeries = []
      const activeSeries = []
      for (let [key, ing] of ingesters) {
        labels.push(ing.name)
        memorySeries.push(ing.getSeriesCount())
        activeSeries.push(-ing.getActiveSeriesCount())
      };

      const retval = {
        labels: labels,
        datasets: [
          {
            label: 'Memory series',
            data: memorySeries,
          },
          {
            label: 'Active series',
            data: activeSeries
          },
        ],
      }

      return retval
    },
    chartOptions() {
      return {
        plugins: {
          title: {
            display: true,
            text: 'Ingesters'
          },
        },
        responsive: true,
        aspectRatio: 2,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true
          }
        }
      }
    }
  },
}

</script>

<template>
  <div class="col col-9 d-flex flex-column flex-shrink-0 p-3 bg-light">
    <Bar id="chart" :options="chartOptions" :data="chartData" class="h-100" />
  </div>
</template>
