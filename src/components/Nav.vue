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
                        <a class="nav-link" @click="createTenant">Create Tenant</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" @click="scaleIngester">Scale Ingester</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" @click="ingestSeries">Ingest Series</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { useStore } from '../store/store'
const store = useStore()

function scaleIngester(event) {
    const cur = store.cortex.scaleUp(1)
}

function createTenant(event) {
    const cur = store.cortex.createTenant('2 Million')
}

function ingestSeries(event) {

}
</script>
