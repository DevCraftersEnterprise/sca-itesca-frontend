<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const { user } = useAuth()
import { useCursoDetalle } from '~/composables/useCursoDetalle'
const { curso, cargarCurso, cargando } = useCursoDetalle()

const route = useRoute()
const cursoId = Number(route.params.id)
await useAsyncData(`curso-${cursoId}`, async () => {
  await cargarCurso(cursoId)
  return true
})
// Helpers visuales
const modalidadBadge: Record<any, string> = {
  ONLINE:     'bg-blue-50 text-blue-600 border border-blue-100',
  PRESENCIAL: 'bg-green-50 text-green-600 border border-green-100',
  Híbrido:    'bg-purple-50 text-purple-600 border border-purple-100',
}
const rolBadge: Record<string, string> = {
  ADMIN: 'bg-blue-100 text-[#4B7BF5]',
  EMPLEADO: 'bg-green-100 text-green-700',
  INSTRUCTOR: 'bg-orange-100 text-orange-600',
}
const rolLabel: Record<string, string> = {
  ADMIN: 'Admin', EMPLEADO: 'Empleado', INSTRUCTOR: 'Instructor',
}
const iniciales = (nombre: string, apellido: string) =>
  `${nombre[0]}${apellido[0]}`.toUpperCase()

const avatarColor = (id: number) => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-teal-400 to-teal-600',
    'from-purple-400 to-purple-600',
    'from-orange-400 to-orange-500',
    'from-pink-400 to-pink-600',
  ]
  return colors[id % colors.length]
}

const formatDate = (date: string | Date) => {
  if (!date) return 'Sin fecha';
  const dateStr = date.toString();
  const fechaParte = dateStr.split(/T| /)[0];
  if (!fechaParte) return 'Fecha inválida';
  const [year, month, day] = fechaParte.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  if (!year || !month || !day) return 'Formato inválido';
  return `${day} ${meses[Number(month) - 1]} ${year}`;
};
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

const completados  = computed(() => curso.value?.empleados?.filter((u : any) => u?.estado === 'VALIDADO').length)
const enProgreso   = computed(() => curso.value?.empleados?.filter((u : any) => u?.estado === 'POR_VALIDAR').length)
const noinscrit    = computed(() => curso.value?.empleados?.filter((u : any) => u?.estado === null).length + enProgreso.value)
const faltantes    = computed(() => (curso?.value?.capacidad) - curso.value?.empleados?.length || 0)
const porcentaje   = computed(() =>
  curso.value ? Math.round((curso.value?.empleados?.length / curso.value?.capacidad) * 100) : 0
)

const sinDocumento = computed(() => curso.value?.empleados?.filter((u : any) => u?.estado === null).length || 0 )
const pendientesDoc    = computed(() => curso.value?.empleados?.filter((u : any) => u?.estado === 'POR_VALIDAR').length || 0 )
const validadosDoc     = computed(() => curso.value?.empleados?.filter((u : any) => u?.estado === 'VALIDADO').length || 0 )


type DocEstado = 'sin_documento' | 'pendiente' | 'validado'


// Estado reactivo para constancias y documentos (simula cambios sin API)
const constanciasEmitidas = reactive<Record<number, boolean>>({})
const docEstados = reactive<Record<number, DocEstado>>({})



// Acciones internas
const emitirConstancia = (userId: number) => {
  // TODO: llamada a API para generar PDF
  constanciasEmitidas[userId] = true
}
const verConstancia = (userId: number) => {
  // TODO: abrir URL del PDF
  console.log('Ver constancia usuario', userId)
}

// Acciones externas (admin)
const validarDocumento = (userId: number) => {
  docEstados[userId] = 'validado'
}
const rechazarDocumento = (userId: number) => {
  docEstados[userId] = 'sin_documento'
}
const verDocumento = (userId: number) => {
  console.log('Ver documento usuario', userId)
}



// Tab activa
const tab = ref<'informacion' | 'inscritos'>('informacion')

// Búsqueda en inscritos
const busqueda = ref('')



</script>

