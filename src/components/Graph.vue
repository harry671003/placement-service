<script>

import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

import { useStore } from '../store/store'

export default {
  name: 'BarChart',
  components: { Bar },
  computed: {
    chartData() {
      const store = useStore()
      const ingesters = store.cortex.ingesters

      const labels = []
      const data = []
      for(let [key, ing] of ingesters) {
          labels.push(ing.name)
          data.push(ing.getSeriesCount())  
      };

      const retval = {
        labels: labels,
        datasets: [
          { data: data },
        ],
      }

      return retval
    },
    chartOptions() {
      return {
        responsive: true
      }
    }
  },
}

</script>

<template>
  <div class="col-10">
    <Bar id="chart" :options="chartOptions" :data="chartData" />
  </div>
</template>
