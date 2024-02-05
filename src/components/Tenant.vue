<script setup>
import { usePartitionInfo } from '../store/partitioninfo'
const partitionInfo = usePartitionInfo()
const props = defineProps(['tenantID'])
const tenant = partitionInfo.tenants[props.tenantID]

</script>

<template>
    <div class="container">
        <div class="row">
            <h2>Tenant</h2>
        </div>
        <div class="row">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Tenant ID</th>
                        <th scope="col">Alias</th>
                        <th scope="col">Active Series</th>
                        <th scope="col">Logical Partitions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td scope="col">{{ props.tenantID }}</td>
                        <td scope="col">{{ tenant.alias }}</td>
                        <td scope="col">{{ tenant.series }}</td>
                        <td><span v-for="(log, k) of tenant.logicalPartitions">{{ log }}, </span></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="row">
            <h4>Logical Partitions</h4>
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
                        <th scope="col">physicalPartitions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(log, k) of tenant.logicalPartitions"  :set="logicalPartition = partitionInfo.logicalPartitions[log]">
                        <td>{{ logicalPartition.id }}</td>
                        <td> {{ logicalPartition.minTime }}</td>
                        <td> {{ logicalPartition.maxTime }}</td>
                        <td> {{ logicalPartition.minRange.toString(16).toUpperCase() }}</td>
                        <td> {{ logicalPartition.maxRange.toString(16).toUpperCase() }}</td>
                        <td> <span v-for=" (log, k) of logicalPartition.physicalPartitions">{{ log }}, </span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
``