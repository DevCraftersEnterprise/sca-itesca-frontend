<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })

const vista = ref<'cursos' | 'usuarios'>('cursos')

type Modalidad = 'Online' | 'Presencial' | 'Híbrido'
type TipoCurso = 'interno' | 'externo'

interface Curso {
  id: number
  nombre: string
  descripcion: string
  modalidad: Modalidad
  instructor: string
  tipo: TipoCurso
  inscritos: number
  capacidad: number
  departamentos: string[]
  linkExterno?: string
  estado: 'activo' | 'finalizado'
  fechaFin?: string
}

interface CursoUsuario {
  nombre: string
  tipo: 'interno' | 'externo'
  modalidad: Modalidad
  instructor: string
  estado: 'en progreso' | 'completado'
  fechaTermino: string
}

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: 'admin' | 'empleado' | 'instructor'
  departamento: string
  activo: boolean
  cursosAnio: CursoUsuario[]
  cursosHistorico: number
  color?: string
}

// ── Mock data (se reemplazará con API) ──
const cursos: Curso[] = [
  {
    id: 1,
    nombre: 'Introducción a la Programación',
    descripcion: 'Fundamentos de programación orientada a objetos con Java.',
    modalidad: 'Online',
    instructor: 'Ricardo Pérez',
    tipo: 'interno',
    inscritos: 8,
    capacidad: 20,
    departamentos: ['ISC', 'LANI'],
    estado: 'activo',
    fechaFin: '20 May 2026',
  },
  {
    id: 2,
    nombre: 'Seguridad e Higiene',
    descripcion: 'Normas de seguridad e higiene en el trabajo universitario.',
    modalidad: 'Presencial',
    instructor: 'María López',
    tipo: 'interno',
    inscritos: 25,
    capacidad: 25,
    departamentos: ['Dirección', 'IE', 'IM', 'ISC', 'LANI', 'Servicios generales'],
    estado: 'finalizado',
    fechaFin: '10 Ene 2026',
  },
  {
    id: 3,
    nombre: 'Protección Civil',
    descripcion: 'Curso obligatorio de protección civil y primeros auxilios.',
    modalidad: 'Híbrido',
    instructor: 'Carlos Ruiz',
    tipo: 'interno',
    inscritos: 30,
    capacidad: 30,
    departamentos: ['Dirección', 'IM', 'Servicios generales'],
    estado: 'finalizado',
    fechaFin: '15 Feb 2026',
  },
  {
    id: 4,
    nombre: 'Derechos Humanos CNDH',
    descripcion: 'Curso externo de la Comisión Nacional de Derechos Humanos.',
    modalidad: 'Online',
    instructor: '—',
    tipo: 'externo',
    inscritos: 6,
    capacidad: 50,
    departamentos: ['Dirección', 'IE', 'IM', 'ISC', 'LANI', 'Servicios generales'],
    linkExterno: 'https://www.cndh.org.mx',
    estado: 'activo',
    fechaFin: '30 Abr 2026',
  },
]

const ANIO_ACTUAL = new Date().getFullYear()

const usuarios: Usuario[] = [
  {
    id: 1, nombre: 'Cristian Geovani', email: 'cgeovani@itesca.edu.mx',
    rol: 'admin', departamento: 'Dirección', activo: true, cursosHistorico: 8,
    cursosAnio: [
      { nombre: 'Protección Civil', tipo: 'interno', modalidad: 'Presencial', instructor: 'Carlos Ruiz', estado: 'completado',  fechaTermino: '15 Feb 2026' },
      { nombre: 'Derechos Humanos CNDH', tipo: 'externo', modalidad: 'Online', instructor: '—', estado: 'en progreso', fechaTermino: '30 Abr 2026' },
    ],
  },
  {
    id: 2, nombre: 'Ricardo Pérez', email: 'rperez@itesca.edu.mx',
    rol: 'instructor', departamento: 'ISC', activo: true, cursosHistorico: 12,
    cursosAnio: [
      { nombre: 'Seguridad e Higiene', tipo: 'interno', modalidad: 'Presencial', instructor: 'María López', estado: 'completado', fechaTermino: '10 Ene 2026' },
    ],
  },
  {
    id: 3, nombre: 'Ana García', email: 'agarcia@itesca.edu.mx',
    rol: 'empleado', departamento: 'LANI', activo: true, cursosHistorico: 5,
    cursosAnio: [
      { nombre: 'Introducción a la Programación', tipo: 'interno', modalidad: 'Online', instructor: 'Ricardo Pérez', estado: 'en progreso', fechaTermino: '20 May 2026' },
      { nombre: 'Protección Civil', tipo: 'interno', modalidad: 'Presencial', instructor: 'Carlos Ruiz', estado: 'completado', fechaTermino: '15 Feb 2026' },
      { nombre: 'Derechos Humanos CNDH', tipo: 'externo', modalidad: 'Online', instructor: '—', estado: 'completado', fechaTermino: '01 Mar 2026' },
    ],
  },
  {
    id: 4, nombre: 'María López', email: 'mlopez@itesca.edu.mx',
    rol: 'instructor', departamento: 'IM', activo: true, cursosHistorico: 9,
    cursosAnio: [],
  },
  {
    id: 5, nombre: 'José Martínez', email: 'jmartinez@itesca.edu.mx',
    rol: 'empleado', departamento: 'IE', activo: false, cursosHistorico: 3,
    cursosAnio: [
      { nombre: 'Seguridad e Higiene', tipo: 'interno', modalidad: 'Presencial', instructor: 'María López', estado: 'completado', fechaTermino: '10 Ene 2026' },
    ],
  },
]

// Helper: cursos de este año
const cursosAnioLabel = (u: Usuario) => {
  const total     = u.cursosAnio.length
  const progreso  = u.cursosAnio.filter(c => c.estado === 'en progreso').length
  const completos = total - progreso
  return { total, progreso, completos }
}

// Meta del año: 2 internos + 1 externo
const META_INTERNOS = 2
const META_EXTERNOS = 1

const progresoAnual = (u: Usuario) => {
  const internos  = u.cursosAnio.filter(c => c.tipo === 'interno').length
  const externos  = u.cursosAnio.filter(c => c.tipo === 'externo').length
  return { internos, externos }
}

const filtroEstadoCurso = ref<'activo' | 'finalizado'>('activo')

const cursosInternos = computed(() =>
  cursos.filter(c => c.tipo === 'interno' && c.estado === filtroEstadoCurso.value)
)
const cursosExternos = computed(() =>
  cursos.filter(c => c.tipo === 'externo' && c.estado === filtroEstadoCurso.value)
)

const totalActivos    = computed(() => cursos.filter(c => c.estado === 'activo').length)
const totalFinalizados = computed(() => cursos.filter(c => c.estado === 'finalizado').length)

const depColors: Record<string, string> = {
  'Dirección':          'bg-purple-100 text-purple-700',
  'IE':                 'bg-blue-100 text-blue-700',
  'IM':                 'bg-teal-100 text-teal-700',
  'ISC':                'bg-indigo-100 text-indigo-700',
  'LANI':               'bg-green-100 text-green-700',
  'Servicios generales':'bg-orange-100 text-orange-600',
}

const modalidadBadge: Record<Modalidad, string> = {
  Online:     'bg-blue-50 text-blue-600 border border-blue-100',
  Presencial: 'bg-green-50 text-green-600 border border-green-100',
  Híbrido:    'bg-purple-50 text-purple-600 border border-purple-100',
}

const rolBadge: Record<string, string> = {
  admin:      'bg-blue-100 text-[#4B7BF5]',
  empleado:   'bg-green-100 text-green-700',
  instructor: 'bg-orange-100 text-orange-600',
}
const rolLabel: Record<string, string> = {
  admin: 'Admin', empleado: 'Empleado', instructor: 'Instructor',
}

const mostrarAdscripciones = ref(false)
const adscripcionDetalleActiva = ref<string | null>(null)   // clave de adscripción seleccionada en el panel
const modalAdscripcion  = ref(false)
const modalCrearUsuario = ref(false)   // selector Manual/CSV
const modalUsuarioManual = ref(false)  // formulario manual
const modalUsuarioCSV    = ref(false)  // upload CSV

