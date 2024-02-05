<script setup>
import { useStore } from '../store/store'
const store = useStore()
</script>

<template>
    <div class="container">
        <div class="row">
            <h2>Ingesters</h2>
        </div>
        <div class="row">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Series</th>
                        <th scope="col">Partitions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="[name, ing] of store.cortex.ingesters">
                        <td scope="row">{{ name }}</td>
                        <td>{{ ing.getSeriesCount() }}</td>
                        <td><span v-for="[name, partitions] of ing.partitions">{{ name }}, </span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
