<script setup lang="ts">
definePageMeta({ layout: 'instructor', middleware: ['instructor'] })

import type { TipoAsistencia } from '~/composables/useInstructorCursos'

const route = useRoute()
const id    = Number(route.params.id)
const { cursosInstructor, sesiones } = useInstructorCursos()

const curso        = computed(() => cursosInstructor.find(c => c.id === id))
const misSesiones  = computed(() => sesiones.value[id] ?? [])

// Sesión activa — por defecto la última
const sesionActiva = ref<string | null>(null)
watchEffect(() => {
  if (!sesionActiva.value && misSesiones.value.length > 0)
    sesionActiva.value = misSesiones.value[misSesiones.value.length - 1].id
})
const sesion = computed(() => misSesiones.value.find(s => s.id === sesionActiva.value) ?? null)

// Resumen de la sesión activa
const resumen = computed(() => {
  if (!sesion.value) return { presentes: 0, ausentes: 0, justificadas: 0 }
  const vals = Object.values(sesion.value.asistencias)
  return {
    presentes:    vals.filter(v => v === 'asistencia').length,
    ausentes:     vals.filter(v => v === 'inasistencia').length,
    justificadas: vals.filter(v => v === 'justificada').length,
  }
})

// Cambiar estado de asistencia de un alumno
const setEstado = (alumnoId: number, estado: TipoAsistencia) => {
  const cpy = structuredClone(sesiones.value)
  const idx = (cpy[id] ?? []).findIndex(s => s.id === sesionActiva.value)
  if (idx === -1) return
  cpy[id][idx].asistencias[alumnoId] = estado
  sesiones.value = cpy
}

// Nueva sesión
const pickFecha    = ref(false)
const nuevaFecha   = ref(new Date().toISOString().slice(0, 10))
const agregarSesion = () => {
  const fid = nuevaFecha.value
  if (misSesiones.value.find(s => s.id === fid)) { pickFecha.value = false; sesionActiva.value = fid; return }
  const d = new Date(fid + 'T12:00:00')
  const label = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  const asistenciasDefault: Record<number, TipoAsistencia> = {}
  curso.value?.inscritos.forEach(i => { asistenciasDefault[i.id] = 'asistencia' })
  const cpy = structuredClone(sesiones.value)
  if (!cpy[id]) cpy[id] = []
  cpy[id] = [...cpy[id], { id: fid, fecha: label, asistencias: asistenciasDefault }]
  sesiones.value = cpy
  sesionActiva.value = fid
  pickFecha.value = false
}

// Exportar CSV
const exportar = () => {
  if (!curso.value) return
  const rows = [['Nombre', 'Departamento', ...misSesiones.value.map(s => s.fecha)]]
  for (const a of curso.value.inscritos)
    rows.push([a.nombre, a.departamento, ...misSesiones.value.map(s => s.asistencias[a.id] ?? '—')])
  const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a   = Object.assign(document.createElement('a'), { href: url, download: `asistencia_${curso.value.nombre.replace(/\s+/g, '_')}.csv` })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helpers
const initiales = (nombre: string) => nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

const estadoCfg: Record<TipoAsistencia, { label: string; activeClass: string; inactiveClass: string }> = {
  asistencia:   { label: 'Asistencia',   activeClass: 'bg-green-500 text-white border-green-500',   inactiveClass: 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600' },
  inasistencia: { label: 'Inasistencia', activeClass: 'bg-red-500 text-white border-red-500',       inactiveClass: 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'   },
  justificada:  { label: 'Justificada',  activeClass: 'bg-yellow-400 text-yellow-900 border-yellow-400', inactiveClass: 'border-gray-200 text-gray-500 hover:border-yellow-300 hover:text-yellow-600' },
}

const countEnSesion = (s: typeof misSesiones.value[number]) => {
  const vals = Object.values(s.asistencias)
  return vals.filter(v => v === 'asistencia').length
}
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

    <!-- ── Barra superior: selector de sesiones + acciones ── -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <!-- Chips de sesiones -->
      <button v-for="s in misSesiones" :key="s.id"
        @click="sesionActiva = s.id"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
        :class="sesionActiva === s.id
          ? 'bg-[#4B7BF5] text-white border-[#4B7BF5] shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-[#4B7BF5] hover:text-[#4B7BF5]'">
        {{ s.fecha }}
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          :class="sesionActiva === s.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'">
          {{ countEnSesion(s) }}/{{ curso.inscritos.length }}
        </span>
      </button>

      <div class="flex-1"></div>

      <!-- Nueva sesión -->
      <div class="relative">
        <button @click="pickFecha = !pickFecha"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-[#4B7BF5] hover:text-[#4B7BF5] transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva sesión
        </button>
        <!-- Date picker dropdown -->
        <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-100" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
          <div v-if="pickFecha" class="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-10 w-64">
            <p class="text-xs font-semibold text-gray-500 mb-2">Fecha de la sesión</p>
            <input v-model="nuevaFecha" type="date"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4B7BF5] mb-3"/>
            <div class="flex gap-2">
              <button @click="pickFecha = false" class="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
              <button @click="agregarSesion" class="flex-1 py-2 rounded-xl text-xs font-semibold text-white hover:brightness-110 transition" style="background:linear-gradient(135deg,#2B4EF0,#4B7BF5)">Agregar</button>
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
    <div v-if="sesion" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      <!-- Header de la sesión -->
      <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p class="text-xs text-gray-400 mb-0.5">Lista de asistencia</p>
          <h2 class="text-base font-bold text-gray-900">Sesión del {{ sesion.fecha }}</h2>
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
        <div v-for="alumno in curso.inscritos" :key="alumno.id"
          class="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-gray-50/50 transition">

          <!-- Alumno info -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
              style="background:linear-gradient(135deg,#4B7BF5,#2B4EF0)">
              {{ initiales(alumno.nombre) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ alumno.nombre }}</p>
              <p class="text-xs text-gray-400">{{ alumno.departamento }} · {{ alumno.email }}</p>
            </div>
          </div>

          <!-- Botones de estado -->
          <div class="flex gap-2 sm:ml-4">
            <button v-for="(cfg, estado) in estadoCfg" :key="estado"
              @click="setEstado(alumno.id, estado as TipoAsistencia)"
              class="px-3 py-2 rounded-xl text-xs font-semibold border transition"
              :class="sesion.asistencias[alumno.id] === estado ? cfg.activeClass : cfg.inactiveClass">
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

  <div v-else class="flex flex-col items-center justify-center py-20 text-center">
    <p class="text-sm font-semibold text-gray-400">Curso no encontrado</p>
    <NuxtLink to="/instructor" class="mt-3 text-xs text-[#4B7BF5] hover:underline">← Volver</NuxtLink>
  </div>
</template>