<template>
  <div v-if="curso">

    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs text-gray-400 mb-5">
      <NuxtLink to="/admin" class="hover:text-[#4B7BF5] transition">Dashboard</NuxtLink>
      <span>/</span>
      <span class="text-gray-500 font-medium truncate">{{ curso?.nombre }}</span>
    </div>

    <!-- Header del curso -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-start gap-4">

        <!-- Ícono -->
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          :style="curso?.tipo === 'INTERNO' ? 'background: linear-gradient(135deg, #2B4EF0, #4B7BF5)' : 'background: linear-gradient(135deg, #FF8B5E, #F5C242)'">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>

        <!-- Nombre y badges -->
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 class="text-xl font-bold text-gray-900">{{ curso?.nombre }}</h1>
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', curso?.tipo === 'INTERNO' ? 'bg-blue-100 text-[#4B7BF5]' : 'bg-orange-100 text-orange-600']">
              {{ curso?.tipo === 'INTERNO' ? 'Interno' : 'Externo' }}
            </span>
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1', `background: ${configEstado.color}`]">
              <span :class="['w-1.5 h-1.5 rounded-full inline-block', `background: ${configEstado.color}`]"></span>
              {{ configEstado.label }}
            </span>
          </div>
          <p class="text-sm text-gray-400">{{ curso?.descripcion }}</p>
        </div>

        <!-- Stats rápidos (desktop) -->
        <div class="hidden sm:flex gap-6 flex-shrink-0 text-center">
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ curso?.empleados?.length }}</p>
            <p class="text-xs text-gray-400">Inscritos</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600">{{ completados }}</p>
            <p class="text-xs text-gray-400">Completados</p>
          </div>
          <div>
            <p class="text-2xl font-bold" style="color:#4B7BF5">{{ enProgreso }}</p>
            <p class="text-xs text-gray-400">En progreso</p>
          </div>
        </div>
      </div>

      <!-- Barra de ocupación -->
      <div class="mt-5 pt-4 border-t border-gray-100">
        <div class="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Ocupación</span>
          <span class="font-semibold text-gray-600">{{ curso?.empleados?.length || 0 }} / {{ curso?.capacidad || 0 }} · {{ porcentaje }}%</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500"
            :style="{ width: `${porcentaje}%`, background: curso?.tipo === 'INTERNO' ? 'linear-gradient(90deg, #2B4EF0, #5B9CF8)' : 'linear-gradient(90deg, #FF8B5E, #F5C242)' }">
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
      <button
        @click="tab = 'informacion'"
        :class="['flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
          tab === 'informacion' ? 'bg-white text-[#4B7BF5] shadow-sm' : 'text-gray-400 hover:text-gray-600']">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Información
      </button>
      <button
        @click="tab = 'inscritos'"
        :class="['flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
          tab === 'inscritos' ? 'bg-white text-[#4B7BF5] shadow-sm' : 'text-gray-400 hover:text-gray-600']">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Inscritos
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          :class="tab === 'inscritos' ? 'bg-blue-50 text-[#4B7BF5]' : 'bg-gray-200 text-gray-400'">
          {{ curso?.empleados?.length || 0 }}
        </span>
      </button>
    </div>

    <!-- ══ TAB: INFORMACIÓN ══ -->
    <div v-if="tab === 'informacion'" class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <!-- Col izquierda: detalles -->
      <div class="lg:col-span-2 space-y-5">

        <!-- Datos generales -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background:#EEF2FF">
              <svg class="w-3.5 h-3.5" style="color:#4B7BF5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            Datos generales
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-if="curso.tipo !== 'EXTERNO'" class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400">Instructor</span>
              <span class="text-sm font-semibold text-gray-800">{{ curso.instructor.nombres }} {{ curso.instructor.apellidos }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400">Modalidad</span>
              <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full w-fit', modalidadBadge[curso.modalidad]]">{{ curso.modalidad }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400">Duración</span>
              <span class="text-sm font-semibold text-gray-800">{{ curso.duracionHrs }} horas</span>
            </div>
            <div v-if="curso.tipo === 'INTERNO' " class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400">Aula</span>
              <span class="text-sm font-semibold text-gray-800">{{ curso.aula }}</span>
            </div>
            <div v-if="curso.tipo === 'EXTERNO'" class="flex flex-col gap-0.5 sm:col-span-2">
              <span class="text-xs text-gray-400">Sitio externo</span>
              <a :href="curso.aula" target="_blank" rel="noopener noreferrer"
                class="text-sm font-semibold text-[#4B7BF5] hover:underline break-all">{{ curso.aula }}</a>
            </div>
          </div>
        </div>

        <!-- Fechas y horario -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background:#F0FDF4">
              <svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            Fechas y horario
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400">Inicio</span>
              <span class="text-sm font-semibold text-gray-800">{{ formatDate(curso?.fechaInicio) }}</span>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400">Fin</span>
              <span class="text-sm font-semibold text-gray-800">{{ formatDate(curso?.fechaFin) }}</span>
            </div>
            <div v-if="curso?.horaInicio" class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400">Hora inicio</span>
              <span class="text-sm font-semibold text-gray-800">{{ curso?.horaInicio }}</span>
            </div>
            <div v-if="curso?.horaFin" class="flex flex-col gap-0.5">
              <span class="text-xs text-gray-400">Hora fin</span>
              <span class="text-sm font-semibold text-gray-800">{{ curso?.horaFin }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Col derecha: adscripciones + capacidad -->
      <div class="space-y-5">

        <!-- Capacidad -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center" style="background:#EEF2FF">
              <svg class="w-3.5 h-3.5" style="color:#4B7BF5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            Participantes
          </h2>
          <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="text-center p-3 rounded-xl bg-gray-50">
              <p class="text-xl font-bold text-gray-900">{{ curso?.empleados?.length || 0 }}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">Inscritos</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-green-50">
              <p class="text-xl font-bold text-green-600">{{ completados }}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">Completados</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-blue-50">
              <p class="text-xl font-bold" style="color:#4B7BF5">{{ enProgreso }}</p>
              <p class="text-[10px] text-gray-400 mt-0.5">En progreso</p>
            </div>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
            <div class="h-full rounded-full"
              :style="{ width: `${porcentaje}%`, background: 'linear-gradient(90deg, #2B4EF0, #5B9CF8)' }">
            </div>
          </div>
          <p class="text-xs text-gray-400 text-right">{{ porcentaje }}% de {{ curso?.capacidad || 0 }} lugares</p>
        </div>

        <!-- Adscripciones -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-50">
              <svg class="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            Adscripciones
          </h2>
          <div class="flex flex-wrap gap-2">
            <span v-for="dep in curso?.adscripciones" :key="dep"
              class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600">
              {{ dep?.adscripcion?.clave }}
            </span>
          </div>
        </div>

      </div>
    </div>

    <!-- ══ TAB: INSCRITOS ══ -->
    <div v-else>

      <!-- Barra búsqueda + stats -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="busqueda" type="text" placeholder="Buscar por nombre, correo o adscripción..."
            class="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition shadow-sm"/>
        </div>

        <!-- Stats internos -->
        <template v-if="curso?.tipo === 'INTERNO'">
          <div class="flex gap-2 flex-shrink-0">
            <div class="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-green-50 text-green-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              {{ completados }} completados
            </div>
            <div class="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50" style="color:#4B7BF5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {{ enProgreso }} en progreso
            </div>
          </div>
        </template>

        <!-- Stats externos -->
        <template v-else>
          <div class="flex gap-2 flex-shrink-0 flex-wrap">
            <div class="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-500">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              {{ sinDocumento }} sin doc
            </div>
            <div class="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-yellow-50 text-yellow-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {{ pendientesDoc }} por validar
            </div>
            <div class="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-green-50 text-green-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              {{ validadosDoc }} validados
            </div>
          </div>
        </template>
      </div>

      <!-- Tabla desktop -->
      <div class="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Empleado</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Adscripción</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
              <!-- Columna contextual según tipo -->
              <th class="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {{ curso.tipo === 'INTERNO' ? 'Constancia' : 'Documento' }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="u in curso?.empleados" :key="u.id" class="hover:bg-gray-50 transition">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div :class="['w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br', avatarColor(u.id)]">
                    {{ iniciales(u?.usuario?.nombres, u?.usuario?.apellidos) }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ u?.usuario?.nombres }} {{ u?.usuario?.apellidos }}</p>
                    <p class="text-xs text-gray-400">{{ u?.usuario?.correo }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-sm text-gray-600">{{ u?.usuario?.adscripcion?.clave }}</td>
              <td class="px-5 py-4">
                <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', rolBadge[u?.usuario?.rol]]">{{ rolLabel[u?.usuario?.rol] }}</span>
              </td>
              <td class="px-5 py-4">
                <span :class="[
                  'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                  !u?.estado ? 'bg-blue-100 text-blue-700' 
                    : u.estado === 'VALIDADO' 
                      ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                ]">
                  <span :class="[
                    'w-1.5 h-1.5 rounded-full',
                    !u?.estado ? 'bg-blue-500' 
                      : u.estado === 'VALIDADO' 
                        ? 'bg-green-500' : 'bg-yellow-500'
                  ]"></span>
                  {{ 
                    !u?.estado ? 'Inscrito' 
                      : u.estado === 'VALIDADO' 
                        ? 'Completado' : 'En progreso' 
                  }}
                </span>
              </td>
              <td class="px-5 py-4 text-sm text-gray-500">{{ formatDate(u?.fechaSubida) || 'Sin fecha' }}</td>

              <!-- ── Columna CONSTANCIA (interno) ── -->
              <td v-if="curso?.tipo === 'INTERNO'" class="px-5 py-4">
                <template v-if="u?.calificacion !== 'REPROBADO'">
                  <span class="text-xs text-gray-300 font-medium">—</span>
                </template>
                <template v-else-if="u?.constancia">
                  <button @click="verConstancia(u.id)"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-[#4B7BF5] hover:bg-blue-100 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    Ver constancia
                  </button>
                </template>
                <template v-else>
                  <button @click="emitirConstancia(u.id)"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:brightness-110"
                    style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Emitir constancia
                  </button>
                </template>
              </td>

              <!-- ── Columna DOCUMENTO (externo) ── -->
              <td v-else class="px-5 py-4">
                <!-- Sin documento -->
                <span v-if="!u.estado"
                  class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  Sin documento
                </span>
                <!-- Pendiente de validación -->
                <div v-else-if="u?.estado === 'POR_VALIDAR'" class="flex items-center gap-2">
                  <button @click="verDocumento(u.id)"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Ver PDF
                  </button>
                  <button @click="validarDocumento(u.id)"
                    class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    Validar
                  </button>
                  <button @click="rechazarDocumento(u.id)"
                    class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    Rechazar
                  </button>
                </div>
                <!-- Validado -->
                <div v-else class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-100 text-green-700">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    Validado
                  </span>
                  <button @click="verDocumento(u.id)"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#4B7BF5] hover:bg-blue-100 transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    Ver PDF
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!curso?.empleados?.length">
              <td colspan="6" class="px-5 py-10 text-center text-sm text-gray-400">
                No se encontraron inscritos con ese criterio
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards mobile -->
      <div class="md:hidden space-y-3">
        <div v-for="u in curso?.empleados" :key="u.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div class="flex items-center gap-3 mb-3">
            <div :class="['w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br', avatarColor(u.id)]">
              {{ iniciales(u?.usuario?.nombres, u?.usuario?.apellidos) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ u?.usuario?.nombres }} {{ u?.usuario?.apellidos }}</p>
              <p class="text-xs text-gray-400 truncate">{{ u?.usuario?.correo }}</p>
            </div>
            <span :class="[
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
              !u?.estado ? 'bg-blue-100 text-blue-700' 
                : u.estado === 'VALIDADO' 
                  ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            ]">
              <span :class="[
                'w-1.5 h-1.5 rounded-full',
                !u?.estado ? 'bg-blue-500' 
                  : u.estado === 'VALIDADO' 
                    ? 'bg-green-500' : 'bg-yellow-500'
              ]"></span>
              {{ 
                !u?.estado ? 'Inscrito' 
                  : u.estado === 'VALIDADO' 
                    ? 'Completado' : 'En progreso' 
              }}
            </span>
          </div>
          <div class="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{{ u?.usuario?.adscripcion?.clave }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(u?.fechaSubida) || 'Sin Fecha' }}</span>
            </div>
            <!-- Acciones mobile interno -->
            <template v-if="curso?.tipo === 'INTERNO'">
              <button v-if="u?.calificacion === 'APROBADO' && u?.usuario?.constancia" @click="verConstancia(u.id)"
                class="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-[#4B7BF5] flex-shrink-0">Ver constancia</button>
              <button v-else-if="u?.calificacion === 'APROBADO'  && !u?.usuario?.constancia" @click="emitirConstancia(u?.usuario?.id)"
                class="text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white flex-shrink-0"
                style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">Emitir</button>
            </template>
            <!-- Acciones mobile externo -->
            <template v-else>
              <span v-if="!u?.estado" class="text-[11px] text-black-300 font-medium flex-shrink-0">Sin doc</span>
              <div v-else-if="u?.estado === 'POR_VALIDAR'" class="flex gap-1.5 flex-shrink-0">
                <button @click="validarDocumento(u?.usuario?.id)" class="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700">✓ Validar</button>
                <button @click="rechazarDocumento(u?.usuario?.id)" class="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500">✕ Rechazar</button>
              </div>
              <span v-else class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-green-100 text-green-700 flex-shrink-0">✓ Validado</span>
            </template>
          </div>
        </div>
        <div v-if="!curso?.empleados?.length" class="text-center py-12 text-sm text-gray-400">
          No se encontraron inscritos
        </div>
      </div>

      <!-- Faltantes -->
      <div v-if="faltantes > 0 && curso?.estado === 'POR_INSCRIBIR'" class="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-white border border-dashed border-gray-200 rounded-xl px-4 py-3">
        <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
        </svg>
        <span>Quedan <strong class="text-gray-600">{{ faltantes }}</strong> lugares disponibles de {{ curso?.capacidad }}</span>
      </div>

    </div>

  </div>

  <!-- Curso no encontrado -->
  <div v-else class="flex flex-col items-center justify-center py-24 text-center">
    <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
      <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <p class="text-sm font-semibold text-gray-400">Curso no encontrado</p>
    <NuxtLink to="/admin" class="mt-3 text-xs text-[#4B7BF5] hover:underline">Volver al dashboard</NuxtLink>
  </div>
</template>
