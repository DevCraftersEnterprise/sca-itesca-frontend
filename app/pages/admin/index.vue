<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
// ── Llama al usuario logeado ──
const { token } = useAuth()
// ── Trae la configuración del runtime (para la URL de la API) ──
const config = useRuntimeConfig()
// ── Controla qué vista se muestra: cursos o usuarios ──
const vista = ref<'cursos' | 'usuarios'>('cursos')
// ── Helper para formatear fechas en DD/MM/YYYY ──
const formatDate = (date: string | Date) => {
  if (!date) return 'Sin fecha';
  const dateStr = date.toString();
  const fechaParte = dateStr.split(/T| /)[0];
  if (!fechaParte) return 'Fecha inválida';
  const [year, month, day] = fechaParte.split('-');
  if (!year || !month || !day) return 'Formato inválido';
  return `${day}/${month}/${year}`;
};
// ── Refresca Todo ──
const refreshAll = async () => {
  refreshCursos()
  refreshUsuarios()
  refreshAds()
}

// ── Todo relacionado a cursos ──
// ── Filtro y contadores para la vista de cursos ──
const filtroEstadoCurso = ref<'EN_CURSO' | 'FINALIZADO' | 'POR_INSCRIBIR'>('POR_INSCRIBIR')
const totalInscribir   = computed(() => cursos.value?.filter((c: any) => c.estado === 'POR_INSCRIBIR').length)
const totalActivos     = computed(() => cursos.value?.filter((c: any) => c.estado === 'EN_CURSO').length)
const totalFinalizados = computed(() => cursos.value?.filter((c: any) => c.estado === 'FINALIZADO').length)
// ── Modal Inscribir personal (cursos externos) ──
const modalInscribir = ref(false)
const cursoInscribirId = ref<number | null>(null)
const inscribirBusqueda = ref('')
const inscribirFiltroAds = ref<string>('')
const seleccionadosInscribir = ref<Set<number>>(new Set())
// ── Crear Curso ──
const modalCrearCurso = ref(false)
// ── Modal detalle curso ──
const modalidadBadge: Record<any, string> = {
  ONLINE:     'bg-blue-50 text-blue-600 border border-blue-100',
  PRESENCIAL: 'bg-green-50 text-green-600 border border-green-100',
  Híbrido:    'bg-purple-50 text-purple-600 border border-purple-100',
}
// ── Función para asignar colores a las adscripciones (usa un hash simple para distribuir entre variantes) ──
const colorVariantes = [
  'bg-pink-100 text-pink-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-lime-100 text-lime-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-orange-100 text-orange-600',
  'bg-green-100 text-green-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
]
const depColors = (nombre: string) => {
  if (!nombre) return 'bg-gray-100 text-gray-600'
  const hash = nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const index = hash % colorVariantes.length
  return colorVariantes[index]
}
// ── Trae la lista de cursos del usuario logeado (con revalidación al cambiar el token) ──
const { data: cursos, refresh:refreshCursos } = await useAsyncData(
  'mis-cursos', () => fetchMisCursos(config, token.value),
  {
    watch: [token], 
    server: false
  }
)
// ── Función para alternar la adscripción a un curso ──
const toggleAdscripcionCurso = (id: number) => {
  const index = formNuevoCurso.value.adscripciones.indexOf(id)
  if (index > -1) {
    formNuevoCurso.value.adscripciones.splice(index, 1)
  } else {
    formNuevoCurso.value.adscripciones.push(id)
  }
}
// ── Función opcional para "Seleccionar todo" ──
const seleccionarTodasAdscripciones = () => {
  const todas = listaAdscripciones.value || []
  const seleccionadas = formNuevoCurso.value.adscripciones || []
  if (seleccionadas.length === todas.length && todas.length > 0) {
    formNuevoCurso.value.adscripciones = []
  } else {
    formNuevoCurso.value.adscripciones = todas.map((a: any) => a.id)
  }
}
// ── Formulario para nuevo curso ──
const formNuevoCurso = ref({
  nombre: '',
  descripcion: '',
  duracionHrs: 0,
  modalidad: 'PRESENCIAL',
  tipo: 'INTERNO',
  capacidad: 0,
  fechaInicio: '',
  fechaFin: '',
  horaInicio: '',
  horaFin: '',
  aula: '',
  instructorId: "",
  adscripciones: [] as any[]
})
// ── Filtrados de cursos internos y externos ──
const cursosInternos = computed(() =>
  cursos.value?.filter((c: any) => c.tipo === 'INTERNO' && c.estado === filtroEstadoCurso.value)
)
const cursosExternos = computed(() =>
  cursos.value?.filter((c: any) => c.tipo === 'EXTERNO' && c.estado === filtroEstadoCurso.value)
)
// ── Lista de solo instructores para el dropdown (filtrados del global) ──
const soloInstructores = computed(() => {
  return (todosLosUsuarios.value || []).filter(u => u.rol === 'INSTRUCTOR')
})
// ── Función para crear un nuevo curso con adscripciones ──
const crearCurso = async () => {
  try {
    await $fetch(`${config.public.apiBaseUrl}/cursos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        nombre: formNuevoCurso.value.nombre,
        descripcion: formNuevoCurso.value.descripcion,
        duracionHrs: Number(formNuevoCurso.value.duracionHrs),
        modalidad: formNuevoCurso.value.modalidad.toUpperCase(), 
        capacidad: Number(formNuevoCurso.value.capacidad),
        tipo: formNuevoCurso.value.tipo.toUpperCase(),
        fechaInicio: new Date(formNuevoCurso.value.fechaInicio).toISOString(),
        fechaFin: new Date(formNuevoCurso.value.fechaFin).toISOString(),
        horaInicio: formNuevoCurso.value.horaInicio,
        horaFin: formNuevoCurso.value.horaFin,
        aula: formNuevoCurso.value.aula,
        instructorId: formNuevoCurso.value.instructorId === "" ? null : Number(formNuevoCurso.value.instructorId),
        adscripcionesIds: formNuevoCurso.value.adscripciones 
      }
    })
    formNuevoCurso.value = {
      nombre: '',
      descripcion: '',
      duracionHrs: 0,
      modalidad: 'PRESENCIAL',
      tipo: 'INTERNO',
      capacidad: 0,
      fechaInicio: '',
      fechaFin: '',
      horaInicio: '',
      horaFin: '',
      aula: '',
      instructorId: "",
      adscripciones: []
    };
    modalCrearCurso.value = false

    await refreshCursos()
    alert("Curso registrado con sus adscripciones")
  } catch (error: any) {
    alert(error.data?.message || "Error al guardar en el servidor")
  }
}
// ── Función para abrir el modal de inscripción y resetear filtros/selections ──
const abrirInscribir = (cursoId: number) => {
  cursoInscribirId.value = cursoId
  inscribirBusqueda.value = ''
  inscribirFiltroAds.value = ''
  seleccionadosInscribir.value = new Set()
  modalInscribir.value = true
}
// ── Curso seleccionado para inscribir (null si no hay ninguno) ──
const cursoInscribir = computed(() =>
  cursoInscribirId.value !== null
    ? cursos?.value?.find((c: any) => c.id === cursoInscribirId.value) ?? null
    : null
)
// ── Lista de todos los empleados (filtrados del global) ──
const todosEmpleados = computed(() => {
  if (!todosLosUsuarios.value) return []
  return todosLosUsuarios.value.filter((u: any) => 
    u.rol?.toUpperCase().trim() === 'EMPLEADO'
  )
})
// ── Usuarios disponibles según filtro y búsqueda ──
const usuariosInscribibles = computed(() => {
  if (!cursoInscribir.value || !todosEmpleados.value) return []
  const inscritosIds = cursoInscribir.value.empleados?.map((p: any) => p.usuario.id) || []
  const adsValidas = new Set(
    cursoInscribir.value.adscripciones?.map((a: any) => a.adscripcion.clave) || []
  )
  const q = inscribirBusqueda.value.toLowerCase().trim()
  
  return todosEmpleados?.value?.filter((u: any) => {
    if (inscritosIds.includes(u.id)) return false
    const deptoUsuario = u.adscripcion?.clave
    const depMatch = inscribirFiltroAds.value
      ? u.adscripcion?.clave === inscribirFiltroAds.value
      : adsValidas.has(deptoUsuario)
      if (!depMatch) return false
    if (!q) return true

    const nombre = (u.nombres || "").toLowerCase()
    const email = (u.correo || "").toLowerCase()
    const clave = (u.adscripcion?.clave || "").toLowerCase()

    return nombre.includes(q) || email.includes(q) || clave.includes(q)
  }) || []
})
// ── Total de usuarios en TODAS las adscripciones del curso (para el chip "Todas") ──
const usuariosTotalesInscribibles = computed(() => {
  if (!cursoInscribir.value || !usuariosInscribibles.value) return 0
  
  const adsValidas = new Set(
    cursoInscribir.value.adscripciones?.map((a: any) => a.adscripcion.nombre) || []
  )

  return usuariosInscribibles.value.filter((u: any) => 
    adsValidas.has(u.adscripcion?.nombre)
  ).length
})
// ── Adscripciones del curso externo seleccionado (usa claves) ──
const adscripcionesCursoExterno = computed(() => {
  if (!cursoInscribir.value || !listaAdscripciones?.value) return []
  const clavesDelCurso = cursoInscribir.value.adscripciones.map((a: any) => 
    a.adscripcion?.clave || a.clave
  )
  return listaAdscripciones?.value?.filter(a =>
    clavesDelCurso.includes(a.clave)
  )
})
// ── Función para confirmar la inscripción masiva y mandarlo a la api ──
const confirmarInscripcion = async () => {
  if (seleccionadosInscribir.value.size === 0 || !cursoInscribirId.value) {
    console.warn('No hay usuarios seleccionados o falta el ID del curso');
    return;
  }

  try {
    const payload = {
      cursoId: cursoInscribirId.value,
      usuarioIds: Array.from(seleccionadosInscribir.value)
    };
    await $fetch(`${config.public.apiBaseUrl}/cursos/inscribir-masivo`, {
      method: 'POST',
      body: payload,
      headers: {
        'Authorization': `Bearer ${token.value}` 
      }
    });

    await refreshAll()
    console.log('Personal inscrito exitosamente:', payload);
    modalInscribir.value = false;
    seleccionadosInscribir.value = new Set();

  } catch (error) {
    console.error('Error al inscribir personal:', error);
  }
}
// ── Conteo de seleccionados por adscripción ──
const seleccionadosPorAds = computed(() => {
  const map: Record<string, { seleccionados: number; total: number }> = {}
  const inscritosIds = cursoInscribir.value.empleados?.map((p: any) => p.usuario?.id) || []
  const adsValidasNombres = new Set(
    cursoInscribir.value.adscripciones?.map((a: any) => a.adscripcion?.nombre) || []
  )
  for (const ads of (adscripcionesCursoExterno.value as any[])) {
    const key = ads.clave
    const nombreAds = ads.nombre
    const empleadosDisponiblesDeEsteDepto = (todosEmpleados?.value || []).filter((u: any) => {
      const esDeEsteDepto = u.adscripcion?.clave === key || u.adscripcion?.nombre === nombreAds
      const noInscrito = !inscritosIds.includes(u.id)
      return esDeEsteDepto && noInscrito
    })
    const total = empleadosDisponiblesDeEsteDepto.length || 0
    const seleccionados = empleadosDisponiblesDeEsteDepto.filter((u: any) => 
      seleccionadosInscribir.value.has(u.id)
    ).length || 0
    map[key] = { seleccionados, total }
  }
  return map
})
// ── Función para alternar la selección de un usuario en la lista de inscripción ──
const toggleSeleccion = (id: number) => {
  const s = new Set(seleccionadosInscribir.value)
  s.has(id) ? s.delete(id) : s.add(id)
  seleccionadosInscribir.value = s
}
// ── Función para alternar la selección de todos los usuarios visibles en el filtro ──
const seleccionarTodosEnFiltro = () => {
  const s = new Set(seleccionadosInscribir.value)
  const todos = usuariosInscribibles?.value?.map(u => u.id)
  const todosSeleccionados = todos?.every(id => s.has(id))
  if (todosSeleccionados) {
    todos?.forEach(id => s.delete(id))
  } else {
    todos?.forEach(id => s.add(id))
  }
  seleccionadosInscribir.value = s
}
// ── Computed para saber si TODOS los usuarios del filtro están seleccionados (para el checkbox "Seleccionar todo") ──
const todosEnFiltroSeleccionados = computed(() =>
  usuariosInscribibles?.value?.length > 0 &&
  usuariosInscribibles?.value?.every(u => seleccionadosInscribir?.value?.has(u.id))
)

// ── Todo relacionado a usuarios ──

// ── Constantes para metas y año actual (ajusta META_INTERNOS y META_EXTERNOS según tus objetivos) ──
const ANIO_ACTUAL = new Date().getFullYear()
const META_INTERNOS = 2
const META_EXTERNOS = 1
const META_TOTAL = META_INTERNOS + META_EXTERNOS
// ── Mapas para mostrar el rol con un badge de color y etiqueta legible ──
const rolBadge: Record<string, string> = {
  ADMIN:      'bg-blue-100 text-[#4B7BF5]',
  EMPLEADO:   'bg-green-100 text-green-700',
  INSTRUCTOR: 'bg-orange-100 text-orange-600',
}
const rolLabel: Record<string, string> = {
  ADMIN: 'Admin', EMPLEADO: 'Empleado', INSTRUCTOR: 'Instructor',
}
// ── Opciones para el filtro de estado de usuario ──
const estadoOpciones = [
  { label: 'Todos',    value: '' },
  { label: 'Activos',  value: 'ACTIVO' },
  { label: 'Inactivos',value: 'INACTIVO' },
] as const
// ── Interfaces para tipar los datos de adscripciones y usuarios (ajusta según tu API) ──
interface Adscripcion {
  id: number;
  clave: string;
  nombre?: string;
  usuarios: Usuario[];
}
interface Usuario { 
  id: number
  nombres: string
  apellidos: string
  rol: 'ADMIN' | 'EMPLEADO' | 'INSTRUCTOR'
  adscripcion: string
  correo: string
  estado: 'ACTIVO' | 'INACTIVO'
}
// ── Modal y Detalles Adscripcion ──
const modalAdscripcion  = ref(false)
const mostrarAdscripciones = ref(false)
const adscripcionDetalleActiva = ref<string | null>(null)
// ── Traemos la lista de adscripciones (con usuarios incluidos) ──
const { data: listaAdscripciones, refresh: refreshAds} = await useAsyncData<Adscripcion[]>('adscripciones', () =>
  $fetch(`${config.public.apiBaseUrl}/adscripcion`, {
    headers: { Authorization: `Bearer ${token.value}` }
  })
)
// ── Traemos la lista de TODOS los usuarios (para filtros globales y creación manual) ──
const { data: todosLosUsuarios, refresh: refreshUsuarios } = await useAsyncData<Usuario[]>('usuarios', () => 
  $fetch(`${config.public.apiBaseUrl}/usuarios`, {
    headers: { Authorization: `Bearer ${token.value}` }
  })
)
// ── Filtros de usuarios ──
const filtroRol    = ref('')
const filtroDepto  = ref('')
const filtroEstado = ref<'' | 'ACTIVO' | 'INACTIVO'>('')
const usuariosFiltrados = computed(() =>
  todosLosUsuarios?.value?.filter((u:any) => {
    if (filtroRol.value.toUpperCase()   && u.rol !== filtroRol.value.toUpperCase())   return false
    if (filtroDepto.value && u.adscripcion.nombre  !== filtroDepto.value) return false
    if (filtroEstado.value && u.estado !== filtroEstado.value.toUpperCase()) {
      return false
    }
    return true
  })
)
// ── Modales para creación de usuarios (manual y CSV) ──
const modalCrearUsuario = ref(false)
const modalUsuarioManual = ref(false)
const modalUsuarioCSV    = ref(false)
// ── Formulario para nuevo usuario (creación manual) ──
const formNuevoUsuario = reactive({
  nomina:      '',
  nombre:      '',
  apellido:    '',
  correo:      '',
  password:    '',
  rol:         'EMPLEADO' as 'ADMIN' | 'EMPLEADO' | 'INSTRUCTOR',
  puesto:      '',
  adscripcion: "",
})
// ── Función para crear un nuevo usuario con adscripción (creación manual) ──
const crearUsuarioManual = async () => {
  try {
    await $fetch(`${config.public.apiBaseUrl}/usuarios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        nomina: formNuevoUsuario.nomina,
        nombres: formNuevoUsuario.nombre,
        apellidos: formNuevoUsuario.apellido,
        correo: formNuevoUsuario.correo,
        contrasena: formNuevoUsuario.password,
        rol: formNuevoUsuario.rol,
        puesto: formNuevoUsuario.puesto,
        adscripcionId: Number(formNuevoUsuario.adscripcion),
      }
    })
    
    modalUsuarioManual.value = false
    await refreshAll()
    Object.assign(formNuevoUsuario, { nomina: '', nombre: '', apellido: '', correo: '', password: '', rol: 'EMPLEADO', puesto: '', adscripcion: "" })
    alert("usuario registrado con sus adscripciones")
  } catch (error: any) {
    alert(error.data?.message || "Error al guardar en el servidor")
  }
  
}
// ── Variables para manejo de CSV ──
const archivoCSV = ref<File | null>(null)
const errorCSV   = ref('')
const rolesValidos = ['ADMIN', 'EMPLEADO', 'INSTRUCTOR']
const datosPrecargados = ref<any[]>([])
// ── Función para manejar el cambio de archivo en la carga CSV, con validaciones básicas y preprocesamiento para mostrar un resumen antes de subir ──
const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  errorCSV.value = ''
  if (file && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
    errorCSV.value = 'Solo se aceptan archivos .csv, .xlsx o .xls'
    archivoCSV.value = null
    return
  }
  archivoCSV.value = file
  if (file && file.name.endsWith('.csv')) {
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const filas = content.split('\n').map(linea => linea.trim()).filter(linea => linea !== "")
      
      if (filas.length > 1) {
        const encabezados = filas?.[0]?.split(',').map(h => h.trim().toLowerCase())
        const cuerpo = filas.slice(1)

        datosPrecargados.value = cuerpo.map(fila => {
          const valores = fila.split(',')
          const obj: any = {}
          encabezados?.forEach((h, i) => {
            obj[h] = valores[i] || ''
          })
          return obj
        })
        validarDatosCSV()
      }
    }
    reader.readAsText(file)
  } else if (file) {
    // Si es Excel, aquí podrías avisar que se procesará directamente en el servidor
    // o usar la librería XLSX si la tienes instalada.
    console.log("Archivo Excel detectado: se enviará directo al backend.")
  }
}
// ── Función para validar los datos precargados del CSV, marcando cuáles filas tienen adscripciones o roles no válidos según las listas actuales, y generando un mensaje de error si se detectan problemas ──
const validarDatosCSV = () => {
  const clavesExistentes = new Set(
    listaAdscripciones?.value?.map(a => a.clave)
  )
  datosPrecargados.value = datosPrecargados.value.map(user => {
    const claveCsv = (user.adscripcion || "").trim().toUpperCase()
    const rolCsv = (user.rol || "").trim().toUpperCase()
    return {
      ...user,
      adscripcionValida: clavesExistentes.has(claveCsv),
      rolValido: rolesValidos.includes(rolCsv)

    }
  })
  const erroresAds = datosPrecargados.value.filter(u => !u.adscripcionValida).length
  const erroresRol = datosPrecargados.value.filter(u => !u.rolValido).length
  if (erroresAds > 0 || erroresRol > 0) {
    errorCSV.value = `Se detectaron errores: ${erroresAds} adscripciones y ${erroresRol} roles no válidos.`
  } else {
    errorCSV.value = ''
  }
}
// ── Función para subir el CSV al backend, con una confirmación previa si se detectan errores en las adscripciones, y reseteando el estado del formulario después de la carga ──
const subirCSV = () => {
  const tieneErrores = datosPrecargados.value.some(u => !u.adscripcionValida)
  if (!archivoCSV.value) { errorCSV.value = 'Selecciona un archivo primero'; return }
  // TODO: subir a API con FormData
  console.log('--- Resumen de Carga ---')
  console.log('Archivo:', archivoCSV.value.name)
  console.log('Total de registros:', datosPrecargados.value.length)
  console.table(datosPrecargados.value) 
  if (tieneErrores) {
    alert('El archivo contiene registros con adscripciones no válidas. Corrige los errores antes de subir.')
    return
  }
  archivoCSV.value = null
  datosPrecargados.value = [] 
  modalUsuarioCSV.value = false
  errorCSV.value = ''
}
// ── Formulario para nueva adscripción ──
const formAdscripcion = reactive({ nombre: '', clave: '' })
// ── Función para crear una nueva adscripción ──
const guardarAdscripcion = async () => {
  try {
    await $fetch(`${config.public.apiBaseUrl}/adscripcion`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        clave: formAdscripcion.clave,
        nombre: formAdscripcion.nombre,
      }
    })
    formAdscripcion.nombre = ''
    formAdscripcion.clave  = ''
    modalAdscripcion.value = false
    await refreshAds()
    alert("Curso registrado con sus adscripciones")
  } catch (error: any) {
    alert(error.data?.message || "Error al guardar en el servidor")
  }
}
// ── Detalle de usuario ──
const usuarioDetalle = ref<any | null>(null)
const abrirDetalle = (u: any) => { usuarioDetalle.value = u }
// ── Computed para obtener el usuario en detalle con su adscripción completa (en caso de que solo venga la clave) ──
const usuarioEnDetalle = computed(() => {
  const u = todosLosUsuarios?.value?.find((u: any) => u.id === usuarioDetalle?.value?.id);
  if (!u) return null;
  return (u as unknown) as { 
    adscripcion?: { clave: string; nombre: string } 
  };
});
// ── Computed para obtener la lista de usuarios de la adscripción activa en el panel (usado en el modal de detalle de adscripción) ──
const usuariosAdscripcionActiva = computed(() => {
  if (!adscripcionDetalleActiva.value || !listaAdscripciones.value) return []

  const ads = listaAdscripciones.value.find((a: any) => a.clave === adscripcionDetalleActiva.value)

  return ads ? ads.usuarios : []
})
// ── Función para calcular el progreso anual de un empleado (cursos inscritos en el año actual, separados por tipo y estado) ──
const progresoAnual = (empleadoId: number) => {
  const cursosDelAño = (cursos.value || []).map((curso: any) => {
    // Buscamos la relación específica de este empleado con este curso
    const relacionEmpleado = curso.empleados?.find((p: any) => p.usuario.id === empleadoId);
    
    return {
      ...curso,
      // Guardamos la info de la relación (donde está la calificación)
      infoRelacion: relacionEmpleado 
    };
  }).filter((curso: any) => {
    const fechaCurso = new Date(curso.fechaInicio);
    // Solo si está inscrito y es del año actual
    return curso.infoRelacion && fechaCurso.getFullYear() === ANIO_ACTUAL;
  });
  return {
    internos: cursosDelAño.filter((c:any) => 
      c.tipo === 'INTERNO' && 
      c.estado === 'FINALIZADO' &&
      c.infoRelacion.calificacion=== 'APROBADO'  // Solo contamos como completados los internos con calificación >= 80
    ),
    externos: cursosDelAño.filter((c:any) => 
      c.tipo === 'EXTERNO' &&
      c.estado === 'FINALIZADO' &&
      c.infoRelacion.estado=== 'VALIDADO'
    ),
    encurso: cursosDelAño.filter((c:any) => c.estado === 'EN_CURSO'),
    inscribirse: cursosDelAño.filter((c:any) => c.estado === 'POR_INSCRIBIR'),
    finalizado: cursosDelAño.filter((c:any) => c.estado === 'FINALIZADO'),
    total: cursosDelAño.length
  };
}
// ── Función para obtener los cursos del año actual de un empleado, separados por su rol (empleado o instructor) ──
const cursosAnoActual = (empleadoId: number) => {
  const empleado = todosLosUsuarios?.value?.find(u => u.id === empleadoId)
  if(empleado?.rol === 'EMPLEADO') 
    return (cursos.value || []).filter((curso:any) => {
    const fechaCurso = new Date(curso.fechaFin);
    const estaInscrito = curso.empleados?.some((p: any) => p.usuario.id === empleadoId);
    return estaInscrito && fechaCurso.getFullYear() === ANIO_ACTUAL;
  });
  else if(empleado?.rol === 'INSTRUCTOR')
    return (cursos.value || []).filter((curso:any) => {
      const fechaCurso = new Date(curso.fechaFin);
      const esInstructor = curso.instructor?.id === empleadoId;
      return esInstructor && fechaCurso.getFullYear() === ANIO_ACTUAL;
    });
  else
    return []
  
}
// ── Función para obtener el progreso anual de un empleado en formato de conteo y porcentaje (usado para mostrar el avance en la vista de usuarios) ──
const cursosAnioLabel = (empleadoId: number) => {
  const total     = progresoAnual(empleadoId).total
  const progreso  = progresoAnual(empleadoId).encurso.length + progresoAnual(empleadoId).inscribirse.length
  const completos = total - progreso
  return { total, progreso, completos }
}
// ── Función para obtener el histórico completo de cursos de un usuario, sin filtrar por año (usado para mostrar el detalle del progreso en el modal de usuario) ──
const cursoHistorico = (u: any) => {
  if (u.rol === 'EMPLEADO') 
    return (cursos.value || []).filter((curso:any) =>
      curso.empleados?.some((p: any) => p.usuario.id === u.id)
    );
  else if (u.rol === 'INSTRUCTOR')
    return (cursos.value || []).filter((curso:any) => curso.instructor?.id === u.id);
  else
    return []
}






