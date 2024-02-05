<script setup>
import { useStore } from '../store/store'
const store = useStore()
</script>

<template>
    <h1>Ingesters</h1>
    <div class="">
        <p v-for="[name, ing] of store.cortex.ingesters">
           {{  ing }} => {{  ing.getSeriesCount() }}
        </p>
    </div>
</template>
