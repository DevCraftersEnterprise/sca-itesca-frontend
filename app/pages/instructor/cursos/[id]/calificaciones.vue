<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })

import type { Calificacion } from '~/composables/useInstructorCursos'

const route = useRoute()
const id    = Number(route.params.id)
const { cursosInstructor, sesiones, calificaciones } = useInstructorCursos()

const curso = computed(() => cursosInstructor.find(c => c.id === id))

// Porcentaje de asistencia por alumno
const porcentajeAsistencia = (alumnoId: number): number => {
  const sess = sesiones.value[id] ?? []
  if (!sess.length) return 0
  const presentes = sess.filter(s => s.asistencias[alumnoId] === 'asistencia').length
  return Math.round((presentes / sess.length) * 100)
}

// Calificación actual para un alumno
const calAlumno = (alumnoId: number): Calificacion | null =>
  (calificaciones.value[id] ?? {})[alumnoId] ?? null

// Asignar calificación
const asignar = (alumnoId: number, cal: Calificacion | null) => {
  const cpy = structuredClone(calificaciones.value)
  if (!cpy[id]) cpy[id] = {}
  cpy[id][alumnoId] = cal
  calificaciones.value = cpy
}

// Estadísticas
const stats = computed(() => {
  if (!curso.value) return { aprobados: 0, reprobados: 0, pendientes: 0 }
  const cals = Object.values(calificaciones.value[id] ?? {})
  return {
    aprobados:  cals.filter(v => v === 'aprobado').length,
    reprobados: cals.filter(v => v === 'reprobado').length,
    pendientes: curso.value.inscritos.length - cals.filter(v => v !== null).length,
  }
})

const initiales = (nombre: string) => nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

// Generar constancia individual (mock — reemplazar por llamada real a API/PDF)
const generarConstancia = (alumnoId: number) => {
  if (!curso.value) return
  const alumno = curso.value.inscritos.find(a => a.id === alumnoId)
  if (!alumno) return
  const lines = [
    'INSTITUTO TECNOLÓGICO SUPERIOR DE CAJEME',
    'CONSTANCIA DE PARTICIPACIÓN',
    '',
    `Nombre:       ${alumno.nombre}`,
    `Departamento: ${alumno.departamento}`,
    `Correo:       ${alumno.email}`,
    '',
    `Curso:        ${curso.value.nombre}`,
    `Modalidad:    ${curso.value.modalidad}`,
    `Aula:         ${curso.value.aula}`,
    `Horario:      ${curso.value.horario}`,
    `Duración:     ${curso.value.duracion}`,
    `Período:      ${curso.value.fechaInicio} – ${curso.value.fechaFin}`,
    '',
    `Asistencia:   ${porcentajeAsistencia(alumnoId)}%`,
    `Resultado:    Aprobado`,
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `constancia_${alumno.nombre.replace(/\s+/g, '_')}_${curso.value.nombre.replace(/\s+/g, '_')}.txt`,
  })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Descargar constancias de todos los aprobados en un ZIP simulado (CSV por ahora)
