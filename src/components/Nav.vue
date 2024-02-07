<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <router-link class="navbar-brand" to="/">Placement Service Demo</router-link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link" @click="addTenant">Add Tenant</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" @click="scaleIngester">Scale Ingester</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" @click="ingestSeries.openModal()">Ingest Series</a>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/ingesters">Ingesters</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/physical">Physical Partitions</router-link>
                    </li>
                </ul>
                <div class="me-auto mb-2 mb-lg-0">
                    <span class="text-light">Time: {{ `${Math.floor(elapsedTime / 3600)}`.padStart(2, '0')  }}:{{ `${Math.floor(elapsedTime % 3600/ 60)}`.padStart(2, '0')  }}:00 | </span> <span class="text-light">speed: {{ store.cortex.interval.timeFactor }}X</span>
                </div>
                <div class="me-auto mb-2 mb-lg-0">
                    <span class="text-light"></span>
                </div>
            </div>
        </div>
    </nav>
    <IngestSeries ref="ingestSeries"/>
</template>

<script setup>
import { useStore } from '../store/store'
import IngestSeries from './IngestSeries'
import { onMounted, ref } from 'vue'
const store = useStore()

let ingestSeries

function scaleIngester(event) {
    const cur = store.cortex.scaleUp(1)
}

function addTenant(event) {
    const cur = store.cortex.createTenant('2 Million')
}

let elapsedTime = ref(0)
onMounted(() => {
    setInterval(() => {
        const currentTime = new Date()
        elapsedTime.value = Math.floor((currentTime - store.cortex.createdTime) * store.cortex.interval.timeFactor / 1000)
        // const date = new Date(null)
        // date.setSeconds(elapsed)
        // elapsedTime.value = date.toISOString().substr(8,8)
    }, 1000)
})
</script>