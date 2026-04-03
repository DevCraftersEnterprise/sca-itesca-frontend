<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })

const route = useRoute()
const id = route.params.id
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Calificaciones · Curso #{{ id }}</h1>
    <!-- TODO: tabla de calificaciones por empleado -->
  </div>
</template>
