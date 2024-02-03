<script>

import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

import {useIngesterStore} from '../store/ingester-store'

export default {
  name: 'BarChart',
  components: { Bar },
  computed: {
    chartData() {
      const store = useIngesterStore()
      const labels = []
      const datasets = []
      for(let i = 0; i < store.ingesters.length; i++) {
        labels.push(store.ingesters[i].name)
        datasets.push(store.ingesters[i].getSeries())
      }

      console.log(labels)
      console.log(datasets)
      return {
        labels: labels,
        datasets: datasets,
      }
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
  <Bar id="chart" :options="chartOptions" :data="chartData"/>
</template>
