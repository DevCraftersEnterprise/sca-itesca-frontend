<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })

const route = useRoute()
const id = route.params.id
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Asistencia · Curso #{{ id }}</h1>
    <!-- TODO: lista de empleados inscritos con control de asistencia por sesión -->
  </div>
</template>
