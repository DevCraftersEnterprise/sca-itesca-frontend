<script setup lang="ts">
defineProps<{
  columnas: string[]
}>()
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200">
    <table class="min-w-full text-sm text-gray-700">
      <thead class="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th
            v-for="col in columnas"
            :key="col"
            class="px-4 py-3 text-left font-medium"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <slot />
      </tbody>
    </table>
  </div>
</template>