// ── Descargar Lista ──
const modalDescargaLista = ref(false)
const descargaAdscripcionFija = ref<string | null>(null)  // null = todas, string = filtrada por adscripción
const filtroDescarga = ref<'todos' | '0' | '1' | '2' | '3'>('todos')

const META_TOTAL = META_INTERNOS + META_EXTERNOS

const nivelesDescarga: { value: typeof filtroDescarga.value; label: string; desc: string }[] = [
  { value: 'todos',   label: 'Todos',              desc: 'Sin filtrar por avance'   },
  { value: '0',       label: 'Sin avance (0 cursos)',  desc: '0%'                  },
  { value: '1',       label: '1 curso tomado',      desc: `~${Math.round(1/META_TOTAL*100)}%` },
  { value: '2',       label: '2 cursos tomados',    desc: `~${Math.round(2/META_TOTAL*100)}%` },
  { value: '3',       label: 'Completo',            desc: `${META_TOTAL}+ cursos, 100%`       },
]

const abrirDescargaLista = (adscripcionClave: string | null = null) => {
  descargaAdscripcionFija.value = adscripcionClave
  filtroDescarga.value = 'todos'
  modalDescargaLista.value = true
}

const usuariosParaDescarga = computed(() => {
  return usuarios.filter(u => {
    // Filtro por adscripción fija (si venimos desde el panel de una adscripción)
    if (descargaAdscripcionFija.value) {
      const ads = adscripciones.find(a => a.clave === descargaAdscripcionFija.value)
      if (!ads) return false
      if (u.departamento !== ads.clave && u.departamento !== ads.nombre) return false
    }
    // Filtro por nivel de avance
    const total = u.cursosAnio.length
    if (filtroDescarga.value === '0') return total === 0
    if (filtroDescarga.value === '1') return total === 1
    if (filtroDescarga.value === '2') return total === 2
    if (filtroDescarga.value === '3') return total >= META_TOTAL
    return true // 'todos'
  })
})

const ejecutarDescargaLista = () => {
  const ads = descargaAdscripcionFija.value
    ? adscripciones.find(a => a.clave === descargaAdscripcionFija.value)
    : null
  const filas = [
    ['Nombre', 'Correo', 'Adscripción', 'Rol', 'Cursos internos', 'Cursos externos', 'Total cursos', '% Avance'],
    ...usuariosParaDescarga.value.map(u => {
      const internos = u.cursosAnio.filter(c => c.tipo === 'interno').length
      const externos = u.cursosAnio.filter(c => c.tipo === 'externo').length
      const total    = u.cursosAnio.length
      const pct      = Math.min(100, Math.round((total / META_TOTAL) * 100))
      return [u.nombre, u.email, u.departamento, u.rol, internos, externos, total, `${pct}%`]
    })
  ]
  const csv = filas.map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const nombre = ads ? `lista_${ads.clave}_${ANIO_ACTUAL}` : `lista_personal_${ANIO_ACTUAL}`
  a.href = url; a.download = `${nombre}.csv`; a.click()
  URL.revokeObjectURL(url)
  modalDescargaLista.value = false
}

// Usuarios de la adscripción activa en el panel
const usuariosAdscripcionActiva = computed(() => {
  if (!adscripcionDetalleActiva.value) return []
  const ads = adscripciones.find(a => a.clave === adscripcionDetalleActiva.value)
  if (!ads) return []
  return usuarios.filter(u => u.departamento === ads.clave || u.departamento === ads.nombre)
})

// ── Modal Inscribir personal (cursos externos) ──
const modalInscribir = ref(false)
const cursoInscribirId = ref<number | null>(null)
const inscribirBusqueda = ref('')
const inscribirFiltroAds = ref<string>('')       // clave de adscripción activa, '' = todas
const seleccionadosInscribir = ref<Set<number>>(new Set())

const cursoInscribir = computed(() =>
  cursoInscribirId.value !== null
    ? cursos.find(c => c.id === cursoInscribirId.value) ?? null
    : null
)

// Adscripciones del curso externo seleccionado (usa claves)
const adscripcionesCursoExterno = computed(() => {
  if (!cursoInscribir.value) return []
  return adscripciones.filter(a =>
    cursoInscribir.value!.departamentos.includes(a.clave) ||
    cursoInscribir.value!.departamentos.includes(a.nombre)
  )
})

// Usuarios disponibles según filtro y búsqueda
const usuariosInscribibles = computed(() => {
  const q = inscribirBusqueda.value.toLowerCase()
  return usuarios.filter(u => {
    const depMatch = inscribirFiltroAds.value
      ? u.departamento === inscribirFiltroAds.value
      : adscripcionesCursoExterno.value.some(a => a.clave === u.departamento || a.nombre === u.departamento)
    if (!depMatch) return false
    if (q) return `${u.nombre} ${u.email} ${u.departamento}`.toLowerCase().includes(q)
    return true
  })
})

// Conteo de seleccionados por adscripción
const seleccionadosPorAds = computed(() => {
  const map: Record<string, { seleccionados: number; total: number }> = {}
  for (const ads of adscripcionesCursoExterno.value) {
    const total = usuarios.filter(u => u.departamento === ads.clave || u.departamento === ads.nombre).length
    const seleccionados = usuarios.filter(u =>
      (u.departamento === ads.clave || u.departamento === ads.nombre) &&
      seleccionadosInscribir.value.has(u.id)
    ).length
    map[ads.clave] = { seleccionados, total }
  }
  return map
})

const toggleSeleccion = (id: number) => {
  const s = new Set(seleccionadosInscribir.value)
  s.has(id) ? s.delete(id) : s.add(id)
  seleccionadosInscribir.value = s
}

const seleccionarTodosEnFiltro = () => {
  const s = new Set(seleccionadosInscribir.value)
  const todos = usuariosInscribibles.value.map(u => u.id)
  const todosSeleccionados = todos.every(id => s.has(id))
  if (todosSeleccionados) {
    todos.forEach(id => s.delete(id))
  } else {
    todos.forEach(id => s.add(id))
  }
  seleccionadosInscribir.value = s
}

const todosEnFiltroSeleccionados = computed(() =>
  usuariosInscribibles.value.length > 0 &&
  usuariosInscribibles.value.every(u => seleccionadosInscribir.value.has(u.id))
)

// Total de usuarios en TODAS las adscripciones del curso (para el chip "Todas")
const usuariosTotalesInscribibles = computed(() => {
  if (!cursoInscribir.value) return 0
  return usuarios.filter(u =>
    adscripcionesCursoExterno.value.some(a => a.clave === u.departamento || a.nombre === u.departamento)
  ).length
})

const abrirInscribir = (cursoId: number) => {
  cursoInscribirId.value = cursoId
  inscribirBusqueda.value = ''
  inscribirFiltroAds.value = ''
  seleccionadosInscribir.value = new Set()
  modalInscribir.value = true
}

const confirmarInscripcion = () => {
  // TODO: API con Array.from(seleccionadosInscribir.value)
  console.log('Inscribir usuarios:', Array.from(seleccionadosInscribir.value), 'en curso', cursoInscribirId.value)
  modalInscribir.value = false
}

// Modal detalle usuario
const usuarioDetalle = ref<Usuario | null>(null)
const abrirDetalle = (u: Usuario) => { usuarioDetalle.value = u }

// Formulario nuevo usuario
const formNuevoUsuario = reactive({
  nomina:      '',
  nombre:      '',
  apellido:    '',
  correo:      '',
  password:    '',
  rol:         'empleado' as 'admin' | 'empleado' | 'instructor',
  puesto:      '',
  adscripcion: '',
})

const crearUsuarioManual = () => {
  // TODO: llamada a API
  console.log('Nuevo usuario:', { ...formNuevoUsuario })
  Object.assign(formNuevoUsuario, { nomina: '', nombre: '', apellido: '', correo: '', password: '', rol: 'empleado', puesto: '', adscripcion: '' })
  modalUsuarioManual.value = false
}

// CSV
const archivoCSV = ref<File | null>(null)
const errorCSV   = ref('')

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  errorCSV.value = ''
  if (file && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
    errorCSV.value = 'Solo se aceptan archivos .csv, .xlsx o .xls'
    archivoCSV.value = null
    return
  }
  archivoCSV.value = file
}