const descargarTodas = () => {
  if (!curso.value) return
  const aprobados = curso.value.inscritos.filter(a => calAlumno(a.id) === 'aprobado')
  if (!aprobados.length) return
  const rows = [['Nombre', 'Departamento', 'Correo', 'Asistencia %', 'Resultado'],
    ...aprobados.map(a => [a.nombre, a.departamento, a.email, `${porcentajeAsistencia(a.id)}%`, 'Aprobado'])]
  const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a   = Object.assign(document.createElement('a'), {
    href: url,
    download: `constancias_${curso.value.nombre.replace(/\s+/g, '_')}.csv`,
  })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div v-if="curso">

    <!-- Back -->
    <NuxtLink to="/instructor" class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition group">
      <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Cursos impartidos
    </NuxtLink>

    <!-- Header + tabs -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <div class="px-6 py-4 flex items-center justify-between gap-4"
        :style="curso.estado === 'activo' ? 'background:linear-gradient(135deg,#2B4EF0,#4B7BF5)' : 'background:linear-gradient(135deg,#4b5563,#6b7280)'">
        <div>
          <h1 class="text-base font-bold text-white">{{ curso.nombre }}</h1>
          <p class="text-xs text-white/60 mt-0.5">{{ curso.aula }} · {{ curso.horario }}</p>
        </div>
        <span class="shrink-0 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
          {{ curso.estado === 'activo' ? 'En curso' : 'Finalizado' }}
        </span>
      </div>
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

    <!-- Estadísticas -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ stats.aprobados }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Aprobados</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-red-500">{{ stats.reprobados }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Reprobados</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
        <p class="text-2xl font-bold text-gray-400">{{ stats.pendientes }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Pendientes</p>
      </div>
    </div>

    <!-- Tabla de alumnos -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-bold text-gray-800">Evaluación de alumnos</h2>
          <p class="text-xs text-gray-400 mt-0.5">
            Asistencia calculada de {{ (sesiones[id] ?? []).length }} sesión{{ (sesiones[id] ?? []).length !== 1 ? 'es' : '' }} registrada{{ (sesiones[id] ?? []).length !== 1 ? 's' : '' }}.
          </p>
        </div>
        <button v-if="stats.aprobados > 0" @click="descargarTodas"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:brightness-110 transition"
          style="background:linear-gradient(135deg,#3ECFB2,#2fbfa3)">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Descargar todas las constancias ({{ stats.aprobados }})
        </button>
      </div>

      <div class="divide-y divide-gray-50">
        <div v-for="alumno in curso.inscritos" :key="alumno.id"
          class="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition">

          <!-- Alumno -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style="background:linear-gradient(135deg,#4B7BF5,#2B4EF0)">
              {{ initiales(alumno.nombre) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ alumno.nombre }}</p>
              <p class="text-xs text-gray-400">{{ alumno.departamento }}</p>
            </div>
          </div>

          <!-- % Asistencia -->
          <div class="sm:w-36 shrink-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[11px] text-gray-400">Asistencia</span>
              <span class="text-[11px] font-bold" :class="porcentajeAsistencia(alumno.id) >= 80 ? 'text-green-600' : porcentajeAsistencia(alumno.id) >= 60 ? 'text-yellow-600' : 'text-red-500'">
                {{ porcentajeAsistencia(alumno.id) }}%
              </span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: `${porcentajeAsistencia(alumno.id)}%`,
                  background: porcentajeAsistencia(alumno.id) >= 80 ? '#22c55e' : porcentajeAsistencia(alumno.id) >= 60 ? '#f59e0b' : '#ef4444'
                }"></div>
            </div>
          </div>

          <!-- Calificación actual + acciones -->
          <div class="flex items-center gap-2 sm:ml-2 shrink-0">
            <!-- Estado chip si ya está asignado -->
            <span v-if="calAlumno(alumno.id) === 'aprobado'"
              class="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
              ✓ Aprobado
            </span>
            <span v-else-if="calAlumno(alumno.id) === 'reprobado'"
              class="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-600">
              ✗ Reprobado
            </span>
            <span v-else class="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-400">
              Por asignar
            </span>

            <!-- Botones de calificación o constancia -->
            <template v-if="calAlumno(alumno.id) === null">
              <button @click="asignar(alumno.id, 'aprobado')"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:brightness-110 transition"
                style="background:linear-gradient(135deg,#3ECFB2,#2fbfa3)">
                Aprobar
              </button>
              <button @click="asignar(alumno.id, 'reprobado')"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition">
                Reprobar
              </button>
            </template>
            <template v-else>
              <!-- Constancia si está aprobado -->
              <button v-if="calAlumno(alumno.id) === 'aprobado'" @click="generarConstancia(alumno.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:brightness-110 transition"
                style="background:linear-gradient(135deg,#4B7BF5,#2B4EF0)">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                Constancia
              </button>
              <button @click="asignar(alumno.id, null)"
                class="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border border-gray-200 text-gray-400 hover:bg-gray-50 transition">
                Cambiar
              </button>
            </template>
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
