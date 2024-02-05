
<script setup>
import { onMounted, ref } from "vue";
import * as bootstrap from 'bootstrap';
import { useStore } from '../store/store'
import { usePartitionInfo } from '../store/partitioninfo'

const cortex = useStore().cortex
const partitionInfo = usePartitionInfo()

let ingestSeriesModal
const openModal = () => {
    ingestSeriesModal.show()
}
onMounted(() => {
    ingestSeriesModal = new bootstrap.Modal('#ingestSeries', {})
})

let selectedTenant = ref("")
let tenantSeries = ref(0)


function handleTenantChange() {
    const tenant = selectedTenant.value
    tenantSeries = ref(partitionInfo.tenants[tenant].series)
}

function save() {
    const tenant = selectedTenant.value
    const series = tenantSeries.value
    cortex.updateTenant(tenant, series)
    ingestSeriesModal.hide()
}


defineExpose({
    openModal,
})
</script>


<template>
    <!-- Modal -->
    <div class="modal fade" id="ingestSeries" tabindex="-1" aria-labelledby="ingestSeriesLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="ingestSeriesLabel">Modal title</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="col-form-label" for="tenant">Tenant: </label>
                        <select id="tenant" class="form-select" v-model="selectedTenant" @change="handleTenantChange">
                            <option disabled value="">Select Tenant</option>
                            <option v-for="(_, tenant) in partitionInfo.tenants" :value="tenant">{{ tenant }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="col-form-label" for="series">Active Series: </label>
                        <input id="series" class="form-control" v-model="tenantSeries">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" @click="save()">Save</button>
                </div>
            </div>
        </div>
    </div>
</template>
