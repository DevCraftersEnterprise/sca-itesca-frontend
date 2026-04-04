<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })

const route  = useRoute()
const id     = Number(route.params.id)
const { usuario } = useAuth()
const { cursosInstructor } = useInstructorCursos()

const curso = computed(() => cursosInstructor.find(c => c.id === id))

const modalidadBadge: Record<string, string> = {
  Presencial: 'bg-green-100 text-green-700',
  Online:     'bg-blue-100 text-blue-600',
  Híbrido:    'bg-purple-100 text-purple-600',
}

const descargarReconocimiento = () => {
  if (!curso.value) return
  const nombre = usuario.value?.nombre ?? 'Instructor'
  const lines = [
    'INSTITUTO TECNOLÓGICO SUPERIOR DE CAJEME',
    'RECONOCIMIENTO COMO INSTRUCTOR',
    '',
    `Instructor: ${nombre}`,
    `Departamento: ${usuario.value?.departamento ?? '—'}`,
    `Curso: ${curso.value.nombre}`,
    `Descripción: ${curso.value.descripcion}`,
    `Modalidad: ${curso.value.modalidad}`,
    `Aula: ${curso.value.aula}`,
    `Horario: ${curso.value.horario}`,
    `Duración: ${curso.value.duracion}`,
    `Período: ${curso.value.fechaInicio} – ${curso.value.fechaFin}`,
    `Total de alumnos: ${curso.value.inscritos.length}`,
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `reconocimiento_${curso.value.nombre.replace(/\s+/g, '_')}.txt` })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const initiales = (nombre: string) => nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
</script>

<template>
  <div v-if="curso">

    <!-- Back -->
    <NuxtLink to="/instructor"
      class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition group">
      <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Cursos impartidos
    </NuxtLink>

    <!-- Course header + tab nav -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div class="px-6 py-5 flex items-start justify-between gap-4"
        :style="curso.estado === 'activo' ? 'background:linear-gradient(135deg,#2B4EF0,#4B7BF5)' : 'background:linear-gradient(135deg,#4b5563,#6b7280)'">
        <div class="min-w-0">
          <p class="text-xs text-white/70 mb-0.5">Curso interno · {{ curso.inscritos.length }} alumnos inscritos</p>
          <h1 class="text-xl font-bold text-white leading-snug">{{ curso.nombre }}</h1>
          <p class="text-xs text-white/60 mt-1.5">{{ curso.fechaInicio }} – {{ curso.fechaFin }}</p>
        </div>
        <span class="shrink-0 mt-1 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
          {{ curso.estado === 'activo' ? 'En curso' : 'Finalizado' }}
        </span>
      </div>

      <!-- Tabs -->
      <div class="px-6 flex border-b border-gray-100">
        <NuxtLink :to="`/instructor/cursos/${id}`"
          class="py-3 mr-6 text-sm font-semibold border-b-2 -mb-px transition"
          :class="$route.path === `/instructor/cursos/${id}` ? 'border-[#4B7BF5] text-[#4B7BF5]' : 'border-transparent text-gray-400 hover:text-gray-600'">
          Información
        </NuxtLink>
        <NuxtLink :to="`/instructor/cursos/${id}/asistencia`"
          class="py-3 mr-6 text-sm font-semibold border-b-2 -mb-px transition"
          :class="$route.path.endsWith('/asistencia') ? 'border-[#4B7BF5] text-[#4B7BF5]' : 'border-transparent text-gray-400 hover:text-gray-600'">
          Asistencia
        </NuxtLink>
        <NuxtLink :to="`/instructor/cursos/${id}/calificaciones`"
          class="py-3 text-sm font-semibold border-b-2 -mb-px transition"
          :class="$route.path.endsWith('/calificaciones') ? 'border-[#4B7BF5] text-[#4B7BF5]' : 'border-transparent text-gray-400 hover:text-gray-600'">
          Calificaciones
        </NuxtLink>
      </div>
    </div>

    <!-- Reconocimiento banner -->
    <div v-if="curso.estado === 'finalizado'"
      class="mb-6 bg-green-50 border border-green-200 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold text-green-800">Reconocimiento como instructor disponible</p>
          <p class="text-xs text-green-600 mt-0.5">Descarga tu constancia de participación como facilitador de este curso.</p>
        </div>
      </div>
      <button @click="descargarReconocimiento"
        class="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
        style="background:linear-gradient(135deg,#3ECFB2,#2fbfa3)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Descargar reconocimiento
      </button>
    </div>

    <!-- Info grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Detalles del curso -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span class="w-1 h-4 rounded-full" style="background:linear-gradient(180deg,#2B4EF0,#4B7BF5)"></span>
          Detalles del curso
        </h2>
        <div class="space-y-1">
          <p class="text-xs text-gray-400 mb-2 leading-relaxed">{{ curso.descripcion }}</p>
          <div class="border-t border-gray-50 pt-3 space-y-2.5">
            <div v-for="([label, value]) in [
              ['Modalidad',  curso.modalidad],
              ['Aula',       curso.aula],
              ['Horario',    curso.horario],
              ['Duración',   curso.duracion],
              ['Inicio',     curso.fechaInicio],
              ['Fin',        curso.fechaFin],
            ]" :key="label" class="flex items-center justify-between text-xs">
              <span class="text-gray-400">{{ label }}</span>
              <span v-if="label === 'Modalidad'" :class="['font-semibold px-2 py-0.5 rounded-full text-[10px]', modalidadBadge[value as string] ?? 'bg-gray-100 text-gray-600']">{{ value }}</span>
              <span v-else class="font-semibold text-gray-700">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Alumnos inscritos -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span class="w-1 h-4 rounded-full" style="background:linear-gradient(180deg,#3ECFB2,#2fbfa3)"></span>
          Alumnos inscritos ({{ curso.inscritos.length }})
        </h2>
        <div class="space-y-2">
          <div v-for="a in curso.inscritos" :key="a.id"
            class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style="background:linear-gradient(135deg,#4B7BF5,#2B4EF0)">
              {{ initiales(a.nombre) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ a.nombre }}</p>
              <p class="text-xs text-gray-400">{{ a.email }}</p>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 shrink-0">{{ a.departamento }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div v-else class="flex flex-col items-center justify-center py-20 text-center">
    <p class="text-sm font-semibold text-gray-400">Curso no encontrado</p>
    <NuxtLink to="/instructor" class="mt-3 text-xs text-[#4B7BF5] hover:underline">← Volver</NuxtLink>
  </div>
</template>
