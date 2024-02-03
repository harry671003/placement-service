<script setup>
import Nav from './Nav'
import Graph from './Graph'
import Controls from './Controls'
</script>

<template>
    <Nav></Nav>
    <div class="container">
        <div class="row">
            <div class="col-lg-2 d-flex flex-column flex-shrink-0 p-3 bg-light">
                <Controls></Controls>
            </div>
            
            <div class="col-lg">
                <Graph></Graph>
            </div>
        </div>
        
    </div>
</template>
