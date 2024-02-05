<script setup>
import { usePartitionInfo } from '../store/partitioninfo'
const partitionInfo = usePartitionInfo()
</script>

<template>
    <h1>Tenant: {{ $route.params.id }}</h1>
    {{ partitionInfo.tenants[$route.params.id] }}

    <h2>Logical Partitions</h2>

    <p v-for="(lp, k) in partitionInfo.tenants[$route.params.id].logicalPartitions">
        {{ partitionInfo.logicalPartitions[lp] }}
    </p>

    <h2>Physical Partitions</h2>
    <p v-for="(phy, k) in partitionInfo.physicalPartitions">
        {{ phy }}
    </p>
</template>
