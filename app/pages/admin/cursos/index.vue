<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-800">Cursos</h1>
      <NuxtLink to="/admin/cursos/nuevo" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        + Nuevo curso
      </NuxtLink>
    </div>
    <!-- TODO: tabla de cursos con AppTable -->
  </div>
</template>
