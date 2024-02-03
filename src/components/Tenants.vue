<script setup>
import { useStore } from '../store/store'
const store = useStore()

const tenants = store.cortex.tenants
</script>

<template>
    <span class="fs-4">Tenants</span>
    <hr>
    <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item" v-for="(tenant, index) in tenants">
            <code>{{ tenant.id }}</code>
        </li>
    </ul>
    <hr>
</template>
