<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const route = useRoute()
const id = route.params.id
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Empleado #{{ id }}</h1>
    <!-- TODO: detalle del empleado y sus cursos -->
  </div>
</template>
