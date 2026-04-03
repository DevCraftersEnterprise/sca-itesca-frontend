<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })

const route = useRoute()
const id = route.params.id
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Curso #{{ id }}</h1>
    <nav class="flex gap-4 mb-6 text-sm font-medium">
      <NuxtLink :to="`/instructor/cursos/${id}`" class="hover:text-blue-600">Detalle</NuxtLink>
      <NuxtLink :to="`/instructor/cursos/${id}/asistencia`" class="hover:text-blue-600">Asistencia</NuxtLink>
      <NuxtLink :to="`/instructor/cursos/${id}/calificaciones`" class="hover:text-blue-600">Calificaciones</NuxtLink>
    </nav>
    <!-- TODO: información general del curso -->
  </div>
</template>
