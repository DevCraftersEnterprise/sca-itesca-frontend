<script setup lang="ts">
definePageMeta({ layout: 'empleado', middleware: ['empleado'] })

const route = useRoute()
const id = route.params.id
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Curso #{{ id }}</h1>
    <!-- TODO: detalle del curso, sesiones, estado de inscripción -->
  </div>
</template>
