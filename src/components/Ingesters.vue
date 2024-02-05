<script setup>
import { useStore } from '../store/store'
const store = useStore()
</script>

<template>
    <div class="container">
        <div class="row">
            <h2>Ingesters</h2>
        </div>
        <div class="row" v-for="[name, ing] of store.cortex.ingesters">
            <div class="row">
                <div class="col">{{ name }}</div>
                <div class="col">{{ ing.series }}</div>
            </div>

            <div class="row">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">minTime</th>
                            <th scope="col">maxTime</th>
                            <th scope="col">minRange</th>
                            <th scope="col">maxRange</th>
                            <th scope="col">series</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="[k, phy] of ing.partitions">
                            <td>{{ phy.id }}</td>
                            <td> {{ phy.minTime }}</td>
                            <td> {{ phy.maxTime }}</td>
                            <td> {{ phy.minRange.toString(16).toUpperCase() }}</td>
                            <td> {{ phy.maxRange.toString(16).toUpperCase() }}</td>
                            <td> {{ phy.series }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
