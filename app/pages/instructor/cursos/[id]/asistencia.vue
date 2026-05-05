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
  await cargarCurso(cursoId)
})
// Configuración de estados
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
const estadoCfg: Record<any, { label: string; activeClass: string; inactiveClass: string }> = {
  ASISTENCIA:   { label: 'Asistencia',   activeClass: 'bg-green-500 text-white border-green-500',   inactiveClass: 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600' },
  FALTA: { label: 'Inasistencia', activeClass: 'bg-red-500 text-white border-red-500',       inactiveClass: 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'   },
  JUSTIFICADA:  { label: 'Justificada',  activeClass: 'bg-yellow-400 text-yellow-900 border-yellow-400', inactiveClass: 'border-gray-200 text-gray-500 hover:border-yellow-300 hover:text-yellow-600' },
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
};
// Función para obtener iniciales de un nombre
const initiales = (nombre?: string) => {
  if (!nombre) return '??'
  return nombre.split(' ').filter(p => p.length > 0).map(p => p[0]).slice(0, 2).join('').toUpperCase()
}
// Nueva sesión
const pickFecha    = ref(false)
const nuevaFecha   = ref(new Date().toISOString().slice(0, 10))
const agregarSesion = async () => {
  const fid = nuevaFecha.value
  console.log('Agregar sesión para fecha:', fid)
  try {
    const playloas = {
      cursoId: cursoId,
      fecha: fid,
      usuarioIds: Array.isArray(curso.value?.empleados) ? curso.value.empleados.map((e: any) => e.usuario.id) : []
    }
    await $fetch(`${config.public.apiBaseUrl}/instructores/asistencia-hoy`, {
      method: 'POST',
      body: playloas,
      headers: {
        'Authorization': `Bearer ${token.value}` 
      }
    })
    console.log('ANTES:', curso.value.asistencias.length)

    await cargarCurso(cursoId,true)

    console.log('DESPUÉS:', curso.value.asistencias.length)
    curso.value = { ...curso.value }

    const ultima = curso.value?.asistencias
      ?.slice()
      .sort((a: any, b: any) => b.id - a.id)[0]

    if (ultima) {
      const fecha = ultima.fecha.split('T')[0]
      sesionActiva.value = fecha
    }
    pickFecha.value = false
  } catch (error) {
    console.error('Error al agregar sesión:', error)
  }
}




// Sesión activa
const ultimoRegistroAsistencia = computed(() => {
  const todas = curso.value?.asistencias || []
  if (todas.length === 0) return null
  const ordenadas = [...todas].sort((a: any, b: any) =>
    b.id - a.id
  )
  return {
    id: ordenadas[0].id,
    fecha: ordenadas[0].fecha,
    estado: ordenadas[0].estado,
    usuarioId: ordenadas[0].usuarioId
  }
})
const sesionSeleccionadaId = ref<string | null>(null)
const sesionActiva = computed({
  get() {
    if (sesionSeleccionadaId.value) return sesionSeleccionadaId.value
    const fechas = Object.keys(asistenciasOrdenadas.value)
    return fechas[fechas.length - 1] || null
  },
  set(val: string | null) {
    sesionSeleccionadaId.value = val
  }
  
})
const sesion = computed(() => {
   if (!sesionActiva.value) return []
  return asistenciasOrdenadas.value[sesionActiva.value] || []
})

// Helpers


const asistenciasPorFecha = computed(() => {
  const asistencias = curso.value?.asistencias || []

  return asistencias.reduce((acc: Record<string, any[]>, item: any) => {
    const fecha = item.fecha.split('T')[0]

    if (!acc[fecha]) {
      acc[fecha] = []
    }

    acc[fecha].push(item)

    return acc
  }, {})
})

const asistenciasOrdenadas = computed(() => {
  return Object.keys(asistenciasPorFecha.value)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .reduce((acc: Record<string, any[]>, fecha: string) => {
      acc[fecha] = asistenciasPorFecha.value[fecha]
      return acc
    }, {})
})

// Resumen de la sesión activa
const resumen = computed(() => {
  if (!sesion.value.length) {
    return { presentes: 0, ausentes: 0, justificadas: 0 }
  }

  return {
    presentes: sesion.value.filter((v: any) => v.estado === 'ASISTENCIA').length,
    ausentes: sesion.value.filter((v: any) => v.estado === 'FALTA').length,
    justificadas: sesion.value.filter((v: any) => v.estado === 'JUSTIFICADA').length,
  }
})
const obtenerEstadoBoton = (alumnoId: number) => {
  // Buscamos en la sesión activa el estado de este alumno
  const registro = sesion.value.find((a: any) => a.usuarioId === alumnoId)
  return registro?.estado || null
}
// Cambiar estado de asistencia de un alumno
const setEstado = async (alumnoId: number, estado: any) => {
  const registro = sesion.value.find((a: any) => a.usuarioId === alumnoId)
  if (!registro) {
    console.warn('No hay registro para este alumno en esta sesión')
    return
  }
  try {
    const playloas = {
      id: registro?.id,
      cursoId: cursoId,
      usuarioId: alumnoId,
      estado: estado
    }
    await $fetch(`${config.public.apiBaseUrl}/instructores/asistencia`, {
        method: 'PATCH',
        body: playloas,
        headers: {
          'Authorization': `Bearer ${token.value}` 
        }
      })

    await cargarCurso(cursoId,true)
  } catch (error) {
    console.error('Error al cambiar estado de asistencia:', error)
  }
}



// Exportar CSV
const exportar = () => {
  
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

    <!-- Back + header shared -->
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
          {{ configEstado.label }}
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

    <!-- ── Barra superior: selector de sesiones + acciones ── -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <!-- Chips de sesiones -->
      <button v-for="(registros, fecha) in asistenciasOrdenadas" :key="fecha"
        @click="sesionActiva = fecha"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
        :class="sesionActiva === fecha
          ? 'bg-[#4B7BF5] text-white border-[#4B7BF5] shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-[#4B7BF5] hover:text-[#4B7BF5]'">
        {{ formatDate(fecha) }}
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          :class="sesionActiva === fecha ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'">
          {{ curso.asistencias.length }}/{{ curso.empleados.length }}
        </span>
      </button>

      <div class="flex-1"></div>

      <!-- Nueva sesión -->
      <div class="relative">
        <!-- Nueva sesión -->
        <button @click="pickFecha = true"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-[#4B7BF5] hover:text-[#4B7BF5] transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva sesión
        </button>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-100"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="pickFecha"
              class="fixed inset-0 z-50 flex items-center justify-center">

            <!-- Fondo oscuro -->
            <div class="absolute inset-0 bg-black/40"
                @click="pickFecha = false"></div>

            <!-- Modal -->
            <div class="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-80">

              <p class="text-sm font-semibold text-gray-700 mb-3">
                Fecha de la sesión
              </p>

              <input v-model="nuevaFecha" type="date"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4B7BF5] mb-4"/>

              <div class="flex gap-2">
                <button @click="pickFecha = false"
                  class="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">
                  Cancelar
                </button>

                <button @click="agregarSesion"
                  class="flex-1 py-2 rounded-xl text-xs font-semibold text-white hover:brightness-110 transition"
                  style="background:linear-gradient(135deg,#2B4EF0,#4B7BF5)">
                  Agregar
                </button>
              </div>

            </div>
          </div>
        </Transition>
      </div>

      <!-- Exportar -->
      <button @click="exportar"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Exportar CSV
      </button>
    </div>

    <!-- ── Sesión activa ── -->
    <div v-if="Object.keys(asistenciasOrdenadas).length > 0" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      <!-- Header de la sesión -->
      <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Lista de asistencia</p>
          <h2 v-if="sesionActiva" class="text-base font-bold text-gray-900">Sesión del {{ formatDate(sesionActiva) }}</h2>
        </div>
        <!-- Resumen rápido -->
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span class="font-semibold text-gray-700">{{ resumen.presentes }} presentes</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span class="font-semibold text-gray-700">{{ resumen.ausentes }} ausentes</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span class="font-semibold text-gray-700">{{ resumen.justificadas }} justificadas</span>
          </div>
        </div>
      </div>

      <!-- Lista de alumnos -->
      <div class="divide-y divide-gray-50">
        <div v-for="alumno in empleadosOrdenados" :key="alumno.id"
          class="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-gray-50/50 transition">

          <!-- Alumno info -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style="background:linear-gradient(135deg,#4B7BF5,#2B4EF0)">
              {{ initiales(alumno.usuario.apellidos + ' ' + alumno.usuario.nombres) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ alumno.usuario.apellidos }} {{ alumno.usuario.nombres }}</p>
              <p class="text-xs text-gray-400">{{ alumno.usuario.adscripcion.clave }} · {{ alumno.usuario.correo }}</p>
            </div>
          </div>

          <!-- Botones de estado -->
          <div class="flex gap-2 sm:ml-4">
            <button v-for="(cfg, estado) in estadoCfg" :key="estado"
              @click="setEstado(alumno.usuario.id, estado)"
              class="px-3 py-2 rounded-xl text-xs font-semibold border transition"
              :class="obtenerEstadoBoton(alumno.usuario.id) === estado ? cfg.activeClass : cfg.inactiveClass">
              {{ cfg.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sin sesiones -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <p class="text-sm font-semibold text-gray-400">Sin sesiones registradas</p>
      <p class="text-xs text-gray-300 mt-1">Agrega una sesión con el botón "Nueva sesión"</p>
    </div>

  </div>
  <!-- Curso no encontrado -->
  <div v-else class="flex flex-col items-center justify-center py-20 text-center">
    <p class="text-sm font-semibold text-gray-400">Curso no encontrado</p>
    <NuxtLink to="/instructor" class="mt-3 text-xs text-[#4B7BF5] hover:underline">← Volver</NuxtLink>
  </div>
</template>