// ── Descargar Lista ──
const modalDescargaLista = ref(false)
const descargaAdscripcionFija = ref<string | null>(null)  // null = todas, string = filtrada por adscripción
const filtroDescarga = ref<'todos' | '0' | '1' | '2' | '3'>('todos')
// Descargar plantilla CSV
const descargarPlantilla = () => {
  const encabezados = ['nomina', 'nombres', 'apellidos', 'correo', 'contrasena', 'rol', 'puesto', 'adscripcion']
  const ejemplo     = ['12345', 'Juan', 'García', 'jgarcia@itesca.edu.mx', 'Temporal123!', 'empleado', 'Docente', 'ISC']
  const csv = [encabezados.join(','), ejemplo.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'plantilla_usuarios.csv'; a.click()
  URL.revokeObjectURL(url)
}

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
  return todosLosUsuarios?.value?.filter((u:any) => {
    // Filtro por adscripción fija (si venimos desde el panel de una adscripción)
    if (descargaAdscripcionFija.value) {
      const ads = listaAdscripciones?.value?.find((a:any) => a.clave === descargaAdscripcionFija.value)
      if (!ads) return false
      if (u.departamento !== ads.clave && u.departamento !== ads.nombre) return false
    }
    // Filtro por nivel de avance
    const total = cursoHistorico(u).filter((c:any) => new Date(c.fechaInicio).getFullYear() === ANIO_ACTUAL).length
    if (filtroDescarga.value === '0') return total === 0
    if (filtroDescarga.value === '1') return total === 1
    if (filtroDescarga.value === '2') return total === 2
    if (filtroDescarga.value === '3') return total >= META_TOTAL
    return true // 'todos'
  })
})

