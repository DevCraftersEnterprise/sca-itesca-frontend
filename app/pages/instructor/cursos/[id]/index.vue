<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })
const { user } = useAuth()
import { useCursoDetalle } from '~/composables/useCursoDetalle'
const { curso, cargarCurso } = useCursoDetalle()
const route = useRoute()
const cursoId = Number(route.params.id)
// Cargar datos del curso al montar el componente
await useAsyncData(`curso-${cursoId}`, async () => {
  await cargarCurso(cursoId)
  return true
})
// Configuraciones para badges y estados
const modalidadBadge: Record<string, string> = {
  PRESENCIAL: 'bg-green-100 text-green-700',
  ONLINE:     'bg-blue-100 text-blue-600',
  Híbrido:    'bg-purple-100 text-purple-600',
}
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
  if (!estado) return { label: 'Cargando...', color: '#9ca3af' }
  return estadosConfig[estado] || { label: 'Desconocido', color: '#9ca3af' }
})
// Función para descargar reconocimiento como instructor
const descargarReconocimiento = async () => {
  if (!curso.value) return
  if (!curso.value.reconocimiento) {
    alert('No hay reconocimiento disponible para este curso.')
    return
  }
  const nombreCurso = curso.value.nombre || 'Reconocimiento';
  const url = curso.value.reconocimiento
  try{
    const response = await fetch(url);
    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.setAttribute(
      'download', 
      `Reconocimiento_${nombreCurso.replace(/ /g, '_')}_${user.value.nombres.replace(/ /g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);
  } catch(error) {
    alert('Error al descargar constancia');
    window.open(url, '_blank');
  }
}
// Función para formatear fechas
const formatDate = (date: string | Date) => {
  if (!date) return 'Sin fecha';
  const dateStr = date.toString();
  const fechaParte = dateStr.split(/T| /)[0];
  if (!fechaParte) return 'Fecha inválida';
  const [year, month, day] = fechaParte.split('-');
  if (!year || !month || !day) return 'Formato inválido';
  return `${day}/${month}/${year}`;
}
// Función para obtener iniciales de un nombre
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
// Computed para ordenar empleados por apellido
const empleadosOrdenados = computed(() => {
  if (!curso.value?.empleados) return []

  return [...curso.value.empleados].sort((a, b) => {
    const apellidoA = a.usuario.apellidos || ''
    const apellidoB = b.usuario.apellidos || ''
    
    return apellidoA.localeCompare(apellidoB, 'es', { sensitivity: 'base' })
  })
})
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
        :style="`background: ${configEstado.color}`">
        <div class="min-w-0">
          <p class="text-xs text-white/70 mb-0.5">Curso interno · {{ curso?.empleados?.length || 0 }} alumnos inscritos</p>
          <h1 class="text-xl font-bold text-white leading-snug">{{ curso?.nombre }}</h1>
          <p class="text-xs text-white/60 mt-1.5">{{ formatDate(curso?.fechaInicio) }} – {{ formatDate(curso?.fechaFin) }}</p>
        </div>
        <span class="shrink-0 mt-1 text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white">
          {{ configEstado.label }}
        </span>
      </div>

      <!-- Tabs -->
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

    <!-- Reconocimiento banner -->
    <div v-if="curso?.estado === 'FINALIZADO' && curso?.reconocimiento"
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
          <p class="text-xs text-gray-400 mb-2 leading-relaxed">{{ curso?.descripcion }}</p>
          <div class="border-t border-gray-50 pt-3 space-y-2.5">
            <div v-for="([label, value]) in [
                ['Modalidad',  curso?.modalidad],
                ['Aula',       curso?.aula],
                ['Horario',    curso?.horaInicio && curso?.horaFin ? `Lun - Vie ${curso?.horaInicio} - ${curso?.horaFin}` : '—'],
                ['Duración',   curso?.duracionHrs ? `${curso?.duracionHrs} hrs` : '—'],
                ['Inicio',     formatDate(curso?.fechaInicio)],
                ['Fin',        formatDate(curso?.fechaFin)],
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
          Alumnos inscritos ({{ curso?.empleados?.length }})
        </h2>
        <div class="space-y-2">
          <div v-for="a in empleadosOrdenados" :key="a.id"
            class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style="background:linear-gradient(135deg,#4B7BF5,#2B4EF0)">
              {{ initiales(a?.usuario?.apellidos+ ' ' + a?.usuario?.nombres) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ a?.usuario?.apellidos }} {{ a?.usuario?.nombres }}</p>
              <p class="text-xs text-gray-400">{{ a?.usuario?.correo }}</p>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 shrink-0">{{ a?.usuario?.adscripcion?.clave }}</span>
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
