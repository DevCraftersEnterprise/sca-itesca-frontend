<script setup lang="ts">
defineProps<{
  titulo?: string
}>()
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
    <h2 v-if="titulo" class="text-base font-semibold text-gray-700 mb-3">{{ titulo }}</h2>
    <slot />
  </div>
</template>
