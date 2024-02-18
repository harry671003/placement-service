<script setup>
import { usePartitionInfo } from '../store/partitioninfo'
const partitionInfo = usePartitionInfo()

</script>

<template>
    <div class="container">
        <div class="row">
            <h4>Partitions</h4>
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
                        <th scope="col">stores</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(part, k) of partitionInfo.partitions">
                        <td>{{ part.id }}</td>
                        <td> {{ part.minTime }}</td>
                        <td> {{ part.maxTime }}</td>
                        <td> {{ part.minRange.toString(16).toUpperCase() }}</td>
                        <td> {{ part.maxRange.toString(16).toUpperCase() }}</td>
                        <td> <span v-for=" (store, k) of part.stores">{{ store }}, </span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
