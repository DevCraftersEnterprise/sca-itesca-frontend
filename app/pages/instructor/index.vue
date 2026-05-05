<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })
const config = useRuntimeConfig()
const { token } = useAuth()

const modalidadBadge: Record<string, string> = {
  PRESENCIAL: 'bg-green-100 text-green-700',
  ONLINE:     'bg-blue-100 text-blue-600',
  Híbrido:    'bg-purple-100 text-purple-600',
}
const formatDate = (date: string | Date) => {
  if (!date) return 'Sin fecha';
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
const { data: cursos, pending, error } = await useAsyncData(
  'mis-cursos', 
  () => fetchMisCursos(config, token.value),
  {
    watch: [token], // Si el token cambia, se refresca solo
    server: false   // Como dependemos de un token del cliente, lo dejamos en false
  }
)

const activos = computed(() => {
  return cursos.value?.filter((curso: any) => {
    return curso.estado === 'EN_CURSO' || curso.estado === 'POR_INSCRIBIR'
  })
})
const finalizados = computed(() => {
  return cursos.value?.filter((curso: any) => {
    return curso.estado === 'FINALIZADO'
  })
})
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Cursos que imparto</h1>
      <p class="text-sm text-gray-400">
        {{ new Date().getFullYear() }} ·
        {{ activos?.length }} curso{{ activos?.length !== 1 ? 's' : '' }} asignado{{ activos?.length !== 1 ? 's' : '' }}
      </p>
    </div>

    <!-- ══ Activos ══ -->
    <section v-if="activos?.length > 0" class="mb-10">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#4B7BF5]"></span>
        En curso
        <span class="text-xs font-normal text-gray-400 normal-case">({{ activos.length }})</span>
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="c in activos" :key="c.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">

          <div class="px-5 py-4" style="background:linear-gradient(135deg,#2B4EF0,#4B7BF5)">
            <p class="text-xs text-white/70 mb-0.5">Interno · Activo</p>
            <h3 class="text-base font-bold text-white leading-snug">{{ c.nombre }}</h3>
            <p class="text-xs text-white/60 mt-1">{{ formatDate(c.fechaInicio) }} – {{ formatDate(c.fechaFin) }}</p>
          </div>

          <div class="flex-1 p-5 space-y-3">
            <p class="text-xs text-gray-500 leading-relaxed line-clamp-2">{{ c.descripcion }}</p>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-gray-50 rounded-xl p-2.5">
                <p class="text-gray-400 mb-1">Modalidad</p>
                <span :class="['font-semibold px-1.5 py-0.5 rounded-full text-[10px]', modalidadBadge[c.modalidad]]">{{ c.modalidad }}</span>
              </div>
              <div class="bg-gray-50 rounded-xl p-2.5">
                <p class="text-gray-400 mb-1">Aula</p>
                <p class="font-semibold text-gray-800 truncate">{{ c.aula }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-2.5">
                <p class="text-gray-400 mb-1">Duración</p>
                <p class="font-semibold text-gray-800">{{ c.duracionHrs }} hrs</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-2.5">
                <p class="text-gray-400 mb-1">Inscritos</p>
                <p class="font-semibold text-gray-800">{{ c.empleados.length }} alumnos</p>
              </div>
            </div>

            <p class="text-xs text-gray-400">
              <span class="font-medium text-gray-600">Horario: </span>{{ c.horaInicio }} - {{ c.horaFin }}
            </p>
          </div>

          <div class="px-5 pb-5 flex gap-2">
            <NuxtLink :to="`/instructor/cursos/${c.id}`"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white hover:brightness-110 transition"
              style="background:linear-gradient(135deg,#2B4EF0,#4B7BF5)">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Ver curso
            </NuxtLink>
            <NuxtLink :to="`/instructor/cursos/${c.id}/asistencia`"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              Asistencia
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ Finalizados ══ -->
    <section v-if="finalizados?.length > 0">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-gray-300"></span>
        Finalizados
        <span class="text-xs font-normal text-gray-400 normal-case">({{ finalizados.length }})</span>
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="c in finalizados" :key="c.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">

          <div class="px-5 py-4" style="background:linear-gradient(135deg,#4b5563,#6b7280)">
            <p class="text-xs text-white/70 mb-0.5">Interno · Finalizado</p>
            <h3 class="text-base font-bold text-white leading-snug">{{ c.nombre }}</h3>
            <p class="text-xs text-white/60 mt-1">{{ formatDate(c.fechaInicio) }} – {{ formatDate(c.fechaFin) }}</p>
          </div>

          <div class="flex-1 p-5 space-y-3">
            <p class="text-xs text-gray-500 leading-relaxed line-clamp-2">{{ c.descripcion }}</p>

            <!-- Reconocimiento chip -->
            <div class="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <svg class="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              <p class="text-xs font-semibold text-green-700">Reconocimiento disponible</p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-gray-50 rounded-xl p-2.5">
                <p class="text-gray-400 mb-1">Modalidad</p>
                <span :class="['font-semibold px-1.5 py-0.5 rounded-full text-[10px]', modalidadBadge[c.modalidad]]">{{ c.modalidad }}</span>
              </div>
              <div class="bg-gray-50 rounded-xl p-2.5">
                <p class="text-gray-400 mb-1">Inscritos</p>
                <p class="font-semibold text-gray-800">{{ c.empleados.length }} alumnos</p>
              </div>
            </div>
          </div>

          <div class="px-5 pb-5">
            <NuxtLink :to="`/instructor/cursos/${c.id}`"
              class="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition w-full">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Ver detalles y reconocimiento
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Empty -->
    <div v-if="cursos?.length === 0" class="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
      </div>
      <p class="text-sm font-semibold text-gray-400">Sin cursos asignados</p>
      <p class="text-xs text-gray-300 mt-1">El administrador aún no te ha asignado cursos</p>
    </div>
  </div>
</template>