const subirCSV = () => {
  if (!archivoCSV.value) { errorCSV.value = 'Selecciona un archivo primero'; return }
  // TODO: subir a API con FormData
  console.log('Subir CSV:', archivoCSV.value.name)
  archivoCSV.value = null
  modalUsuarioCSV.value = false
}

// Descargar plantilla CSV
const descargarPlantilla = () => {
  const encabezados = ['nomina', 'nombre', 'apellido', 'correo', 'password', 'rol', 'puesto', 'adscripcion']
  const ejemplo     = ['12345', 'Juan', 'García', 'jgarcia@itesca.edu.mx', 'Temporal123!', 'empleado', 'Docente', 'ISC']
  const csv = [encabezados.join(','), ejemplo.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'plantilla_usuarios.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ── Crear Curso ──
const modalCrearCurso = ref(false)

const instructoresMock = computed(() =>
  usuarios.filter(u => u.rol === 'instructor').map(u => u.nombre)
)

const formNuevoCurso = reactive({
  nombre:       '',
  descripcion:  '',
  horas:        '' as number | '',
  capacidad:    '' as number | '',
  tipo:         'interno' as TipoCurso,
  modalidad:    'Presencial' as Modalidad,
  aula:         '',
  fechaInicio:  '',
  fechaFin:     '',
  horaInicio:   '',
  horaFin:      '',
  instructor:   '',
  adscripciones: [] as string[],
})

const toggleAdscripcionCurso = (nombre: string) => {
  const idx = formNuevoCurso.adscripciones.indexOf(nombre)
  if (idx === -1) formNuevoCurso.adscripciones.push(nombre)
  else formNuevoCurso.adscripciones.splice(idx, 1)
}

const seleccionarTodasAdscripciones = () => {
  const todas = adscripciones.map(a => a.clave)
  if (formNuevoCurso.adscripciones.length === todas.length) {
    formNuevoCurso.adscripciones = []
  } else {
    formNuevoCurso.adscripciones = [...todas]
  }
}

const crearCurso = () => {
  // TODO: API
  console.log('Nuevo curso:', { ...formNuevoCurso })
  Object.assign(formNuevoCurso, {
    nombre: '', descripcion: '', horas: '', capacidad: '', tipo: 'interno', modalidad: 'Presencial',
    aula: '', fechaInicio: '', fechaFin: '', horaInicio: '', horaFin: '',
    instructor: '', adscripciones: [],
  })
  modalCrearCurso.value = false
}

const formAdscripcion = reactive({ nombre: '', clave: '' })

const guardarAdscripcion = () => {
  // TODO: llamada a API
  adscripciones.push({ id: Date.now(), nombre: formAdscripcion.nombre, clave: formAdscripcion.clave.toUpperCase(), empleados: 0 })
  formAdscripcion.nombre = ''
  formAdscripcion.clave  = ''
  modalAdscripcion.value = false
}

// ── Filtros de usuarios ──
const filtroRol    = ref('')
const filtroDepto  = ref('')
const filtroEstado = ref<'' | 'activo' | 'inactivo'>('')

const estadoOpciones = [
  { label: 'Todos',    value: '' },
  { label: 'Activos',  value: 'activo' },
  { label: 'Inactivos',value: 'inactivo' },
] as const

const usuariosFiltrados = computed(() =>
  usuarios.filter(u => {
    if (filtroRol.value   && u.rol           !== filtroRol.value)   return false
    if (filtroDepto.value && u.departamento  !== filtroDepto.value) return false
    if (filtroEstado.value === 'activo'   && !u.activo)  return false
    if (filtroEstado.value === 'inactivo' &&  u.activo)  return false
    return true
  })
)

interface Adscripcion {
  id: number
  nombre: string
  clave: string
  empleados: number
}

const adscripciones: Adscripcion[] = [
  { id: 1, nombre: 'Dirección',          clave: 'DIR',  empleados: 5 },
  { id: 2, nombre: 'Ing. en Electrónica',clave: 'IE',   empleados: 12 },
  { id: 3, nombre: 'Ing. Mecánica',      clave: 'IM',   empleados: 10 },
  { id: 4, nombre: 'Ing. en Sistemas',   clave: 'ISC',  empleados: 18 },
  { id: 5, nombre: 'Lic. en Adm. de Negocios Internacionales', clave: 'LANI', empleados: 14 },
  { id: 6, nombre: 'Servicios Generales',clave: 'SG',   empleados: 8 },
]
</script>

<template>
  <div>

    <!-- ── Barra de acciones ── -->
    <div class="flex flex-col gap-3 mb-8">

      <!-- Fila 1: toggles -->
      <div class="flex items-center gap-3 flex-wrap">

        <!-- Sub-toggle En curso / Finalizados (solo en vista cursos) -->
        <div v-if="vista === 'cursos'" class="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            @click="filtroEstadoCurso = 'activo'"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
              filtroEstadoCurso === 'activo' ? 'bg-white text-[#4B7BF5] shadow-sm' : 'text-gray-400 hover:text-gray-600'
            ]">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
            En curso
            <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full', filtroEstadoCurso === 'activo' ? 'bg-blue-50 text-[#4B7BF5]' : 'bg-gray-200 text-gray-400']">{{ totalActivos }}</span>
          </button>
          <button
            @click="filtroEstadoCurso = 'finalizado'"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
              filtroEstadoCurso === 'finalizado' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            ]">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"></span>
            Finalizados
            <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full', filtroEstadoCurso === 'finalizado' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-400']">{{ totalFinalizados }}</span>
          </button>
        </div>

        <!-- Toggle Cursos / Usuarios (siempre a la derecha) -->
        <div class="bg-gray-100 rounded-xl p-1 flex gap-1 ml-auto">
          <button
            @click="vista = 'cursos'"
            :class="[
              'px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              vista === 'cursos' ? 'bg-white text-[#4B7BF5] shadow-sm' : 'text-gray-400 hover:text-gray-700'
            ]"
          >Cursos</button>
          <button
            @click="vista = 'usuarios'"
            :class="[
              'px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              vista === 'usuarios' ? 'bg-white text-[#4B7BF5] shadow-sm' : 'text-gray-400 hover:text-gray-700'
            ]"
          >Usuarios</button>
        </div>
      </div>

      <!-- Fila 2: botones de acción según vista (scroll horizontal en móvil) -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">

        <!-- Vista CURSOS -->
        <template v-if="vista === 'cursos'">
          <button
            @click="modalCrearCurso = true"
            class="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear curso
          </button>
        </template>

        <!-- Vista USUARIOS -->
        <template v-else>
          <button
            @click="modalCrearUsuario = true"
            class="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Crear usuario
          </button>
          <button
            @click="abrirDescargaLista(null)"
            class="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Descargar lista
          </button>
          <button
            @click="mostrarAdscripciones = !mostrarAdscripciones"
            class="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {{ mostrarAdscripciones ? 'Ocultar' : 'Adscripciones' }}
          </button>
          <button
            @click="modalAdscripcion = true"
            class="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-dashed border-[#4B7BF5] text-[#4B7BF5] bg-white hover:bg-blue-50 shadow-sm transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva adscripción
          </button>
        </template>

      </div>
    </div>

    <!-- ════ MODAL: Nueva adscripción ════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="modalAdscripcion"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.4)"
          @click.self="modalAdscripcion = false"
        >
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
          >
            <div v-if="modalAdscripcion" class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div class="flex items-center justify-between mb-5">
                <h3 class="text-base font-bold text-gray-900">Nueva adscripción</h3>
                <button @click="modalAdscripcion = false" class="text-gray-400 hover:text-gray-600 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form @submit.prevent="guardarAdscripcion" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la adscripción</label>
                  <input
                    v-model="formAdscripcion.nombre"
                    type="text"
                    required
                    placeholder="Ej. Ing. en Sistemas"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Clave</label>
                  <input
                    v-model="formAdscripcion.clave"
                    type="text"
                    required
                    maxlength="8"
                    placeholder="Ej. ISC"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 uppercase outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"
                  />
                </div>

                <div class="flex gap-2 pt-2">
                  <button
                    type="button"
                    @click="modalAdscripcion = false"
                    class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >Cancelar</button>
                  <button
                    type="submit"
                    class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-105"
                    style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
                  >Guardar</button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ MODAL: Crear Curso ════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150 ease-in"  leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="modalCrearCurso" class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background:rgba(0,0,0,0.45)" @click.self="modalCrearCurso = false">
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100">
            <div v-if="modalCrearCurso" class="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

              <!-- ── Header ── -->
              <div class="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Nuevo Curso</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Completa la información del curso</p>
                </div>
                <button @click="modalCrearCurso = false" class="text-gray-400 hover:text-gray-600 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- ── Body scrollable ── -->
              <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                <!-- Nombre -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre del Curso</label>
                  <input v-model="formNuevoCurso.nombre" type="text" required placeholder="Ej. Seguridad e Higiene"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                </div>

                <!-- Descripción -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descripción</label>
                  <textarea v-model="formNuevoCurso.descripcion" rows="2" placeholder="Breve descripción del curso..."
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition resize-none"/>
                </div>

                <!-- Tipo + Horas en fila -->
                <div class="grid grid-cols-2 gap-4">
                  <!-- Tipo -->
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo</label>
                    <div class="flex gap-2">
                      <button type="button"
                        @click="formNuevoCurso.tipo = 'interno'"
                        :class="[
                          'flex-1 py-2 rounded-xl text-xs font-bold transition border',
                          formNuevoCurso.tipo === 'interno'
                            ? 'bg-[#4B7BF5] text-white border-[#4B7BF5] shadow-sm'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#4B7BF5] hover:text-[#4B7BF5]'
                        ]">Interno</button>
                      <button type="button"
                        @click="formNuevoCurso.tipo = 'externo'"
                        :class="[
                          'flex-1 py-2 rounded-xl text-xs font-bold transition border',
                          formNuevoCurso.tipo === 'externo'
                            ? 'bg-[#FF8B5E] text-white border-[#FF8B5E] shadow-sm'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#FF8B5E] hover:text-[#FF8B5E]'
                        ]">Externo</button>
                    </div>
                  </div>
                  <!-- Horas -->
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Horas de duración</label>
                    <input v-model.number="formNuevoCurso.horas" type="number" min="1" max="999" placeholder="Ej. 8"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Capacidad (lugares)</label>
                    <input v-model.number="formNuevoCurso.capacidad" type="number" min="1" max="9999" required placeholder="Ej. 30"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                </div>

                <!-- Modalidad + Aula en fila -->
                <div class="grid grid-cols-2 gap-4">
                  <!-- Modalidad -->
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Modalidad</label>
                    <div class="flex flex-col gap-1.5">
                      <button type="button" v-for="mod in (['Presencial', 'Online', 'Híbrido'] as Modalidad[])" :key="mod"
                        @click="formNuevoCurso.modalidad = mod"
                        :class="[
                          'py-2 rounded-xl text-xs font-bold transition border text-left px-3',
                          formNuevoCurso.modalidad === mod
                            ? mod === 'Online' ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : mod === 'Presencial' ? 'bg-green-50 text-green-600 border-green-200'
                              : 'bg-purple-50 text-purple-600 border-purple-200'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                        ]">{{ mod }}</button>
                    </div>
                  </div>
                  <!-- Aula -->
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Aula
                      <span class="ml-1 text-gray-300 font-normal normal-case">(opcional)</span>
                    </label>
                    <input v-model="formNuevoCurso.aula" type="text" placeholder="Ej. Aula 12"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                </div>

                <!-- Fechas en fila -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha de inicio</label>
                    <input v-model="formNuevoCurso.fechaInicio" type="date"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha de fin</label>
                    <input v-model="formNuevoCurso.fechaFin" type="date"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                </div>

                <!-- Horas en fila -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Hora de inicio</label>
                    <input v-model="formNuevoCurso.horaInicio" type="time"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Hora de fin</label>
                    <input v-model="formNuevoCurso.horaFin" type="time"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                </div>

                <!-- Instructor -->
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Instructor</label>
                  <select v-model="formNuevoCurso.instructor"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition cursor-pointer">
                    <option value="">— Pendiente de asignar —</option>
                    <option v-for="inst in instructoresMock" :key="inst" :value="inst">{{ inst }}</option>
                  </select>
                </div>

                <!-- Adscripciones -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Adscripciones</label>
                    <button type="button" @click="seleccionarTodasAdscripciones"
                      class="text-xs font-semibold text-[#4B7BF5] hover:text-[#2B4EF0] transition">
                      {{ formNuevoCurso.adscripciones.length === adscripciones.length ? 'Deseleccionar todo' : 'Seleccionar todo' }}
                    </button>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      v-for="ads in adscripciones"
                      :key="ads.id"
                      @click="toggleAdscripcionCurso(ads.clave)"
                      :class="[
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition text-left',
                        formNuevoCurso.adscripciones.includes(ads.clave)
                          ? 'bg-[#4B7BF5] text-white border-[#4B7BF5] shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#4B7BF5] hover:text-[#4B7BF5]'
                      ]">
                      <div :class="[
                        'w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center',
                        formNuevoCurso.adscripciones.includes(ads.clave)
                          ? 'border-white bg-white/20'
                          : 'border-gray-300'
                      ]">
                        <svg v-if="formNuevoCurso.adscripciones.includes(ads.clave)" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <span class="truncate text-xs font-bold tracking-wide">{{ ads.clave }}</span>
                    </button>
                  </div>
                  <p v-if="formNuevoCurso.adscripciones.length" class="mt-2 text-xs text-gray-400">
                    {{ formNuevoCurso.adscripciones.length }} seleccionada{{ formNuevoCurso.adscripciones.length > 1 ? 's' : '' }}
                  </p>
                </div>

              </div>

              <!-- ── Footer ── -->
              <div class="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <button type="button" @click="modalCrearCurso = false"
                  class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button @click="crearCurso"
                  class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-105"
                  style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
                  Crear Curso
                </button>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ MODAL: Selector Crear Usuario ════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150 ease-in"  leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="modalCrearUsuario" class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background:rgba(0,0,0,0.45)" @click.self="modalCrearUsuario = false">
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100">
            <div v-if="modalCrearUsuario" class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-bold text-gray-900">Crear Usuario</h3>
                <button @click="modalCrearUsuario = false" class="text-gray-400 hover:text-gray-600 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div class="space-y-3">
                <!-- Opción manual -->
                <button
                  @click="modalCrearUsuario = false; modalUsuarioManual = true"
                  class="w-full flex items-center gap-4 p-4 rounded-xl text-white font-semibold transition hover:brightness-110 hover:shadow-md"
                  style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
                >
                  <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-bold">Registrar Manualmente</p>
                    <p class="text-xs text-blue-200 font-normal">Llena el formulario campo por campo</p>
                  </div>
                </button>
                <!-- Opción CSV -->
                <button
                  @click="modalCrearUsuario = false; modalUsuarioCSV = true"
                  class="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#4B7BF5] text-[#4B7BF5] font-semibold transition hover:bg-blue-50"
                >
                  <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-bold">Cargar desde Excel / CSV</p>
                    <p class="text-xs text-gray-400 font-normal">Registra múltiples usuarios a la vez</p>
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ MODAL: Registro Manual ════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150 ease-in"  leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="modalUsuarioManual" class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background:rgba(0,0,0,0.45)" @click.self="modalUsuarioManual = false">
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100">
            <div v-if="modalUsuarioManual" class="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">

              <!-- Header -->
              <div class="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Nuevo Usuario</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Registro manual</p>
                </div>
                <button @click="modalUsuarioManual = false" class="text-gray-400 hover:text-gray-600 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Formulario scrollable -->
              <form @submit.prevent="crearUsuarioManual" class="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                <!-- Nómina (solo lectura visual, se genera / escanea) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    Nómina
                    <span class="ml-1 text-xs text-gray-400 font-normal">(clave del empleado)</span>
                  </label>
                  <input
                    v-model="formNuevoUsuario.nomina"
                    type="text"
                    required
                    placeholder="Ej. 12345"
                    maxlength="20"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"
                  />
                </div>

                <!-- Nombre + Apellido en fila -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre(s)</label>
                    <input v-model="formNuevoUsuario.nombre" type="text" required placeholder="Juan"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Apellido(s)</label>
                    <input v-model="formNuevoUsuario.apellido" type="text" required placeholder="García López"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                </div>

                <!-- Correo -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo institucional</label>
                  <input v-model="formNuevoUsuario.correo" type="email" required placeholder="jgarcia@itesca.edu.mx"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                </div>

                <!-- Contraseña -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña temporal</label>
                  <input v-model="formNuevoUsuario.password" type="password" required placeholder="••••••••"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                </div>

                <!-- Rol + Puesto en fila -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                    <select v-model="formNuevoUsuario.rol" required
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition cursor-pointer">
                      <option value="empleado">Empleado</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Puesto</label>
                    <input v-model="formNuevoUsuario.puesto" type="text" placeholder="Ej. Docente"
                      class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                  </div>
                </div>

                <!-- Adscripción -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Adscripción</label>
                  <select v-model="formNuevoUsuario.adscripcion" required
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition cursor-pointer">
                    <option value="" disabled>Selecciona una adscripción</option>
                    <option v-for="ads in adscripciones" :key="ads.id" :value="ads.nombre">
                      {{ ads.clave }} — {{ ads.nombre }}
                    </option>
                  </select>
                </div>

              </form>

              <!-- Footer -->
              <div class="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <button type="button" @click="modalUsuarioManual = false"
                  class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button @click="crearUsuarioManual"
                  class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-105"
                  style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
                  Crear Usuario
                </button>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ MODAL: Carga CSV ════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150 ease-in"  leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="modalUsuarioCSV" class="fixed inset-0 z-50 flex items-center justify-center p-4"
             style="background:rgba(0,0,0,0.45)" @click.self="modalUsuarioCSV = false">
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100">
            <div v-if="modalUsuarioCSV" class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

              <div class="flex items-center justify-between mb-5">
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Cargar usuarios</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Excel / CSV masivo</p>
                </div>
                <button @click="modalUsuarioCSV = false" class="text-gray-400 hover:text-gray-600 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Descargar plantilla -->
              <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[#4B7BF5]">Descarga la plantilla</p>
                  <p class="text-xs text-blue-400 mt-0.5">Llena los datos y sube el archivo</p>
                </div>
                <button @click="descargarPlantilla"
                  class="flex-shrink-0 flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg text-white transition hover:brightness-110"
                  style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Plantilla .csv
                </button>
              </div>

              <!-- Columnas de la plantilla -->
              <div class="flex flex-wrap gap-1.5 mb-5">
                <span v-for="col in ['nomina','nombre','apellido','correo','password','rol','puesto','adscripcion']" :key="col"
                  class="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">
                  {{ col }}
                </span>
              </div>

              <!-- Zona de carga -->
              <label
                class="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition"
                :class="archivoCSV ? 'border-[#4B7BF5] bg-blue-50' : 'border-gray-200 hover:border-[#4B7BF5] hover:bg-gray-50'"
              >
                <input type="file" accept=".csv,.xlsx,.xls" class="hidden" @change="onFileChange" />
                <div v-if="!archivoCSV">
                  <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                  <p class="text-sm font-medium text-gray-500">Haz clic o arrastra tu archivo aquí</p>
                  <p class="text-xs text-gray-400 mt-1">.csv, .xlsx o .xls</p>
                </div>
                <div v-else class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5 text-[#4B7BF5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span class="text-sm font-semibold text-[#4B7BF5] truncate max-w-[220px]">{{ archivoCSV.name }}</span>
                  <button type="button" @click.prevent="archivoCSV = null"
                    class="text-gray-400 hover:text-red-500 transition flex-shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </label>

              <p v-if="errorCSV" class="mt-2 text-xs text-red-500">{{ errorCSV }}</p>

              <div class="flex gap-2 mt-5">
                <button @click="modalUsuarioCSV = false"
                  class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button @click="subirCSV" :disabled="!archivoCSV"
                  class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
                  Subir archivo
                </button>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════ VISTA: CURSOS ════════════════ -->
    <div v-if="vista === 'cursos'">

      <!-- Cursos Internos -->
      <section v-if="cursosInternos.length" class="mb-10">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full inline-block" style="background:#4B7BF5"></span>
          Cursos Internos
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="curso in cursosInternos" :key="curso.id"
            :class="['bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col', curso.estado === 'finalizado' ? 'border-gray-100 opacity-80' : 'border-gray-100']"
          >
            <!-- Badges de departamentos -->
            <div class="flex flex-wrap gap-1 mb-3">
              <span
                v-for="dep in curso.departamentos" :key="dep"
                :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full', depColors[dep] ?? 'bg-gray-100 text-gray-600']"
              >{{ dep }}</span>
            </div>

            <!-- Nombre y descripción -->
            <h3 class="text-sm font-bold text-gray-900 text-center mb-1">{{ curso.nombre }}</h3>
            <p class="text-xs text-gray-400 text-center mb-4 line-clamp-2">{{ curso.descripcion }}</p>

            <!-- Meta -->
            <div class="space-y-2 text-xs mb-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Modalidad</span>
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-medium', modalidadBadge[curso.modalidad]]">{{ curso.modalidad }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Instructor</span>
                <span class="font-medium text-gray-700 truncate max-w-[130px]">{{ curso.instructor }}</span>
              </div>
            </div>

            <!-- Barra de progreso -->
            <div class="mb-4">
              <div class="flex justify-between text-[10px] text-gray-400 mb-1.5">
                <span>Inscritos</span>
                <span class="font-semibold text-gray-600">{{ curso.inscritos }} / {{ curso.capacidad }}</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${(curso.inscritos / curso.capacidad) * 100}%`, background: 'linear-gradient(90deg, #2B4EF0, #5B9CF8)' }"
                ></div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="grid grid-cols-2 gap-2 mt-auto">
              <NuxtLink
                :to="`/admin/cursos/${curso.id}`"
                class="flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-xl text-white transition hover:brightness-110"
                style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Información
              </NuxtLink>
              <NuxtLink
                :to="`/admin/cursos/${curso.id}`"
                class="flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-xl text-white transition hover:brightness-110"
                style="background: linear-gradient(135deg, #3ECFB2, #2fbfa3)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Empleados
              </NuxtLink>
            </div>

            <!-- Badge finalizado (fondo) -->
            <div v-if="curso.estado === 'finalizado'" class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400">
              <svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              Finalizado{{ curso.fechaFin ? ' · ' + curso.fechaFin : '' }}
            </div>
          </div>
        </div>
      </section>

      <!-- Cursos Externos -->
      <section v-if="cursosExternos.length">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full inline-block" style="background:#FF8B5E"></span>
          Cursos Externos
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="curso in cursosExternos" :key="curso.id"
            :class="['bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col', curso.estado === 'finalizado' ? 'border-gray-100 opacity-80' : 'border-gray-100']"
          >
            <div class="flex flex-wrap gap-1 mb-3">
              <span
                v-for="dep in curso.departamentos" :key="dep"
                :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full', depColors[dep] ?? 'bg-gray-100 text-gray-600']"
              >{{ dep }}</span>
            </div>

            <h3 class="text-sm font-bold text-gray-900 text-center mb-1">{{ curso.nombre }}</h3>
            <p class="text-xs text-gray-400 text-center mb-4 line-clamp-2">{{ curso.descripcion }}</p>

            <div class="space-y-2 text-xs mb-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Modalidad</span>
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-medium', modalidadBadge[curso.modalidad]]">{{ curso.modalidad }}</span>
              </div>
              <div v-if="curso.linkExterno" class="flex items-center justify-between">
                <span class="text-gray-400">Sitio</span>
                <a :href="curso.linkExterno" target="_blank" rel="noopener noreferrer" class="text-[#4B7BF5] hover:underline font-medium truncate max-w-[140px]">{{ curso.linkExterno }}</a>
              </div>
            </div>

            <div class="mb-4">
              <div class="flex justify-between text-[10px] text-gray-400 mb-1.5">
                <span>Inscritos</span>
                <span class="font-semibold text-gray-600">{{ curso.inscritos }} / {{ curso.capacidad }}</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${(curso.inscritos / curso.capacidad) * 100}%`, background: 'linear-gradient(90deg, #FF8B5E, #F5C242)' }"
                ></div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-auto">
              <NuxtLink
                :to="`/admin/cursos/${curso.id}`"
                class="flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-xl text-white transition hover:brightness-110"
                style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Información
              </NuxtLink>
              <button
                @click="abrirInscribir(curso.id)"
                class="flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-xl text-white transition hover:brightness-110"
                style="background: linear-gradient(135deg, #3ECFB2, #2fbfa3)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                </svg>
                Inscribir
              </button>
            </div>

            <!-- Badge finalizado (fondo) -->
            <div v-if="curso.estado === 'finalizado'" class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400">
              <svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              Finalizado{{ curso.fechaFin ? ' · ' + curso.fechaFin : '' }}
            </div>
          </div>
        </div>
      </section>

      <!-- Estado vacío -->
      <div v-if="!cursosInternos.length && !cursosExternos.length" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-400">No hay cursos {{ filtroEstadoCurso === 'activo' ? 'en curso' : 'finalizados' }}</p>
        <p v-if="filtroEstadoCurso === 'activo'" class="text-xs text-gray-300 mt-1">Crea un nuevo curso para comenzar</p>
      </div>

    </div>

    <!-- ════════════════ VISTA: USUARIOS ════════════════ -->
    <div v-else>

      <!-- Panel de Adscripciones (colapsable) -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="mostrarAdscripciones" class="mb-6">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full inline-block bg-purple-500"></span>
            Adscripciones
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              v-for="ads in adscripciones" :key="ads.id"
              @click="adscripcionDetalleActiva = adscripcionDetalleActiva === ads.clave ? null : ads.clave"
              :class="[
                'bg-white rounded-xl border shadow-sm p-4 flex flex-col items-center text-center transition cursor-pointer',
                adscripcionDetalleActiva === ads.clave
                  ? 'border-[#4B7BF5] ring-2 ring-[#4B7BF5]/20 shadow-md'
                  : 'border-gray-100 hover:shadow-md hover:border-gray-200'
              ]"
            >
              <span :class="['text-xs font-bold px-2.5 py-1 rounded-full mb-2', depColors[ads.nombre] ?? 'bg-gray-100 text-gray-600']">{{ ads.clave }}</span>
              <p class="text-xs font-semibold text-gray-800 leading-tight mb-1">{{ ads.nombre }}</p>
              <p class="text-[11px] text-gray-400">{{ ads.empleados }} empleados</p>
            </button>
          </div>

          <!-- ── Detalle de adscripción seleccionada ── -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <div v-if="adscripcionDetalleActiva" class="mt-4 bg-white rounded-2xl border border-[#4B7BF5]/20 shadow-sm overflow-hidden">
              <!-- Cabecera del detalle -->
              <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span :class="['text-xs font-bold px-2.5 py-1 rounded-full', depColors[adscripciones.find(a => a.clave === adscripcionDetalleActiva)?.nombre ?? ''] ?? 'bg-gray-100 text-gray-600']">
                    {{ adscripcionDetalleActiva }}
                  </span>
                  <span class="text-sm font-semibold text-gray-800">
                    {{ adscripciones.find(a => a.clave === adscripcionDetalleActiva)?.nombre }}
                  </span>
                  <span class="text-xs text-gray-400 ml-1">· {{ usuariosAdscripcionActiva.length }} persona{{ usuariosAdscripcionActiva.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <!-- Descargar lista de esta adscripción -->
                  <button
                    @click="abrirDescargaLista(adscripcionDetalleActiva)"
                    class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#4B7BF5] text-[#4B7BF5] hover:bg-blue-50 transition"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Descargar lista
                  </button>
                  <button @click="adscripcionDetalleActiva = null" class="text-gray-400 hover:text-gray-600 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Lista de usuarios -->
              <div v-if="usuariosAdscripcionActiva.length === 0" class="py-8 text-center text-sm text-gray-400">
                No hay usuarios registrados en esta adscripción.
              </div>
              <div v-else class="divide-y divide-gray-50">
                <div
                  v-for="u in usuariosAdscripcionActiva" :key="u.id"
                  class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                  @click="abrirDetalle(u)"
                >
                  <!-- Avatar -->
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    :style="{ background: u.color ?? 'linear-gradient(135deg,#2B4EF0,#4B7BF5)' }"
                  >
                    {{ u.nombre.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase() }}
                  </div>
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{{ u.nombre }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ u.email }}</p>
                    <p class="text-[11px] text-gray-400 truncate">{{ u.departamento }}</p>
                  </div>
                  <!-- Rol badge -->
                  <span :class="['shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full', rolBadge[u.rol]]">
                    {{ rolLabel[u.rol] }}
                  </span>
                  <!-- Avance cursos anuales -->
                  <div class="shrink-0 flex flex-col items-end gap-0.5 min-w-[72px]">
                    <div class="flex gap-1 text-[11px] font-semibold">
                      <span class="text-[#4B7BF5]">{{ u.cursosAnio.filter((c: CursoUsuario) => c.tipo === 'interno').length }}/{{ META_INTERNOS }}</span>
                      <span class="text-gray-300">·</span>
                      <span :class="u.cursosAnio.filter((c: CursoUsuario) => c.tipo === 'externo').length >= META_EXTERNOS ? 'text-green-600' : 'text-orange-400'">
                        {{ u.cursosAnio.filter((c: CursoUsuario) => c.tipo === 'externo').length }}/{{ META_EXTERNOS }}
                      </span>
                    </div>
                    <div class="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :style="{
                          width: `${Math.min(100, Math.round((u.cursosAnio.length / META_TOTAL) * 100))}%`,
                          background: u.cursosAnio.length >= META_TOTAL ? '#7DD87A' : u.cursosAnio.length > 0 ? '#F5C242' : '#e5e7eb'
                        }"
                      ></div>
                    </div>
                    <span class="text-[10px] text-gray-400 leading-none">
                      {{ Math.min(100, Math.round((u.cursosAnio.length / META_TOTAL) * 100)) }}% avance
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- ── Filtros ── -->
      <div class="flex flex-wrap gap-2 mb-4">
        <!-- Filtro rol -->
        <select
          v-model="filtroRol"
          class="text-xs font-medium px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4B7BF5] cursor-pointer"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="empleado">Empleado</option>
          <option value="instructor">Instructor</option>
        </select>

        <!-- Filtro departamento -->
        <select
          v-model="filtroDepto"
          class="text-xs font-medium px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4B7BF5] cursor-pointer"
        >
          <option value="">Todos los depto.</option>
          <option v-for="ads in adscripciones" :key="ads.id" :value="ads.nombre">{{ ads.nombre }}</option>
        </select>

        <!-- Filtro estado -->
        <div class="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
          <button
            v-for="op in estadoOpciones" :key="op.value"
            @click="filtroEstado = op.value"
            :class="[
              'text-xs font-semibold px-3 py-2 transition',
              filtroEstado === op.value
                ? 'bg-[#4B7BF5] text-white'
                : 'text-gray-500 hover:bg-gray-50'
            ]"
          >{{ op.label }}</button>
        </div>

        <!-- Contador resultados -->
        <span class="text-xs text-gray-400 self-center ml-auto">
          {{ usuariosFiltrados.length }} resultado{{ usuariosFiltrados.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- ── Tabla (md+) ── -->
      <div class="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Correo</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Adscripción</th>
              <th class="px-4 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider" title="Cursos tomados este año (incluye en progreso)">
                {{ ANIO_ACTUAL }} ?
              </th>
              <th class="px-4 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Histórico</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="px-4 py-3.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="usuariosFiltrados.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-sm text-gray-400">Sin resultados para los filtros seleccionados.</td>
            </tr>
            <tr v-for="user in usuariosFiltrados" :key="user.id" class="hover:bg-gray-50 transition">
              <td class="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{{ user.nombre }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', rolBadge[user.rol]]">{{ rolLabel[user.rol] }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ user.departamento }}</td>
              <!-- Cursos este año -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <span class="text-sm font-bold text-gray-800">{{ cursosAnioLabel(user).total }}</span>
                  <span
                    v-if="cursosAnioLabel(user).progreso > 0"
                    class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700"
                    :title="`${cursosAnioLabel(user).progreso} en progreso`"
                  >+{{ cursosAnioLabel(user).progreso }}</span>
                  <!-- indicador visual meta -->
                  <span
                    :class="[
                      'ml-1 w-2 h-2 rounded-full flex-shrink-0',
                      cursosAnioLabel(user).total >= META_INTERNOS + META_EXTERNOS ? 'bg-green-400' :
                      cursosAnioLabel(user).total > 0 ? 'bg-yellow-400' : 'bg-gray-200'
                    ]"
                    :title="`Meta: ${META_INTERNOS} internos + ${META_EXTERNOS} externo`"
                  ></span>
                </div>
                <!-- mini barra progreso internos/externos -->
                <div class="flex gap-0.5 mt-1 justify-center">
                  <div
                    v-for="i in META_INTERNOS" :key="'i'+i"
                    :class="['w-3 h-1 rounded-full', progresoAnual(user).internos >= i ? 'bg-[#4B7BF5]' : 'bg-gray-200']"
                  ></div>
                  <div class="w-1"></div>
                  <div
                    v-for="e in META_EXTERNOS" :key="'e'+e"
                    :class="['w-3 h-1 rounded-full', progresoAnual(user).externos >= e ? 'bg-orange-400' : 'bg-gray-200']"
                  ></div>
                </div>
              </td>
              <!-- Histórico -->
              <td class="px-4 py-3 text-center">
                <span class="text-sm font-bold text-gray-600">{{ user.cursosHistorico }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', user.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400']">
                  {{ user.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click="abrirDetalle(user)" class="text-[#4B7BF5] hover:underline text-xs font-semibold whitespace-nowrap">Ver detalle</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Tarjetas (móvil, < md) ── -->
      <div class="md:hidden space-y-3">
        <p v-if="usuariosFiltrados.length === 0" class="text-center text-sm text-gray-400 py-10">
          Sin resultados para los filtros seleccionados.
        </p>
        <div
          v-for="user in usuariosFiltrados" :key="user.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <!-- Avatar inicial -->
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
              >
                {{ user.nombre.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-gray-900 truncate">{{ user.nombre }}</p>
                <p class="text-xs text-gray-400 truncate">{{ user.email }}</p>
              </div>
            </div>
            <!-- Estado -->
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 self-start', user.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400']">
              {{ user.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="flex items-center gap-2 flex-wrap mb-3">
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', rolBadge[user.rol]]">{{ rolLabel[user.rol] }}</span>
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', depColors[user.departamento] ?? 'bg-gray-100 text-gray-600']">
              {{ user.departamento }}
            </span>
          </div>

          <!-- Cursos este año (tarjeta móvil) -->
          <div class="flex items-center justify-between text-xs mb-3 bg-gray-50 rounded-xl px-3 py-2">
            <span class="text-gray-500">{{ ANIO_ACTUAL }} <span class="text-gray-400">(?)</span></span>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-gray-800">{{ cursosAnioLabel(user).total }} cursos</span>
              <span v-if="cursosAnioLabel(user).progreso" class="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                {{ cursosAnioLabel(user).progreso }} en progreso
              </span>
            </div>
          </div>

          <button
            @click="abrirDetalle(user)"
            class="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl text-white w-full transition hover:brightness-110"
            style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
          >
            Ver detalle
          </button>
        </div>
      </div>

    </div>

    <!-- ════ MODAL: Detalle de usuario ════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150 ease-in"  leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div
          v-if="usuarioDetalle"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style="background: rgba(0,0,0,0.45)"
          @click.self="usuarioDetalle = null"
        >
          <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100">
            <div v-if="usuarioDetalle" class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

              <!-- Header del modal -->
              <div class="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-lg font-bold shadow-sm"
                    style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
                  >{{ usuarioDetalle.nombre.charAt(0) }}</div>
                  <div>
                    <p class="text-base font-bold text-gray-900">{{ usuarioDetalle.nombre }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', rolBadge[usuarioDetalle.rol]]">{{ rolLabel[usuarioDetalle.rol] }}</span>
                      <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', depColors[usuarioDetalle.departamento] ?? 'bg-gray-100 text-gray-600']">{{ usuarioDetalle.departamento }}</span>
                      <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', usuarioDetalle.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400']">{{ usuarioDetalle.activo ? 'Activo' : 'Inactivo' }}</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ usuarioDetalle.email }}</p>
                  </div>
                </div>
                <button @click="usuarioDetalle = null" class="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Resumen anual -->
              <div class="px-6 py-4 border-b border-gray-100">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Avance {{ ANIO_ACTUAL }} <span class="normal-case font-normal text-gray-400">(incluye en progreso)</span></p>
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-gray-50 rounded-xl p-3 text-center">
                    <p class="text-2xl font-bold text-gray-900">{{ cursosAnioLabel(usuarioDetalle).total }}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">Total {{ ANIO_ACTUAL }}</p>
                  </div>
                  <div class="bg-blue-50 rounded-xl p-3 text-center">
                    <p class="text-2xl font-bold text-[#4B7BF5]">{{ progresoAnual(usuarioDetalle).internos }} <span class="text-sm font-medium text-blue-300">/ {{ META_INTERNOS }}</span></p>
                    <p class="text-[11px] text-blue-400 mt-0.5">Internos</p>
                  </div>
                  <div class="bg-orange-50 rounded-xl p-3 text-center">
                    <p class="text-2xl font-bold text-orange-500">{{ progresoAnual(usuarioDetalle).externos }} <span class="text-sm font-medium text-orange-300">/ {{ META_EXTERNOS }}</span></p>
                    <p class="text-[11px] text-orange-400 mt-0.5">Externos</p>
                  </div>
                </div>
                <!-- Barra global meta -->
                <div class="mt-3">
                  <div class="flex justify-between text-[11px] text-gray-400 mb-1">
                    <span>Meta anual: {{ META_INTERNOS + META_EXTERNOS }} cursos ({{ META_INTERNOS }} int. + {{ META_EXTERNOS }} ext.)</span>
                    <span class="font-semibold" :class="cursosAnioLabel(usuarioDetalle).total >= META_INTERNOS + META_EXTERNOS ? 'text-green-600' : 'text-yellow-600'">
                      {{ Math.min(100, Math.round((cursosAnioLabel(usuarioDetalle).total / (META_INTERNOS + META_EXTERNOS)) * 100)) }}%
                    </span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      :style="{
                        width: `${Math.min(100, (cursosAnioLabel(usuarioDetalle).total / (META_INTERNOS + META_EXTERNOS)) * 100)}%`,
                        background: 'linear-gradient(90deg, #2B4EF0, #4B7BF5)'
                      }"
                    ></div>
                  </div>
                </div>
                <p class="text-[11px] text-gray-400 mt-2">· Histórico total: <span class="font-semibold text-gray-600">{{ usuarioDetalle.cursosHistorico }} cursos</span></p>
              </div>

              <!-- Lista de cursos del año (scroll) -->
              <div class="flex-1 overflow-y-auto px-6 py-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cursos {{ ANIO_ACTUAL }}</p>

                <div v-if="usuarioDetalle.cursosAnio.length === 0" class="text-center text-sm text-gray-400 py-6">
                  Sin cursos registrados este año.
                </div>

                <div class="space-y-2">
                  <div
                    v-for="(c, i) in usuarioDetalle.cursosAnio" :key="i"
                    class="flex items-start gap-3 p-3 rounded-xl border"
                    :class="c.estado === 'completado' ? 'border-green-100 bg-green-50' : 'border-yellow-100 bg-yellow-50'"
                  >
                    <!-- Icono estado -->
                    <div :class="['w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center', c.estado === 'completado' ? 'bg-green-200' : 'bg-yellow-200']">
                      <svg v-if="c.estado === 'completado'" class="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      <svg v-else class="w-4 h-4 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-800 truncate">{{ c.nombre }}</p>
                      <div class="flex flex-wrap gap-1.5 mt-1">
                        <span :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded-full', modalidadBadge[c.modalidad]]">{{ c.modalidad }}</span>
                        <span :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded-full', c.tipo === 'interno' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-600']">{{ c.tipo }}</span>
                        <span class="text-[10px] text-gray-400">Instructor: {{ c.instructor }}</span>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <p class="text-[10px] text-gray-400">Término</p>
                      <p class="text-xs font-semibold text-gray-600">{{ c.fechaTermino }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 border-t border-gray-100 flex justify-end">
                <button
                  @click="usuarioDetalle = null"
                  class="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:brightness-105"
                  style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
                >Cerrar</button>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ MODAL: Descargar Lista ════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modalDescargaLista" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.45)">
          <Transition name="slide-up">
            <div v-if="modalDescargaLista" class="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

              <!-- Header -->
              <div class="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 class="text-base font-bold text-gray-900">Descargar lista</h2>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ descargaAdscripcionFija
                        ? `Adscripción: ${adscripciones.find(a => a.clave === descargaAdscripcionFija)?.nombre ?? descargaAdscripcionFija}`
                        : 'Todo el personal' }}
                  </p>
                </div>
                <button @click="modalDescargaLista = false" class="text-gray-400 hover:text-gray-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Filtro de avance -->
              <div class="px-6 py-5 space-y-2">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Filtrar por avance anual</p>
                <label
                  v-for="op in nivelesDescarga" :key="op.value"
                  class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition"
                  :class="filtroDescarga === op.value
                    ? 'border-[#4B7BF5] bg-blue-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'"
                >
                  <input
                    type="radio"
                    :value="op.value"
                    v-model="filtroDescarga"
                    class="accent-[#4B7BF5]"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-gray-800">{{ op.label }}</p>
                    <p class="text-xs text-gray-400">{{ op.desc }}</p>
                  </div>
                  <span class="text-xs font-bold text-gray-400 shrink-0">
                    {{ usuariosParaDescarga.filter(u =>
                        op.value === 'todos' ? true :
                        op.value === '0' ? u.cursosAnio.length === 0 :
                        op.value === '1' ? u.cursosAnio.length === 1 :
                        op.value === '2' ? u.cursosAnio.length === 2 :
                        u.cursosAnio.length >= META_TOTAL
                      ).length }} personas
                  </span>
                </label>
              </div>

              <!-- Preview count -->
              <div class="px-6 pb-1">
                <p class="text-xs text-gray-400 text-center">
                  Se exportarán <span class="font-bold text-gray-700">{{ usuariosParaDescarga.length }}</span> registro{{ usuariosParaDescarga.length !== 1 ? 's' : '' }} en .csv
                </p>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 flex gap-2">
                <button
                  @click="modalDescargaLista = false"
                  class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  @click="ejecutarDescargaLista"
                  :disabled="usuariosParaDescarga.length === 0"
                  class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Descargar .csv
                </button>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ MODAL: Inscribir Personal ════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="modalInscribir" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.45)">
          <Transition name="slide-up">
            <div v-if="modalInscribir && cursoInscribir" class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

              <!-- Header -->
              <div class="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
                <div>
                  <h2 class="text-lg font-bold text-gray-900">Inscribir personal</h2>
                  <p class="text-sm text-gray-500 mt-0.5 truncate max-w-[420px]">{{ cursoInscribir.nombre }}</p>
                </div>
                <button @click="modalInscribir = false" class="text-gray-400 hover:text-gray-600 mt-0.5 shrink-0 ml-4">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Adscripción chips -->
              <div class="px-6 pt-4 pb-3 shrink-0">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Adscripción</p>
                <div class="flex flex-wrap gap-2">
                  <!-- Chip "Todas" -->
                  <button
                    @click="inscribirFiltroAds = ''"
                    :class="[
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition',
                      inscribirFiltroAds === ''
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-blue-300'
                    ]"
                  >
                    Todas · {{ seleccionadosInscribir.size }}/{{ usuariosTotalesInscribibles }}
                  </button>
                  <!-- Chip por adscripción -->
                  <button
                    v-for="ads in adscripcionesCursoExterno"
                    :key="ads.clave"
                    @click="inscribirFiltroAds = ads.clave"
                    :class="[
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition',
                      inscribirFiltroAds === ads.clave
                        ? 'ring-2 ring-offset-1 border-transparent'
                        : 'hover:ring-1 hover:ring-offset-1',
                      seleccionadosPorAds[ads.clave]?.seleccionados === 0
                        ? 'bg-gray-100 text-gray-500 border-gray-200 ring-gray-300'
                        : (seleccionadosPorAds[ads.clave]?.seleccionados ?? 0) < (seleccionadosPorAds[ads.clave]?.total ?? 0)
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-300 ring-yellow-400'
                          : 'bg-green-50 text-green-700 border-green-300 ring-green-400'
                    ]"
                  >
                    {{ ads.clave }} · {{ seleccionadosPorAds[ads.clave]?.seleccionados ?? 0 }}/{{ seleccionadosPorAds[ads.clave]?.total ?? 0 }}
                  </button>
                </div>
              </div>

              <!-- Search + Seleccionar todos -->
              <div class="px-6 pb-3 flex gap-2 items-center shrink-0">
                <div class="relative flex-1">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                  </svg>
                  <input
                    v-model="inscribirBusqueda"
                    type="text"
                    placeholder="Buscar por nombre, correo o adscripción…"
                    class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                  />
                </div>
                <button
                  @click="seleccionarTodosEnFiltro"
                  class="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border transition"
                  :class="todosEnFiltroSeleccionados && usuariosInscribibles.length > 0
                    ? 'bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'"
                >
                  {{ todosEnFiltroSeleccionados && usuariosInscribibles.length > 0 ? 'Quitar todos' : 'Seleccionar todos' }}
                </button>
              </div>

              <!-- User list -->
              <div class="overflow-y-auto flex-1 px-6 pb-2 min-h-0">
                <div v-if="usuariosInscribibles.length === 0" class="py-10 text-center text-sm text-gray-400">
                  No se encontraron empleados con los filtros actuales.
                </div>
                <div v-else class="divide-y divide-gray-100">
                  <label
                    v-for="u in usuariosInscribibles"
                    :key="u.id"
                    class="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 -mx-2 transition"
                    :class="seleccionadosInscribir.has(u.id) ? 'bg-blue-50/40' : ''"
                  >
                    <!-- Checkbox -->
                    <input
                      type="checkbox"
                      :checked="seleccionadosInscribir.has(u.id)"
                      @change="toggleSeleccion(u.id)"
                      class="w-4 h-4 rounded accent-blue-600 shrink-0"
                    />
                    <!-- Avatar initials -->
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      :style="{ background: u.color ?? 'linear-gradient(135deg,#2B4EF0,#4B7BF5)' }"
                    >
                      {{ u.nombre.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase() }}
                    </div>
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-800 truncate">{{ u.nombre }}</p>
                      <p class="text-xs text-gray-400 truncate">{{ u.email }}</p>
                      <p class="text-[11px] text-gray-400 truncate mt-0.5">{{ u.departamento }}</p>
                    </div>
                    <!-- Externos badge -->
                    <div class="shrink-0 flex flex-col items-center gap-0.5">
                      <span
                        class="text-xs font-bold px-2 py-0.5 rounded-full"
                        :class="u.cursosAnio.filter((c: CursoUsuario) => c.tipo === 'externo').length >= META_EXTERNOS
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-50 text-orange-500'"
                      >
                        {{ u.cursosAnio.filter((c: CursoUsuario) => c.tipo === 'externo').length }}/{{ META_EXTERNOS }}
                      </span>
                      <span class="text-[10px] text-gray-400 leading-none">ext.</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
                <span class="text-sm text-gray-500">
                  <span class="font-semibold text-gray-800">{{ seleccionadosInscribir.size }}</span>
                  seleccionado{{ seleccionadosInscribir.size !== 1 ? 's' : '' }}
                </span>
                <div class="flex gap-2">
                  <button
                    @click="modalInscribir = false"
                    class="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    @click="confirmarInscripcion"
                    :disabled="seleccionadosInscribir.size === 0"
                    class="px-5 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                    style="background: linear-gradient(135deg, #3ECFB2, #2fbfa3)"
                    :style="seleccionadosInscribir.size > 0 ? 'filter:brightness(1);' : ''"
                  >
                    Inscribir {{ seleccionadosInscribir.size > 0 ? `(${seleccionadosInscribir.size})` : '' }}
                  </button>
                </div>
              </div>

            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
