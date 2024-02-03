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
      for (let i = 0; i < ingesters.length; i++) {
        labels.push(ingesters[i].name)
        data.push(ingesters[i].getSeries())
      }

      const retval = {
        labels: labels,
        datasets: [
          { data: data },
        ],
      }
      console.log(retval)

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
  <Bar id="chart" :options="chartOptions" :data="chartData" />
</template>
