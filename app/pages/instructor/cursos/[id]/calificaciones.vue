<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })
import { useCursoDetalle } from '~/composables/useCursoDetalle'
const { curso, cargarCurso } = useCursoDetalle()
const { token } = useAuth()
const route = useRoute()
const config = useRuntimeConfig()
const cursoId = Number(route.params.id)
// Cargamos el curso con sus empleados y asistencias
onMounted(async () => {
  cargarCurso(cursoId)
})
const estadosConfig: Record<string, { label: string, color: string }> = {
  EN_CURSO: { 
    label: 'En curso', 
    color: 'linear-gradient(135deg, #2B4EF0, #4B7BF5)' 
  },
  FINALIZADO: { 
    label: 'Finalizado', 
    color: 'linear-gradient(135deg, #4b5563, #6b7280)' 
  },
  POR_INSCRIBIR: { 
    label: 'Por inscribir', 
    color: 'linear-gradient(135deg, #F59E0B, #D97706)'
  }
}
const configEstado = computed(() => {
  const estado = curso.value?.estado?.toUpperCase()
  return estadosConfig[estado] || { label: 'Desconocido', color: '#9ca3af' }
})
// Estadísticas
const stats = computed(() => {
  if (!curso.value) return { aprobados: 0, reprobados: 0, pendientes: 0 }
  return {
    aprobados:  curso.value?.empleados?.filter((v: any) => v.calificacion === 'APROBADO').length,
    reprobados: curso.value?.empleados?.filter((v: any) => v.calificacion === 'REPROBADO').length,
    pendientes: curso.value?.empleados?.filter((v: any) => v.calificacion === null).length,
  }
})
const initiales = (nombre: string) => {
  if (!nombre) return '??';
  return nombre
    .split(' ')
    .filter(palabra => palabra.length > 0)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
// Porcentaje de asistencia por alumno
const porcentajeAsistencia = (alumnoId: number): number => {
  if (!curso.value?.asistencias) return 0
  const asistenciasAlumno = curso.value.asistencias.filter(
    (a: any) => a.usuarioId === alumnoId
  )
  if (asistenciasAlumno.length === 0) return 100
  const puntos = asistenciasAlumno.filter(
    (a: any) => a.estado === 'ASISTENCIA' || a.estado === 'JUSTIFICADA'
  ).length
  const totalSesionesAlumno = asistenciasAlumno.length
  return Math.round((puntos / totalSesionesAlumno) * 100)
}

// Asignar calificación
const asignar = async (alumnoId: number, cal: string | null, empleadoId: number) => {
  console.log(`Asignar calificación ${cal} al alumno ${alumnoId} en curso ${cursoId} (empleadoId: ${empleadoId})`)
  
  try {
    const playloas = {
      id: empleadoId,
      cursoId: cursoId,
      usuarioId: alumnoId,
      calificacion: cal
    }
    await $fetch(`${config.public.apiBaseUrl}/instructores/calificar`, {
        method: 'PATCH',
        body: playloas,
        headers: {
          'Authorization': `Bearer ${token.value}` 
        }
    })

    await cargarCurso(cursoId,true)
  } catch (error) {
    console.error('Error al cambiar calificacion:', error)
  }
}

// Computed para ordenar empleados por apellido
const empleadosOrdenados = computed(() => {
  if (!curso.value?.empleados) return []

  return [...curso.value.empleados].sort((a, b) => {
    const apellidoA = a.usuario.apellidos || ''
    const apellidoB = b.usuario.apellidos || ''
    
    return apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' })
  })
})

// Generar constancia individual (mock — reemplazar por llamada real a API/PDF)
const generarConstancia = async (alumnoId: number, tipo: string) => {
  try {
    await $fetch(`${config.public.apiBaseUrl}/instructores/${cursoId}/${alumnoId}`, {
      method: 'GET',
      data: { tipo },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    await cargarCurso(cursoId,true)
  } catch (error) {
    
  }
}
// Descargar constancias de todos los aprobados en un ZIP simulado (CSV por ahora)
const descargarTodas = () => {
  
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
        :style="`background: ${configEstado.color}`">
        <div>
          <h1 class="text-base font-bold text-white">{{ curso.nombre }}</h1>
          <p class="text-xs text-white/60 mt-0.5">{{ curso.aula }} · Lun-Vie {{ curso.horaInicio }} - {{ curso.horaFin }}</p>
        </div>
        <span class="shrink-0 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
          {{configEstado.label }}
        </span>
      </div>
      <div class="px-6 flex border-b border-gray-100">
        <NuxtLink :to="`/instructor/cursos/${cursoId}`"
          class="py-3 mr-6 text-sm font-semibold border-b-2 -mb-px transition"
          :class="$route.path === `/instructor/cursos/${cursoId}` ? 'border-[#4B7BF5] text-[#4B7BF5]' : 'border-transparent text-gray-400 hover:text-gray-600'">
          Información
        </NuxtLink>
        <NuxtLink :to="`/instructor/cursos/${cursoId}/asistencia`"
          class="py-3 mr-6 text-sm font-semibold border-b-2 -mb-px transition"
          :class="$route.path.endsWith('/asistencia') ? 'border-[#4B7BF5] text-[#4B7BF5]' : 'border-transparent text-gray-400 hover:text-gray-600'">
          Asistencia
        </NuxtLink>
        <NuxtLink :to="`/instructor/cursos/${cursoId}/calificaciones`"
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
            Asistencia calculada de {{ (curso.asistencias?.length/curso.empleados?.length) || 0 }} sesión{{ curso.asistencias?.length !== 1 ? 'es' : '' }} registrada{{ curso.asistencias?.length !== 1 ? 's' : '' }}.
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
        <div v-for="alumno in empleadosOrdenados" :key="alumno.id"
          class="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition">

          <!-- Alumno -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style="background:linear-gradient(135deg,#4B7BF5,#2B4EF0)">
              {{ initiales(alumno.usuario.apellidos + ' ' + alumno.usuario.nombres) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ alumno.usuario.apellidos }} {{ alumno.usuario.nombres }}</p>
              <p class="text-xs text-gray-400">{{ alumno.usuario.adscripcion.clave }}</p>
            </div>
          </div>

          <!-- % Asistencia -->
          <div v-if="curso.estado !== 'POR_INSCRIBIR'" class="sm:w-36 shrink-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[11px] text-gray-400">Asistencia</span>
              <span class="text-[11px] font-bold" :class="porcentajeAsistencia(alumno.usuario.id) >= 80 ? 'text-green-600' : porcentajeAsistencia(alumno.usuario.id) >= 60 ? 'text-yellow-600' : 'text-red-500'">
                {{ porcentajeAsistencia(alumno.usuario.id) }}%
              </span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: `${porcentajeAsistencia(alumno.usuario.id)}%`,
                  background: porcentajeAsistencia(alumno.usuario.id) >= 80 ? '#22c55e' : porcentajeAsistencia(alumno.usuario.id) >= 60 ? '#f59e0b' : '#ef4444'
                }"></div>
            </div>
          </div>

          <!-- Calificación actual + acciones -->
          <div v-if="curso.estado !== 'POR_INSCRIBIR'" class="flex items-center gap-2 sm:ml-2 shrink-0">
            <!-- Estado chip si ya está asignado -->
            <span v-if="alumno.calificacion === 'APROBADO'"
              class="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
              ✓ Aprobado
            </span>
            <span v-else-if="alumno.calificacion === 'REPROBADO'"
              class="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-600">
              ✗ Reprobado
            </span>
            <span v-else class="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-400">
              Por asignar
            </span>

            <!-- Botones de calificación o constancia -->
            <template v-if="!alumno.calificacion">
              <button @click="asignar(alumno.usuario.id, 'APROBADO', alumno.id)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:brightness-110 transition"
                style="background:linear-gradient(135deg,#3ECFB2,#2fbfa3)">
                Aprobar
              </button>
              <button @click="asignar(alumno.usuario.id, 'REPROBADO', alumno.id)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition">
                Reprobar
              </button>
            </template>
            <template v-else>
              <!-- Constancia si está aprobado -->
              <button v-if="alumno.calificacion === 'APROBADO'" @click="generarConstancia(alumno.usuario.id, 'constancia')"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:brightness-110 transition"
                style="background:linear-gradient(135deg,#4B7BF5,#2B4EF0)">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
                Constancia
              </button>
              <button v-if="!alumno.constancia" @click="asignar(alumno.usuario.id, null, alumno.id)"
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