const ejecutarDescargaLista = () => {
  const ads = descargaAdscripcionFija.value
    ? listaAdscripciones?.value?.find((a:any) => a.clave === descargaAdscripcionFija.value)
    : null
  const filas: any[] = []
  const csv = filas.map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const nombre = ads ? `lista_${ads.clave}_${ANIO_ACTUAL}` : `lista_personal_${ANIO_ACTUAL}`
  a.href = url; a.download = `${nombre}.csv`; a.click()
  URL.revokeObjectURL(url)
  modalDescargaLista.value = false
}
</script>

<template>
  <div>

    <!-- ── Barra de acciones TEMRINADO ── -->
    <div class="flex flex-col gap-3 mb-8">

      <!-- Fila 1: toggles -->
      <div class="flex items-center gap-3 flex-wrap">

        <!-- Sub-toggle Por Inscribir / En curso / Finalizados (solo en vista cursos) -->
        <div v-if="vista === 'cursos'" class="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            @click="filtroEstadoCurso = 'POR_INSCRIBIR'"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
              filtroEstadoCurso === 'POR_INSCRIBIR' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            ]">
            <span class="w-1.5 h-1.5 rounded-full bg-yellow-600 inline-block"></span>
            Por Inscribir
            <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full', filtroEstadoCurso === 'POR_INSCRIBIR' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-400']">{{ totalInscribir }}</span>
          </button>
          <button
            @click="filtroEstadoCurso = 'EN_CURSO'"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
              filtroEstadoCurso === 'EN_CURSO' ? 'bg-white text-[#4B7BF5] shadow-sm' : 'text-gray-400 hover:text-gray-600'
            ]">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
            En curso
            <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full', filtroEstadoCurso === 'EN_CURSO' ? 'bg-blue-50 text-[#4B7BF5]' : 'bg-gray-200 text-gray-400']">{{ totalActivos }}</span>
          </button>
          <button
            @click="filtroEstadoCurso = 'FINALIZADO'"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
              filtroEstadoCurso === 'FINALIZADO' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            ]">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"></span>
            Finalizados
            <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full', filtroEstadoCurso === 'FINALIZADO' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-400']">{{ totalFinalizados }}</span>
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

    <!-- ════ MODAL: Nueva adscripción TERMINADO ════ -->
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

    <!-- ════ MODAL: Crear Curso TERMINADO ════ -->
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
                    <input v-model.number="formNuevoCurso.duracionHrs" type="number" min="1" max="999" placeholder="Ej. 8"
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
                      <button type="button" v-for="mod in ([
                        { val: 'PRESENCIAL', label: 'Presencial' },
                        { val: 'ONLINE', label: 'Online' },
                        ])" :key="mod.val"
                        @click="formNuevoCurso.modalidad = mod.val"
                        :class="[
                          'py-2 rounded-xl text-xs font-bold transition border text-left px-3',
                          formNuevoCurso.modalidad === mod.val
                            ? mod.val === 'ONLINE' ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : mod.val === 'PRESENCIAL' ? 'bg-green-50 text-green-600 border-green-200'
                              : 'bg-purple-50 text-purple-600 border-purple-200'
                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                        ]">{{ mod.label }}</button>
                    </div>
                  </div>
                  <!-- Aula -->
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <div v-if="formNuevoCurso.modalidad === 'PRESENCIAL' && formNuevoCurso.tipo === 'interno'">
                        Aula
                      </div>  
                      <div v-else-if="formNuevoCurso.modalidad === 'PRESENCIAL' && formNuevoCurso.tipo === 'externo'">
                        Ubicacion
                      </div>
                      <div v-else-if="formNuevoCurso.modalidad === 'ONLINE'">
                        Link de acceso
                      </div>
                      <div v-else>
                        Aula / Link
                      </div>
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
                <div v-if="formNuevoCurso.tipo === 'interno'">
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Instructor</label>
                  <select v-model="formNuevoCurso.instructorId"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition cursor-pointer">
                    <option value=""  >— Pendiente de asignar —</option>
                    <option v-for="inst in (soloInstructores || [])" :key="inst.id" :value="inst.id">{{ inst.nombres }} {{ inst.apellidos }}</option>
                  </select>
                </div>

                <!-- Adscripciones -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Adscripciones</label>
                    <button type="button" @click="seleccionarTodasAdscripciones"
                      class="text-xs font-semibold text-[#4B7BF5] hover:text-[#2B4EF0] transition">
                      {{ formNuevoCurso.adscripciones.length === listaAdscripciones?.length ? 'Deseleccionar todo' : 'Seleccionar todo' }}
                    </button>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      v-for="ads in (listaAdscripciones || [])"
                      :key="ads.id"
                      @click="toggleAdscripcionCurso(ads.id)"
                      :class="[
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition text-left',
                        formNuevoCurso.adscripciones.includes(ads.id)
                          ? 'bg-[#4B7BF5] text-white border-[#4B7BF5] shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#4B7BF5] hover:text-[#4B7BF5]'
                      ]">
                      <div :class="[
                        'w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center',
                        formNuevoCurso.adscripciones.includes(ads.id)
                          ? 'border-white bg-white/20'
                          : 'border-gray-300'
                      ]">
                        <svg v-if="formNuevoCurso.adscripciones.includes(ads.id)" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
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

    <!-- ════ MODAL: Selector Crear Usuario TERMINADO ════ -->
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

    <!-- ════ MODAL: Registro Manual TERMINADO ════ -->
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
                      <option value="EMPLEADO">Empleado</option>
                      <option value="INSTRUCTOR">Instructor</option>
                      <option value="ADMIN">Admin</option>
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
                    <option v-for="ads in listaAdscripciones" :key="ads.id" :value="ads.id">
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

    <!-- ════════════════ VISTA: CURSOS TERMINADO ════════════════ -->
    <div v-if="vista === 'cursos'">

      <!-- Cursos Internos -->
      <section v-if="cursosInternos?.length || 0" class="mb-10">
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
                v-for="dep in curso.adscripciones" :key="dep"
                :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full', depColors(dep.adscripcion.clave) ?? 'bg-gray-100 text-gray-600']"
              >{{ dep.adscripcion.clave }}</span>
            </div>

            <!-- Nombre y descripción -->
            <h3 class="text-sm font-bold text-gray-900 text-center mb-1">{{ curso.nombre }}</h3>
            <p class="text-xs text-gray-400 text-center mb-4 line-clamp-2">{{ curso.descripcion }}</p>

            <!-- Modalidad y Instructor -->
            <div class="space-y-2 text-xs mb-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Modalidad</span>
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-medium', modalidadBadge[curso.modalidad]]">{{ curso.modalidad }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Instructor</span>
                <span v-if="curso.instructor" class="font-medium text-gray-700 truncate max-w-[130px]">
                  {{ curso.instructor.nombres }} {{ curso.instructor.apellidos }}
                </span>
                <span v-else class="text-sm italic text-gray-400">
                  Por asignar
                </span>
              </div>
            </div>

            <!-- Barra de progreso -->
            <div class="mb-4">
              <div class="flex justify-between text-[10px] text-gray-400 mb-1.5">
                <span>Inscritos</span>
                <span class="font-semibold text-gray-600">{{ curso.empleados.length }} / {{ curso.capacidad }}</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${(curso.empleados.length / curso.capacidad) * 100}%`, background: 'linear-gradient(90deg, #2B4EF0, #5B9CF8)' }"
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
            <div v-if="curso.estado === 'FINALIZADO'" class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400">
              <svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              Finalizado {{ formatDate(curso.fechaFin) ? ` el ${formatDate(curso.fechaFin)}` : '' }}
            </div>
          </div>
        </div>
      </section>

      <!-- Cursos Externos -->
      <section v-if="cursosExternos?.length || 0">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full inline-block" style="background:#FF8B5E"></span>
          Cursos Externos
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="curso in cursosExternos" :key="curso.id"
            :class="['bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col', curso.estado === 'finalizado' ? 'border-gray-100 opacity-80' : 'border-gray-100']"
          >
            <!-- Badges de Adscripciones -->
            <div class="flex flex-wrap gap-1 mb-3">
              <span
                v-for="dep in (curso.adscripciones as any[])" :key="dep"
                :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full', depColors(dep.adscripcion.clave) ?? 'bg-gray-100 text-gray-600']"
              >{{ dep.adscripcion.clave }}</span>
            </div>
            <!-- Nombre y descripción -->
            <h3 class="text-sm font-bold text-gray-900 text-center mb-1">{{ curso.nombre }}</h3>
            <p class="text-xs text-gray-400 text-center mb-4 line-clamp-2">{{ curso.descripcion }}</p>
            <!-- Modalidad y Aula -->
            <div class="space-y-2 text-xs mb-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Modalidad</span>
                <span :class="['px-2 py-0.5 rounded-full text-[10px] font-medium', modalidadBadge[curso.modalidad]]">{{ curso.modalidad }}</span>
              </div>
              <div v-if="curso.aula" class="flex items-center justify-between">
                <span class="text-gray-400">Sitio</span>
                <a v-if="curso.modalidad === 'PRESENCIAL'" class="text-[#4B7BF5] font-medium truncate max-w-[140px]" >
                  {{ curso.aula }}
                </a>
                <a v-else-if="curso.modalidad === 'ONLINE'" :href="curso.aula" target="_blank" rel="noopener noreferrer"  class="text-[#4B7BF5] hover:underline font-medium truncate max-w-[140px]">
                  {{ curso.aula }}
                </a>
              </div>
            </div>
            <!-- Barra de progreso -->
            <div class="mb-4">
              <div class="flex justify-between text-[10px] text-gray-400 mb-1.5">
                <span>Inscritos</span>
                <span class="font-semibold text-gray-600">{{ curso.empleados.length }} / {{ curso.capacidad }}</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :style="{ width: `${(curso.empleados.length / curso.capacidad) * 100}%`, background: 'linear-gradient(90deg, #FF8B5E, #F5C242)' }"
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
              <button v-if="curso.empleados.length < curso.capacidad"
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
            <div v-if="curso.estado === 'FINALIZADO'" class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-gray-400">
              <svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              Finalizado{{ formatDate(curso.fechaFin) ? ` el ${formatDate(curso.fechaFin)}` : '' }}
            </div>
          </div>
        </div>
      </section>

      <!-- Estado vacío -->
      <div v-if="!cursosInternos?.length && !cursosExternos?.length" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-400">No hay cursos {{ filtroEstadoCurso === 'EN_CURSO' ? 'en curso' : 'finalizados' }}</p>
        <p v-if="filtroEstadoCurso === 'EN_CURSO'" class="text-xs text-gray-300 mt-1">Crea un nuevo curso para comenzar</p>
      </div>

    </div>

    <!-- ════════════════ VISTA: USUARIOS TERMINADO ════════════════ -->
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
              v-for="ads in listaAdscripciones" :key="ads.id"
              @click="adscripcionDetalleActiva = adscripcionDetalleActiva === ads.clave ? null : ads.clave"
              :class="[
                'bg-white rounded-xl border shadow-sm p-4 flex flex-col items-center text-center transition cursor-pointer',
                adscripcionDetalleActiva === ads.clave
                  ? 'border-[#4B7BF5] ring-2 ring-[#4B7BF5]/20 shadow-md'
                  : 'border-gray-100 hover:shadow-md hover:border-gray-200'
              ]"
            >
              <span :class="['text-xs font-bold px-2.5 py-1 rounded-full mb-2', depColors(ads.clave) ?? 'bg-gray-100 text-gray-600']">{{ ads.clave }}</span>
              <p class="text-xs font-semibold text-gray-800 leading-tight mb-1">{{ ads.nombre }}</p>
              <p class="text-[11px] text-gray-400">{{ ads.usuarios.length }} empleados</p>
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
                  <span :class="['text-xs font-bold px-2.5 py-1 rounded-full', depColors(listaAdscripciones?.find((a: any) => a.clave === adscripcionDetalleActiva)?.nombre ?? '') ?? 'bg-gray-100 text-gray-600']">
                    {{ adscripcionDetalleActiva }}
                  </span>
                  <span class="text-sm font-semibold text-gray-800">
                    {{ listaAdscripciones?.find((a: any) => a.clave === adscripcionDetalleActiva)?.nombre }}
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
                  v-for="u in (usuariosAdscripcionActiva as any[])" :key="u.id"
                  class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                  @click="abrirDetalle(u)"
                >
                  <!-- Avatar -->
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    :style="{ background: 'linear-gradient(135deg,#2B4EF0,#4B7BF5)' }"
                  >
                    {{ u.nombres.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase() }}
                  </div>
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{{ u.nombres }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ u.correo }}</p>
                  </div>
                  <!-- Rol badge -->
                  <span :class="['shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full', rolBadge[u.rol]]">
                    {{ rolLabel[u.rol] }}
                  </span>
                  <!-- Avance cursos anuales -->
                  <div v-if="u.rol === 'EMPLEADO'" class="shrink-0 flex flex-col items-end gap-0.5 min-w-[72px]">
                    <div class="flex gap-1 text-[11px] font-semibold">
                      <span class="text-[#4B7BF5]">{{ progresoAnual(u.id).internos.length }}/{{ META_INTERNOS }}</span>
                      <span class="text-gray-300">·</span>
                      <span :class="progresoAnual(u.id).externos.length >= META_EXTERNOS ? 'text-green-600' : 'text-orange-400'">
                        {{ progresoAnual(u.id).externos.length }}/{{ META_EXTERNOS }}
                      </span>
                    </div>
                    <div class="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :style="{
                          width: `${Math.min(100, Math.round((progresoAnual(u.id).total / META_TOTAL) * 100))}%`,
                          background: progresoAnual(u.id).total >= META_TOTAL ? '#7DD87A' : progresoAnual(u.id).total > 0 ? '#F5C242' : '#e5e7eb'
                        }"
                      ></div>
                    </div>
                    <span class="text-[10px] text-gray-400 leading-none">
                      {{ Math.min(100, Math.round((progresoAnual(u.id).total / META_TOTAL) * 100)) }}% avance
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
          <option v-for="ads in listaAdscripciones" :key="ads.id" :value="ads.nombre">{{ ads.nombre }}</option>
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
          {{ usuariosFiltrados?.length }} resultado{{ usuariosFiltrados?.length !== 1 ? 's' : '' }}
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
                {{ ANIO_ACTUAL }}
              </th>
              <th class="px-4 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Histórico</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="px-4 py-3.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="usuariosFiltrados?.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-sm text-gray-400">Sin resultados para los filtros seleccionados.</td>
            </tr>
            <tr v-for="user in (usuariosFiltrados as any[])" :key="user.id" class="hover:bg-gray-50 transition">
              <td class="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{{ user.nombres }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ user.correo }}</td>
              <td class="px-4 py-3">
                <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', rolBadge[user.rol]]">{{ rolLabel[user.rol] }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ user?.adscripcion?.nombre }}</td>
              <!-- Cursos este año -->
              <td v-if="user.rol === 'EMPLEADO'" class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <span class="text-sm font-bold text-gray-800">{{ cursosAnioLabel(user.id).total ||0 }}</span>
                  <span
                    v-if="cursosAnioLabel(user.id).progreso > 0"
                    class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700"
                    :title="`${cursosAnioLabel(user.id).progreso} en progreso`"
                  >+{{ cursosAnioLabel(user.id).progreso }}</span>
                  <!-- indicador visual meta -->
                  <span
                    :class="[
                      'ml-1 w-2 h-2 rounded-full flex-shrink-0',
                      cursosAnioLabel(user.id).total >= META_INTERNOS + META_EXTERNOS ? 'bg-green-400' :
                      cursosAnioLabel(user.id).total > 0 ? 'bg-yellow-400' : 'bg-gray-200'
                    ]"
                    :title="`Meta: ${META_INTERNOS} internos + ${META_EXTERNOS} externo`"
                  ></span>
                </div>
                <!-- mini barra progreso internos/externos -->
                <div class="flex gap-0.5 mt-1 justify-center">
                  <div
                    v-for="i in META_INTERNOS" :key="'i'+i"
                    :class="['w-3 h-1 rounded-full', progresoAnual(user.id).internos >= i ? 'bg-[#4B7BF5]' : 'bg-gray-200']"
                  ></div>
                  <div class="w-1"></div>
                  <div
                    v-for="e in META_EXTERNOS" :key="'e'+e"
                    :class="['w-3 h-1 rounded-full', progresoAnual(user.id).externos >= e ? 'bg-orange-400' : 'bg-gray-200']"
                  ></div>
                </div>
              </td>
              <td v-else class="px-4 py-3 text-center">
                <span class="text-sm font-bold text-gray-800">No aplica</span>
              </td>
              <!-- Histórico -->
              <td v-if="user.rol !== 'ADMIN'" class="px-4 py-3 text-center">
                <span class="text-sm font-bold text-gray-600">{{ cursoHistorico(user).length }}</span>
              </td>
              <td v-else class="px-4 py-3 text-center">
                <span class="text-sm font-bold text-gray-600">No aplica</span>
              </td>
              <td class="px-4 py-3">
                <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', user.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400']">
                  {{ user.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
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
        <p v-if="usuariosFiltrados?.length === 0" class="text-center text-sm text-gray-400 py-10">
          Sin resultados para los filtros seleccionados.
        </p>
        <div
          v-for="user in (usuariosFiltrados as any[])" :key="user.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <!-- Avatar inicial -->
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
              >
                {{ user.nombres.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-gray-900 truncate">{{ user.nombres }} {{ user.apellidos }}</p>
                <p class="text-xs text-gray-400 truncate">{{ user.correo }}</p>
              </div>
            </div>
            <!-- Estado -->
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 self-start', user.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400']">
              {{ user?.estado ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="flex items-center gap-2 flex-wrap mb-3">
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', rolBadge[user.rol]]">{{ rolLabel[user.rol] }}</span>
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', depColors(user?.adscripcion?.clave) ?? 'bg-gray-100 text-gray-600']">
              {{ user?.adscripcion?.nombre }}
            </span>
          </div>

          <!-- Cursos este año (tarjeta móvil) -->
          <div class="flex items-center justify-between text-xs mb-3 bg-gray-50 rounded-xl px-3 py-2">
            <span class="text-gray-500">{{ ANIO_ACTUAL }} <span class="text-gray-400">(?)</span></span>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-gray-800">{{ cursosAnioLabel(user.id).total }} cursos</span>
              <span v-if="cursosAnioLabel(user.id).progreso" class="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                {{ cursosAnioLabel(user.id).progreso }} en progreso
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

    <!-- ════ MODAL: Detalle de usuario TERMINADO ════ -->
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
                  >{{ usuarioDetalle.nombres.charAt(0) }}</div>
                  <div>
                    <p class="text-base font-bold text-gray-900">{{ usuarioDetalle.nombres }} {{ usuarioDetalle.apellidos }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', rolBadge[usuarioDetalle.rol]]">{{ rolLabel[usuarioDetalle.rol] }}</span>
                      <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', depColors((usuarioEnDetalle as any)?.adscripcion?.clave) ?? 'bg-gray-100 text-gray-600']">{{(usuarioEnDetalle as any)?.adscripcion?.nombre }}</span>
                      <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', usuarioDetalle.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400']">{{ usuarioDetalle.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}</span>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ usuarioDetalle.correo }}</p>
                  </div>
                </div>
                <button @click="usuarioDetalle = null" class="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Resumen anual -->
              <div v-if="usuarioDetalle.rol !== 'ADMIN'" class="px-6 py-4 border-b border-gray-100">
                <div v-if="usuarioDetalle.rol === 'EMPLEADO'">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Avance {{ ANIO_ACTUAL }} <span class="normal-case font-normal text-gray-400">(incluye en progreso)</span></p>
                  <div class="grid grid-cols-3 gap-3">
                    <div class="bg-gray-50 rounded-xl p-3 text-center">
                      <p class="text-2xl font-bold text-gray-900">{{ cursosAnioLabel(usuarioDetalle.id).total }}</p>
                      <p class="text-[11px] text-gray-400 mt-0.5">Total {{ ANIO_ACTUAL }}</p>
                    </div>
                    <div class="bg-blue-50 rounded-xl p-3 text-center">
                      <p class="text-2xl font-bold text-[#4B7BF5]">{{ progresoAnual(usuarioDetalle.id).internos.length }} <span class="text-sm font-medium text-blue-300">/ {{ META_INTERNOS }}</span></p>
                      <p class="text-[11px] text-blue-400 mt-0.5">Internos</p>
                    </div>
                    <div class="bg-orange-50 rounded-xl p-3 text-center">
                      <p class="text-2xl font-bold text-orange-500">{{ progresoAnual(usuarioDetalle.id).externos.length }} <span class="text-sm font-medium text-orange-300">/ {{ META_EXTERNOS }}</span></p>
                      <p class="text-[11px] text-orange-400 mt-0.5">Externos</p>
                    </div>
                  </div>
                
                  <!-- Barra global meta -->
                  <div class="mt-3">
                    <div class="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Meta anual: {{ META_INTERNOS + META_EXTERNOS }} cursos ({{ META_INTERNOS }} int. + {{ META_EXTERNOS }} ext.)</span>
                      <span class="font-semibold" :class="cursosAnioLabel(usuarioDetalle.id).total >= META_INTERNOS + META_EXTERNOS ? 'text-green-600' : 'text-yellow-600'">
                        {{ Math.min(100, Math.round((cursosAnioLabel(usuarioDetalle.id).total / (META_INTERNOS + META_EXTERNOS)) * 100)) }}%
                      </span>
                    </div>
                    <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all"
                        :style="{
                          width: `${Math.min(100, (cursosAnioLabel(usuarioDetalle.id).total / (META_INTERNOS + META_EXTERNOS)) * 100)}%`,
                          background: 'linear-gradient(90deg, #2B4EF0, #4B7BF5)'
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
                <p class="text-[11px] text-gray-400 mt-2">· Histórico total: <span class="font-semibold text-gray-600">{{ cursoHistorico(usuarioDetalle).length }} cursos</span></p>
              </div>

              <!-- Lista de cursos del año (scroll) -->
              <div class="flex-1 overflow-y-auto px-6 py-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cursos {{ ANIO_ACTUAL }}</p>

                <div v-if="cursosAnoActual(usuarioDetalle.id).length === 0" class="text-center text-sm text-gray-400 py-6">
                  Sin cursos registrados este año.
                </div>

                <div class="space-y-2">
                  <div
                    v-for="c in cursosAnoActual(usuarioDetalle.id)" :key="c.id"
                    class="flex items-start gap-3 p-3 rounded-xl border"
                    :class="c.estado === 'FINALIZADO' ? 'border-green-100 bg-green-50' : 'border-yellow-100 bg-yellow-50'"
                  >
                    <!-- Icono estado -->
                    <div :class="['w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center', c.estado === 'FINALIZADO' ? 'bg-green-200' : 'bg-yellow-200']">
                      <svg v-if="c.estado === 'FINALIZADO'" class="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      <svg v-else class="w-4 h-4 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-800 truncate">{{ c.nombre }}</p>
                      <div class="flex flex-wrap gap-1.5 mt-1">
                        <span :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded-full', modalidadBadge[c.modalidad]]">{{ c.modalidad }}</span>
                        <span :class="['text-[10px] font-semibold px-1.5 py-0.5 rounded-full', c.tipo === 'interno' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-600']">{{ c.tipo }}</span>
                        <span v-if="c.instructor" class="text-[10px] text-gray-400">Instructor: {{ c.instructor.nombres }} {{ c.instructor.apellidos }}</span>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <p class="text-[10px] text-gray-400">Término</p>
                      <p class="text-xs font-semibold text-gray-600">{{ formatDate(c.fechaFin) }}</p>
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
                        ? `Adscripción: ${listaAdscripciones?.find((a:any) => a.clave === descargaAdscripcionFija)?.nombre ?? descargaAdscripcionFija}`
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
                    {{ usuariosParaDescarga?.filter((u:any) =>
                        op.value === 'todos' ? true :
                        op.value === '0' ? cursoHistorico(u).filter((c:any) => new Date(c.fechaInicio).getFullYear() === ANIO_ACTUAL).length === 0 :
                        op.value === '1' ? cursoHistorico(u).filter((c:any) => new Date(c.fechaInicio).getFullYear() === ANIO_ACTUAL).length === 1 :
                        op.value === '2' ? cursoHistorico(u).filter((c:any) => new Date(c.fechaInicio).getFullYear() === ANIO_ACTUAL).length === 2 :
                        cursoHistorico(u).filter((c:any) => new Date(c.fechaInicio).getFullYear() === ANIO_ACTUAL).length >= META_TOTAL
                      ).length }} personas
                  </span>
                </label>
              </div>

              <!-- Preview count -->
              <div class="px-6 pb-1">
                <p class="text-xs text-gray-400 text-center">
                  Se exportarán <span class="font-bold text-gray-700">{{ usuariosParaDescarga?.length }}</span> registro{{ usuariosParaDescarga?.length !== 1 ? 's' : '' }} en .csv
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
                  :disabled="usuariosParaDescarga?.length === 0"
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

    <!-- ════ MODAL: Inscribir Personal TERMINADO ════ -->
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
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition shadow-sm',
                      inscribirFiltroAds === ads.clave
                        ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-offset-1 ring-blue-400'
                        : [
                            'hover:bg-gray-50',
                            seleccionadosPorAds[ads.clave]?.seleccionados === 0
                              ? 'bg-gray-100 text-gray-500 border-gray-200'
                              : (seleccionadosPorAds[ads.clave]?.seleccionados ?? 0) < (seleccionadosPorAds[ads.clave]?.total ?? 0)
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                : 'bg-green-50 text-green-700 border-green-300'
                          ]
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
                    v-for="u in (usuariosInscribibles as any[])"
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
                      :style="{ background: 'linear-gradient(135deg,#2B4EF0,#4B7BF5)' }"
                    >
                      {{ u.nombres.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase() }}
                    </div>
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-800 truncate">{{ u.nombres }}</p>
                      <p class="text-xs text-gray-400 truncate">{{ u.correo }}</p>
                      <p class="text-[11px] text-gray-400 truncate mt-0.5">{{ u.adscripcion.clave }}</p>
                    </div>
                    <!-- Externos badge -->
                    <div class="shrink-0 flex flex-col items-center gap-0.5">
                      <span
                        class="text-xs font-bold px-2 py-0.5 rounded-full"
                        :class="progresoAnual(u.id).externos.length >= META_EXTERNOS
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-50 text-orange-500'"
                      >
                        {{ progresoAnual(u.id).externos.length }}/{{ META_EXTERNOS }}
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
