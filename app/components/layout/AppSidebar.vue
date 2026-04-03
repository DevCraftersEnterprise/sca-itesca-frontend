<script setup lang="ts">
defineProps<{
  links: { label: string; to: string }[]
  titulo: string
}>()
</script>

<template>
  <aside class="w-60 bg-gray-900 text-white flex flex-col">
    <div class="px-6 py-5 border-b border-gray-700">
      <span class="text-lg font-bold">{{ titulo }}</span>
    </div>
    <nav class="flex-1 py-4 space-y-1">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center px-6 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md mx-2 transition"
        active-class="bg-gray-700 text-white"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
  </aside>
</template>
