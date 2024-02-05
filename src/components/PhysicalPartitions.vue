<script setup>
import { usePartitionInfo } from '../store/partitioninfo'
const partitionInfo = usePartitionInfo()

</script>

<template>
    <div class="container">
        <div class="row">
            <h4>Physical Partitions</h4>
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
                    <tr v-for="(phy, k) of partitionInfo.physicalPartitions">
                        <td>{{ phy.id }}</td>
                        <td> {{ phy.minTime }}</td>
                        <td> {{ phy.maxTime }}</td>
                        <td> {{ phy.minRange.toString(16).toUpperCase() }}</td>
                        <td> {{ phy.maxRange.toString(16).toUpperCase() }}</td>
                        <td> <span v-for=" (store, k) of phy.stores">{{ store }}, </span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
