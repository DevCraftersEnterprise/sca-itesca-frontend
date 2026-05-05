<script setup lang="ts">
definePageMeta({ layout: 'empleado', middleware: ['empleado'] })

const { user, token } = useAuth()
const config = useRuntimeConfig()
// ── Metas anuales  ─────────────────────────────────────────────────────────
const META_INTERNOS = 2
const META_EXTERNOS = 1
const META_TOTAL    = META_INTERNOS + META_EXTERNOS
// ── Fetch de cursos (inscritos, historial anual, disponibles) ─────────────────
interface VistaEmpleado {
  inscritos: any[];
  historialAnual: any[];
  disponibles: any[];
}
const { data: cursos, refresh: refreshCursos } = await useAsyncData(
  'cursos-v4-ordenado',
  () => fetchMisCursos(config, token.value) as Promise<VistaEmpleado>,
  {
    default: () => ({ inscritos: [], historialAnual: [], disponibles: [] }),
    watch: [token],
    transform: (data: any) => {
      const PRIORIDAD: Record<string, number> = {
        'EN_CURSO': 1,
        'POR_INSCRIBIR': 2,
        'FINALIZADO': 3
      };
      const ordenarLista = (lista: any[]) => {
        if (!lista) return [];
        return [...lista].sort((a, b) => {
          const pesoA = PRIORIDAD[a.estado] || 99;
          const pesoB = PRIORIDAD[b.estado] || 99;
          return pesoA - pesoB;
        });
      };
      return {
        ...data,
        inscritos: ordenarLista(data.inscritos),
        historialAnual: ordenarLista(data.historialAnual),
        disponibles: ordenarLista(data.disponibles),
      };
    }
  }
)
// ── Avance anual ───────────────────────────────────────────────────────────
const metaInterno = cursos?.value.historialAnual.filter((c: any) => 
  c.tipo === 'INTERNO' && 
  (c.estado === 'FINALIZADO' || c.estado === 'EN_CURSO') && 
  c.empleados[0]?.calificacion === 'APROBADO'
).length;
const metaExterno = cursos?.value.historialAnual.filter((c: any) => 
  c.tipo === 'EXTERNO' && 
  (c.estado === 'FINALIZADO' || c.estado === 'EN_CURSO') && 
  c.empleados[0]?.estado === 'VALIDADO'
).length;
const metaExt = (metaExterno >= META_EXTERNOS) ? 1 : metaExterno
const metaInt = (metaInterno >= META_INTERNOS) ? 2 : metaInterno
const totalMetas = (metaInterno + metaExterno)
const avancePct = computed(() => {
  if (META_ANUAL === 0) return 0;
  return Math.min(100, Math.round(((metaInt + metaExt) / META_ANUAL) * 100));
})
// ── Formateo de fechas (solo parte de fecha, DD/MM/YYYY) ─
const formatDate = (date: string | Date) => {
  if (!date) return 'Sin fecha';
  const dateStr = date.toString();
  const fechaParte = dateStr.split(/T| /)[0];
  if (!fechaParte) return 'Fecha inválida';
  const [year, month, day] = fechaParte.split('-');
  if (!year || !month || !day) return 'Formato inválido';
  return `${day}/${month}/${year}`;
}
// ── Mapeo de estados para mostrar etiquetas legibles y colores asociados ──
const cursosConCupo = computed(() => {
  return cursos.value.disponibles.filter((curso: any) => {
    const inscritos = curso.empleados?.length || 0;
    return inscritos < curso.capacidad;
  });
});
// ── Tipos ──────────────────────────────────────────────────────────────────
type Estado = 'EN_CURSO' | 'POR_INSCRIBIR' | 'FINALIZADO'
// ── Estado overrides por sesión (subida de comprobante, etc.) ─────────────
const estadoOverrides = ref<Record<string, Estado>>({})
const archivosSubidos = ref<Record<string, string>>({})
function estadoCurso(c: any): Estado {
  const st = estadoOverrides.value[c.key] ?? c.estado;
  return st;
}

