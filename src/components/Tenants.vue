<script setup>
import { usePartitionInfo } from '../store/partitioninfo'
const partitionInfo = usePartitionInfo()

</script>

<template>
    <div class="col col-3 d-flex flex-column flex-shrink-0 p-3 bg-light">
    <span class="fs-4">Tenants</span>
    <hr>
    <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item" v-for="(_, tenant) in partitionInfo.tenants">
            <router-link class="nav-link" :to="`/tenants/${tenant}`">{{ tenant }}</router-link>
        </li>
    </ul>
    <hr>
    </div>
</template>
