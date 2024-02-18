<script setup>
import { usePartitionInfo } from '../store/partitioninfo'
import { RangePartitioner } from '../partitioner';
const partitionInfo = usePartitionInfo()
const props = defineProps(['tenantID'])
const tenant = partitionInfo.tenants[props.tenantID]
const partitioner = new RangePartitioner()

console.log(tenant)

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
                        <th scope="col">Partitions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td scope="col">{{ props.tenantID }}</td>
                        <td scope="col">{{ tenant.alias }}</td>
                        <td scope="col">{{ tenant.series }}</td>
                        <td><span v-for="(part, k) of tenant.partitions">{{ part }}, </span></td>
                    </tr>
                </tbody>
            </table>
        </div>
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
                        <th scope="col">rangeSplit</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(part, k) of tenant.partitions"  :set="partition = partitionInfo.partitions[part]">
                        <td>{{ partition.id }}</td>
                        <td> {{ partition.minTime }}</td>
                        <td> {{ partition.maxTime }}</td>
                        <td> {{ partition.minRange.toString(16).toUpperCase() }}</td>
                        <td> {{ partition.maxRange.toString(16).toUpperCase() }}</td>
                        <td> 1/{{ partitioner.getRangeSplit(partition.minRange, partition.maxRange) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
``