// ── Modal: inscripción ────────────────────────────────────────────────────
const modalConfirm    = ref(false)
const cursoAInscribir = ref<any>(null)
const abrirConfirm = (c: any) => { cursoAInscribir.value = c; modalConfirm.value = true }
const confirmarInscripcion = async () => {
  if (!cursoAInscribir.value) return
  try {
    await $fetch(`${config.public.apiBaseUrl}/cursos/inscribir`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`
      },
      body: { 
        cursoId: Number(cursoAInscribir.value.id)
      }
    });
    await refreshNuxtData();
    await refreshCursos();

    modalConfirm.value = false;
    cursoAInscribir.value = null;

  } catch (error: any) {
  
    if (error.status === 401) {
      alert('Tu sesión no es válida o ha expirado.');
    } else {
      alert(error.data?.message || 'Error al procesar la inscripción');
    }
  }
}

// ── Modal: ver contenido / constancia / comprobante ───────────────────────
const modalContenido = ref(false)
const cursoViendo    = ref<any>(null)
const verContenido = (c: any) => { 
  cursoViendo.value = c; modalContenido.value = true
  console.log('Curso seleccionado:', cursoViendo.value.empleados);
 }
// Subir comprobante (cursos externos)
const fileInputRef = ref<HTMLInputElement | null>(null)
const subirComprobante = () => fileInputRef.value?.click()
const onFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !cursoViendo.value) return
  const key = cursoViendo.value.key
  const cursoId = cursoViendo.value.id
  archivosSubidos.value = { ...archivosSubidos.value, [key]: 'Subiendo archivo...' }
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${config.public.apiBaseUrl}/cursos/subir-constancia/${cursoId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token.value}`
      },
      body: formData
    })

    if (!response.ok) throw new Error('Error al subir el archivo')

    const data = await response.json()

    archivosSubidos.value = { ...archivosSubidos.value, [key]: file.name }
    setTimeout(() => {
      delete archivosSubidos.value[key] 
    }, 2000)
    
    await refreshCursos()

  } catch (error) {
    archivosSubidos.value = { ...archivosSubidos.value, [key]: 'Error al subir' }
    setTimeout(() => { delete archivosSubidos.value[key] }, 2000)
  } finally {
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}
// Obtener info del empleado para el curso actual (calificación, constancia, etc.)
const empleadoinfo = (c: any) => {
  if (!c || !c.empleados) return null;
  return c.empleados[0] || null;
}
// Descargar constancia —
const descargarConstancia = async (c: any) => {
  const nombreCurso = c.nombre || 'Constancia';
  const empleado = empleadoinfo(c);
  const url = empleado.constancia
  try{
    const response = await fetch(url);
    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.setAttribute(
      'download', 
      `Constancia_${nombreCurso.replace(/ /g, '_')}_${user.value.nombres.replace(/ /g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);
  } catch(error) {
    alert('Error al descargar constancia');
    window.open(url, '_blank');
  }
}

// ── UI helpers ─────────────────────────────────────────────────────────────
const modalidadBadge: Record<string, string> = {
  PRESENCIAL: 'bg-green-100 text-green-700',
  ONLINE:     'bg-blue-100 text-blue-600',
  Híbrido:    'bg-purple-100 text-purple-600',
}

const estadoConfig: Record<Estado, { label: string; cls: string }> = {
  'EN_CURSO':             { label: 'En progreso',          cls: 'bg-yellow-100 text-yellow-700' },
  'POR_INSCRIBIR':        { label: 'Inscripciones', cls: 'bg-amber-100 text-amber-700' },
  'FINALIZADO':           { label: 'Completado',           cls: 'bg-green-100 text-green-700' },
}

function btnLabel(c: any): string {
  if (c.tipo === 'INTERNO' && c.estado === 'FINALIZADO' && empleadoinfo(c)?.constancia && empleadoinfo(c)?.calificacion === 'APROBADO') return 'Ver Constancia'
  if (c.tipo === 'EXTERNO' && c.estado === 'EN_CURSO' && !empleadoinfo(c)?.constancia) return 'Subir comprobante'
  if (c.tipo === 'EXTERNO' && c.estado === 'EN_CURSO' && empleadoinfo(c)?.constancia && empleadoinfo(c)?.estado === 'POR_VALIDAR') return 'Actualizar Comprobante'
  return 'Ver estado'
}

function btnStyle(c: any): string {
  const st = estadoCurso(c)
  if (c.tipo === 'INTERNO' && st === 'FINALIZADO') return 'background:linear-gradient(135deg,#3ECFB2,#2fbfa3)'
  if (c.tipo === 'EXTERNO') return 'background:linear-gradient(135deg,#FF8B5E,#F5C242)'
  return 'background:linear-gradient(135deg,#2B4EF0,#4B7BF5)'
}
</script>

<template>
  <div>

    <!-- ════ Avance anual TERMINADO ════ -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Mis cursos</h1>
      <p class="text-sm text-gray-400 mb-5">Seguimiento de capacitación · {{ new Date().getFullYear() }}</p>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">
        <div class="flex gap-6 shrink-0">
          <div class="text-center">
            <p class="text-2xl font-bold text-[#4B7BF5]">{{ metaInt }}<span class="text-sm font-medium text-gray-300">/{{ META_INTERNOS }}</span></p>
            <p class="text-xs text-gray-400 mt-0.5">Internos</p>
          </div>
          <div class="w-px bg-gray-100 self-stretch"></div>
          <div class="text-center">
            <p class="text-2xl font-bold" :class="metaExt >= META_EXTERNOS ? 'text-green-600' : 'text-orange-400'">
              {{ metaExt }}<span class="text-sm font-medium text-gray-300">/{{ META_EXTERNOS }}</span>
            </p>
            <p class="text-xs text-gray-400 mt-0.5">Externos</p>
          </div>
          <div class="w-px bg-gray-100 self-stretch"></div>
          <div class="text-center">
            <p class="text-2xl font-bold" :class="avancePct >= 100 ? 'text-green-600' : 'text-gray-700'">
              {{ avancePct }}<span class="text-sm font-medium text-gray-300">%</span>
            </p>
            <p class="text-xs text-gray-400 mt-0.5">Avance</p>
          </div>
        </div>
        <div class="flex-1">
          <div class="flex justify-between text-xs text-gray-400 mb-2">
            <span>Meta anual: {{ META_TOTAL }} cursos ({{ META_INTERNOS }} int. + {{ META_EXTERNOS }} ext.)</span>
            <span class="font-semibold" :class="avancePct >= 100 ? 'text-green-600' : 'text-yellow-500'">{{ cursos?.inscritos?.length }}/{{ META_TOTAL }}</span>
          </div>
          <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
              :style="{
                width: `${avancePct}%`,
                background: avancePct >= 100
                  ? 'linear-gradient(90deg,#7DD87A,#4ade80)'
                  : avancePct > 0 ? 'linear-gradient(90deg,#2B4EF0,#4B7BF5)' : '#e5e7eb'
              }"></div>
          </div>
          <p v-if="avancePct >= 100" class="text-xs text-green-600 font-semibold mt-1.5 flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            ¡Meta anual cumplida!
          </p>
          <p v-else class="text-xs text-gray-400 mt-1.5">
            Faltan {{ META_TOTAL - totalMetas }} curso{{ META_TOTAL - totalMetas !== 1 ? 's' : '' }} para completar tu meta
          </p>
        </div>
      </div>
    </div>

    <!-- ════ Mis cursos ════ -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#4B7BF5]"></span>
        Mis cursos
        <span class="text-xs font-normal text-gray-400 normal-case">({{ cursos?.inscritos?.length }})</span>
      </h2>
      <!-- Sin cursos inscritos -->
      <div v-if="cursos?.inscritos?.length === 0" class="flex flex-col items-center justify-center py-14 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-400">Sin cursos inscritos</p>
        <p class="text-xs text-gray-300 mt-1">Inscríbete a un curso disponible o espera ser asignado</p>
      </div>
      <!-- Cursos inscritos -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="c in cursos.inscritos" :key="c.key"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col">

          <!-- Tipo + estado -->
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold px-2.5 py-1 rounded-full"
              :style="c.tipo === 'INTERNO'
                ? 'background:rgba(43,78,240,0.1);color:#2B4EF0'
                : 'background:rgba(255,139,94,0.12);color:#e0622a'">
              {{ c.tipo === 'INTERNO' ? 'INTERNO' : 'EXTERNO' }}
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="estadoConfig[estadoCurso(c)].cls">
              {{ estadoConfig[estadoCurso(c)].label }}
            </span>
          </div>

          <!-- Nombre + desc -->
          <h3 class="text-sm font-bold text-gray-900 text-center mb-1 leading-snug">{{ c.nombre }}</h3>
          <p class="text-xs text-gray-400 text-center mb-4 line-clamp-2">{{ c.descripcion ?? c.modalidad }}</p>

          <!-- Info rápida -->
          <div class="space-y-1.5 text-xs mb-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Modalidad</span>
              <span :class="['px-2 py-0.5 rounded-full text-[10px] font-medium', modalidadBadge[c.modalidad] ?? 'bg-gray-100 text-gray-500']">{{ c.modalidad }}</span>
            </div>
            <div v-if="c.tipo === 'INTERNO' && c.instructor !== '—'" class="flex items-center justify-between">
              <span class="text-gray-400">Instructor</span>
              <span class="font-medium text-gray-700 truncate max-w-[140px]">{{ c.instructor?.nombres || 'Sin Asignar' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Fecha fin</span>
              <span class="font-medium text-gray-700">{{ formatDate(c.fechaFin) }}</span>
            </div>
          </div>

          <!-- Archivo subido (indicador) -->
          <div v-if="archivosSubidos[c.key] && cursoViendo.id === c.id" class="mb-3 flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
            </svg>
            <span class="truncate font-medium">{{ archivosSubidos[c.key] }}</span>
          </div>

          <!-- Botón acción -->
          <button @click="verContenido(c)"
            class="mt-auto flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-xl text-white transition hover:brightness-110"
            :style="btnStyle(c)">
            <!-- Constancia: interno completado -->
            <template v-if="c.tipo === 'INTERNO' && c.estado === 'FINALIZADO'">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </template>
            <!-- Upload: externo en progreso -->
            <template v-else-if="c.tipo === 'EXTERNO' && c.estado === 'EN_CURSO'">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
            </template>
            <!-- Default -->
            <template v-else>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </template>
            {{ btnLabel(c) }}
          </button>
        </div>
      </div>
    </section>

    <!-- ════ Cursos disponibles TERMINADO ════ -->
    <section>
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#3ECFB2]"></span>
        Cursos disponibles para inscripción
        <span class="text-xs font-normal text-gray-400 normal-case">({{ cursosConCupo?.length }})</span>
      </h2>
      <!-- Sin cursos disponibles -->
      <div v-if="cursosConCupo?.length === 0" class="flex flex-col items-center justify-center py-14 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-gray-400">Sin cursos disponibles en este momento</p>
        <p class="text-xs text-gray-300 mt-1">Cuando haya nuevos cursos aparecerán aquí</p>
      </div>
      <!-- Cursos disponibles -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="curso in cursosConCupo" :key="curso.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col">
          
          <!-- Depts -->
          <div class="flex flex-wrap gap-1 mb-3">
            <span v-for="dep in curso.adscripciones" :key="dep"
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {{ dep.adscripcion.clave }}
            </span>
          </div>

          <h3 class="text-sm font-bold text-gray-900 text-center mb-1 leading-snug">{{ curso.nombre }}</h3>
          <p class="text-xs text-gray-400 text-center mb-4 line-clamp-2">{{ curso.descripcion }}</p>

          <div class="space-y-1.5 text-xs mb-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Modalidad</span>
              <span :class="['px-2 py-0.5 rounded-full text-[10px] font-medium', modalidadBadge[curso.modalidad] ?? 'bg-gray-100 text-gray-500']">{{ curso.modalidad }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Instructor</span>
              <span class="font-medium text-gray-700 truncate max-w-[130px]">{{ curso.instructor?.nombres || 'Sin Asignar' }}</span>
            </div>
            <div v-if="curso.horaInicio && curso.horaFin" class="flex items-center justify-between">
              <span class="text-gray-400">Horario</span>
              <span class="font-medium text-gray-700 truncate max-w-[130px]">{{ curso.horaInicio }} - {{ curso.horaFin }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-400">Fecha fin</span>
              <span class="font-medium text-gray-700">{{ formatDate(curso.fechaFin) }}</span>
            </div>
          </div>

          <!-- Barra de lugares -->
          <div class="mb-4">
            <div class="flex justify-between text-[10px] text-gray-400 mb-1.5">
              <span>Lugares</span>
              <span class="font-semibold text-gray-600">{{ curso?.empleados?.length }} / {{ curso.capacidad }}</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full"
                :style="{ width: `${Math.min(100,(curso?.empleados?.length/curso.capacidad)*100)}%`, background: 'linear-gradient(90deg,#3ECFB2,#2fbfa3)' }">
              </div>
            </div>
          </div>

          <button @click="abrirConfirm(curso)" :disabled="curso.inscritos >= curso.capacidad"
            class="mt-auto flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-xl text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style="background:linear-gradient(135deg,#3ECFB2,#2fbfa3)">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            {{ curso.empleados?.length >= curso.capacidad ? 'Sin lugares disponibles' : 'Inscribirme' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ════ MODAL: Confirmar inscripción TERMINADO ════ -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="modalConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.45)"
          @click.self="modalConfirm = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div class="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style="background:linear-gradient(135deg,#3ECFB2,#2fbfa3)">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-gray-900 text-center mb-1">¿Deseas inscribirte?</h3>
            <p class="text-sm text-gray-600 text-center font-medium mb-1">{{ cursoAInscribir?.nombre }}</p>
            <p class="text-xs text-gray-400 text-center mb-1">{{ cursoAInscribir?.modalidad }} · {{ cursoAInscribir?.instructor.nombres }}</p>
            <p class="text-xs text-gray-400 text-center mb-6">{{ cursoAInscribir?.horario }} · {{ cursoAInscribir?.duracion }}</p>
            <div class="flex gap-3">
              <button @click="modalConfirm = false"
                class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button @click="confirmarInscripcion"
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:brightness-110"
                style="background:linear-gradient(135deg,#3ECFB2,#2fbfa3)">
                Sí, inscribirme
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════ MODAL: Ver contenido / constancia / comprobante ════ -->
    <Teleport to="body">
      <!-- Hidden file input -->
      <input ref="fileInputRef" type="file" accept=".pdf,image/*" class="hidden" @change="onFileChange" />

      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="modalContenido && cursoViendo" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.45)"
          @click.self="modalContenido = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <!-- Header con gradiente -->
            <div class="rounded-t-2xl px-6 py-5 flex items-start justify-between sticky top-0"
              :style="cursoViendo.tipo === 'INTERNO'
                ? 'background:linear-gradient(135deg,#2B4EF0,#4B7BF5)'
                : 'background:linear-gradient(135deg,#FF8B5E,#F5C242)'">
              <div class="flex-1 min-w-0">
                <p class="text-xs text-white/70 font-medium mb-0.5">
                  {{ cursoViendo.tipo === 'INTERNO' ? 'Curso interno' : 'Curso externo' }}
                </p>
                <h3 class="text-lg font-bold text-white leading-snug">{{ cursoViendo.nombre }}</h3>
                <span class="inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
                  {{ estadoConfig[estadoCurso(cursoViendo)].label }}
                </span>
              </div>
              <button @click="modalContenido = false" class="text-white/70 hover:text-white ml-4 mt-0.5 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="px-6 py-5 space-y-4">

              <!-- Descripción -->
              <div v-if="cursoViendo.descripcion" class="bg-gray-50 rounded-xl p-4">
                <p class="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Descripción</p>
                <p class="text-sm text-gray-700 leading-relaxed">{{ cursoViendo.descripcion }}</p>
              </div>
              <!-- Grid de detalles del curso -->
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-gray-50 rounded-xl p-3">
                  <p class="text-[10px] text-gray-400 mb-1.5">Modalidad</p>
                  <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', modalidadBadge[cursoViendo.modalidad] ?? 'bg-gray-100 text-gray-600']">
                    {{ cursoViendo.modalidad }}
                  </span>
                </div>
                <div class="bg-gray-50 rounded-xl p-3">
                  <p class="text-[10px] text-gray-400 mb-1.5">Fecha fin</p>
                  <p class="text-sm font-semibold text-gray-800">{{ formatDate(cursoViendo.fechaFin) }}</p>
                </div>
                <div v-if="cursoViendo.instructor && cursoViendo.instructor !== '—'" class="bg-gray-50 rounded-xl p-3">
                  <p class="text-[10px] text-gray-400 mb-1.5">Instructor</p>
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ cursoViendo.instructor.nombres || 'Sin Asignar' }}</p>
                </div>
                <div v-if="cursoViendo.aula" class="bg-gray-50 rounded-xl p-3">
                  <p class="text-[10px] text-gray-400 mb-1.5">
                    <template v-if="cursoViendo.modalidad === 'ONLINE'">Link del curso</template>
                    <template v-else-if="cursoViendo.tipo === 'INTERNO'">Aula</template>
                    <template v-else>Ubicación</template>
                  </p>
                  <p class="text-sm font-semibold text-gray-800">
                    <template v-if="cursoViendo.modalidad === 'ONLINE'">
                      <a :href="cursoViendo.aula" target="_blank" class="text-blue-600 underline">
                        Abrir sesión
                      </a>
                    </template>
                    <template v-else>
                      {{ cursoViendo.aula }}
                    </template>
                  </p>
                </div>
                <div v-if="cursoViendo.duracionHrs" class="bg-gray-50 rounded-xl p-3">
                  <p class="text-[10px] text-gray-400 mb-1.5">Duración</p>
                  <p class="text-sm font-semibold text-gray-800">{{ cursoViendo.duracionHrs }} horas</p>
                </div>
                <div v-if="cursoViendo.horaInicio && cursoViendo.horaFin" class="bg-gray-50 rounded-xl p-3" :class="!cursoViendo.duracionHrs ? 'col-span-2' : ''">
                  <p class="text-[10px] text-gray-400 mb-1.5">Horario</p>
                  <p class="text-sm font-semibold text-gray-800">{{ cursoViendo.horaInicio }} - {{ cursoViendo.horaFin }}</p>
                </div>
              </div>

              <!-- ── Sección dinámica según tipo + estado ── -->

              <!-- Interno + completado: descargar constancia -->
              <div v-if="cursoViendo.tipo === 'INTERNO' && 
                         cursoViendo.estado === 'FINALIZADO' && 
                         empleadoinfo(cursoViendo)?.constancia && 
                         empleadoinfo(cursoViendo)?.calificacion === 'APROBADO'"
                class="border border-green-200 bg-green-50 rounded-xl p-4">
                <div class="flex items-start gap-3 mb-3">
                  <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-green-800 mb-0.5">Constancia disponible</p>
                    <p class="text-xs text-green-600">Curso completado el {{ formatDate(cursoViendo.fechaFin) }}</p>
                  </div>
                </div>
                <button @click="descargarConstancia(cursoViendo)"
                  class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
                  style="background:linear-gradient(135deg,#3ECFB2,#2fbfa3)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Descargar constancia
                </button>
              </div>
              <!-- Interno + reprobado: mensaje de reprobación -->
              <div v-else-if="cursoViendo.tipo === 'INTERNO' && 
                         cursoViendo.estado === 'FINALIZADO' && 
                         empleadoinfo(cursoViendo)?.calificacion === 'REPROBADO'" 
                class="bg-red-50 border border-red-100 rounded-xl p-4">
                <div class="flex items-center gap-3 mb-3">
                  <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm font-bold text-red-600 mb-0.5">Curso reprobado</p>
                </div>
                <p class="text-xs text-red-400">
                  Lamentablemente, el curso ha sido reprobado. Te recomendamos contactar al instructor para revisar tus resultados o esperar a una próxima convocatoria.
                </p>
              </div>

              <!-- Externo + en progreso: subir comprobante -->
              <div v-else-if="cursoViendo.tipo === 'EXTERNO' && 
                 (cursoViendo.estado === 'EN_CURSO' || cursoViendo.estado === 'FINALIZADO') &&
                 !empleadoinfo(cursoViendo)?.constancia"
                class="border border-orange-200 bg-orange-50 rounded-xl p-4">
                <p class="text-sm font-bold text-orange-800 mb-1">Subir comprobante</p>
                <p class="text-xs text-orange-600 mb-3">
                  Al concluir el curso sube tu comprobante (constancia, diploma o certificado en PDF o imagen).
                  Quedará en espera de validación por el administrador.
                </p> 
                <div v-if="archivosSubidos[cursoViendo.key]"
                  class="flex items-center gap-2 bg-orange-100 rounded-lg px-3 py-2 mb-3">
                  <svg class="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                  </svg>
                  <span class="text-xs font-medium text-orange-700 truncate">{{ archivosSubidos[cursoViendo.key] }}</span>
                </div>
                <button @click="subirComprobante"
                  class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
                  style="background:linear-gradient(135deg,#FF8B5E,#F5C242)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  Seleccionar archivo
                </button>
              </div>

              <!-- Externo + esperando validación -->
              <div v-else-if="cursoViendo.tipo === 'EXTERNO' && 
                (cursoViendo.estado === 'EN_CURSO' || cursoViendo.estado === 'FINALIZADO') && 
                empleadoinfo(cursoViendo)?.constancia &&
                 empleadoinfo(cursoViendo)?.estado === 'POR_VALIDAR'"
                class="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-amber-800 mb-0.5">Comprobante en revisión</p>
                    <p class="text-xs text-amber-700">Tu comprobante fue recibido y está siendo revisado por el administrador. Una vez validado, el curso aparecerá como completado.</p>
                  </div>
                </div>
                <div v-if="archivosSubidos[cursoViendo.key]"
                  class="flex items-center gap-2 bg-amber-100 rounded-lg px-3 py-2 mt-3">
                  <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                  </svg>
                  <span class="text-xs font-medium text-amber-700 truncate">{{ archivosSubidos[cursoViendo.key] }}</span>
                </div>
                <button @click="subirComprobante"
                  class="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-amber-300 text-amber-700 hover:bg-amber-100 transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  Actualizar evidencia
                </button>
              </div>

              <!-- Externo + completado: evidencia validada -->
              <div v-else-if="cursoViendo.tipo === 'EXTERNO' && (cursoViendo.estado === 'FINALIZADO' || cursoViendo.estado === 'EN_CURSO') && empleadoinfo(cursoViendo)?.estado === 'VALIDADO'"
                class="border border-green-200 bg-green-50 rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-green-800 mb-0.5">Evidencia validada</p>
                    <p class="text-xs text-green-700">El administrador aprobó tu comprobante. Curso registrado como completado.</p>
                  </div>
                </div>
              </div>

              <!-- Interno + en progreso: placeholder -->
              <div v-else class="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p class="text-sm font-semibold text-[#4B7BF5] mb-1">Contenido del curso</p>
                <p class="text-xs text-blue-400">El material y las actividades estarán disponibles en la plataforma de capacitación.</p>
              </div>

            </div>

            <div class="px-6 pb-5">
              <button @click="modalContenido = false"
                class="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
