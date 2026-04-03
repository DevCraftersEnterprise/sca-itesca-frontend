<script setup lang="ts">
defineProps<{ nombre?: string }>()
defineEmits<{ logout: [] }>()
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
    <span class="text-sm text-gray-500">Sistema de Control de Capacitación</span>
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium text-gray-700">{{ nombre }}</span>
      <button
        @click="$emit('logout')"
        class="text-sm text-red-600 hover:underline"
      >
        Cerrar sesión
      </button>
    </div>
  </header>
</template>
