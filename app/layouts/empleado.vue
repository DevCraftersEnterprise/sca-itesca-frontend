<script setup lang="ts">
import { ref } from 'vue'
const { user, logout, token } = useAuth()
const META_ANUAL = 3
const config = useRuntimeConfig()
// ── Mapeo de roles para mostrar etiquetas legibles y colores asociados ──
const rolLabel: Record<string, string> = {
  ADMIN: 'Admin',
  EMPLEADO: 'Empleado',
  INSTRUCTOR: 'Instructor',
}
const rolColor: Record<string, string> = {
  ADMIN: 'bg-blue-100 text-[#4B7BF5]',
  EMPLEADO: 'bg-green-100 text-green-700',
  INSTRUCTOR: 'bg-orange-100 text-orange-600',
}
// ── Formateo de fecha (solo parte de fecha, sin hora) ──
const formatDate = (date: string | Date) => {
  if (!date) return 'Sin fecha';
  const dateStr = date.toString();
  const fechaParte = dateStr.split(/T| /)[0];
  if (!fechaParte) return 'Fecha inválida';
  const [year, month, day] = fechaParte.split('-');
  if (!year || !month || !day) return 'Formato inválido';
  return `${day}/${month}/${year}`;
};
// ── Carga de cursos del empleado ──
interface VistaEmpleado {
  inscritos: any[];
  historialAnual: any[];
  disponibles: any[];
}
//listado los cursos en los que el empleado está inscrito, su historial anual de cursos completados y los cursos disponibles para inscripción.
const { data: cursos } = await useAsyncData(
  'cursos-v5-ordenado',
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
// ── Panel cuenta ──
const panelCuenta = ref(false)
// ── Iniciales para avatar ──
const initiales = computed(
  () => user.value?.nombres.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() ?? '?'
)
// ── Seguridad (cambio de contraseña) ──
const { 
  passActual, passNueva, passConfirm, passError, passOk, cambiarPass, 
  showActual, showNueva, showConfirm, guardarPassword, cancelarCambioPass
} = useSecurity()
// ── Cálculo de metas alcanzadas (cursos internos y externos completados este año) ──
const metaInterno = cursos?.value.historialAnual.filter((c : any) => 
  c.tipo === 'INTERNO' && 
  (c.estado === 'FINALIZADO' || c.estado === 'EN_CURSO') && 
  c.empleados[0]?.calificacion === 'APROBADO'
).length
const metaExterno = cursos?.value.historialAnual.filter((c :any) => 
  c.tipo === 'EXTERNO' && 
  (c.estado === 'FINALIZADO' || c.estado === 'EN_CURSO') && 
  c.empleados[0]?.estado === 'VALIDADO'
).length
const totalMetas = (metaInterno >= 2 && metaExterno >= 1) ? 3 : (metaInterno + metaExterno);
// ── Estado de cursos (para mostrar etiquetas de estado con colores) ──
type Estado = 'EN_CURSO' | 'POR_INSCRIBIR' | 'FINALIZADO'
const estadoConfig: Record<Estado, { label: string; cls: string }> = {
  'EN_CURSO':             { label: 'En progreso',          cls: 'bg-yellow-100 text-yellow-700' },
  'POR_INSCRIBIR':        { label: 'Inscripciones', cls: 'bg-amber-100 text-amber-700' },
  'FINALIZADO':           { label: 'Completado',           cls: 'bg-green-100 text-green-700' },
}
const estadoOverrides = ref<Record<string, Estado>>({})
function estadoCurso(c: any): Estado {
  const st = estadoOverrides.value[c.key] ?? c.estado;
  return st;
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">

    <!-- ── Topbar ── -->
    <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div class="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="h-6 w-px bg-gray-200 hidden sm:block flex-shrink-0"></div>
          <div class="leading-tight min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">
              <span class="sm:hidden">{{ user?.nombres?.split(' ')[0] ?? 'Usuario' }}</span>
              <span class="hidden sm:inline">
                ¡Hola, <span class="text-[#4B7BF5]">{{ user?.nombres ?? 'Usuario' }}</span>!
              </span>
            </p>
            <p class="text-xs text-gray-400 hidden sm:block">Sistema de Control de Capacitación</p>
          </div>
          <span v-if="user?.rol"
            :class="['text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0', rolColor[user.rol]]">
            {{ rolLabel[user.rol] }}
          </span>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          <button @click="panelCuenta = true"
            class="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-gray-100 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="hidden sm:inline">Cuenta</span>
          </button>
          <button @click="logout"
            class="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-red-50 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>

      </div>
    </header>

    <!-- ── Contenido ── -->
    <main class="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">
      <slot />
    </main>

    <!-- ── Panel de cuenta (drawer derecho) ── -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="panelCuenta" class="fixed inset-0 z-40" style="background:rgba(0,0,0,0.3)" @click="panelCuenta = false"/>
      </Transition>
      <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-x-full" enter-to-class="translate-x-0"
                  leave-active-class="transition duration-200 ease-in" leave-from-class="translate-x-0" leave-to-class="translate-x-full">
        <aside v-if="panelCuenta" class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">

          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 class="text-sm font-bold text-gray-800">Mi cuenta</h2>
            <button @click="panelCuenta = false" class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">

            <!-- Perfil -->
            <div class="flex flex-col items-center text-center gap-3">
              <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md"
                style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
                {{ initiales }}
              </div>
              <div>
                <p class="text-lg font-bold text-gray-900">{{ user?.nombres }} {{ user?.apellidos }}</p>
                <p class="text-sm text-gray-400 mt-0.5">{{ user?.correo }}</p>
                <span v-if="user?.rol"
                  :class="['inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full', rolColor[user.rol]]">
                  {{ rolLabel[user.rol] }}
                </span>
                <p v-if="user?.adscripcion" class="text-xs text-gray-400 mt-1">{{ user?.adscripcion }}</p>
              </div>
            </div>

            <div class="border-t border-gray-100"></div>

            <!-- Institución -->
            <div class="space-y-3">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Institución</p>
              <div class="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-800">ITESCA</p>
                  <p class="text-xs text-gray-400">Instituto Tecnológico Superior de Cajeme</p>
                </div>
              </div>
            </div>

            <!-- Avance anual -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avance {{ new Date().getFullYear() }}</p>
                <span class="text-xs text-gray-400">Histórico: <span class="font-semibold text-gray-700">{{ cursos?.historialAnual?.length ?? 0 }} cursos</span></span>
              </div>
              <div class="bg-gray-50 rounded-xl p-4 space-y-3">
                <div class="flex items-end justify-between mb-1">
                  <span class="text-xs text-gray-500">Meta anual</span>
                  <span class="text-sm font-bold" :class="totalMetas >= META_ANUAL ? 'text-green-600' : 'text-gray-700'">
                    {{ totalMetas }}/{{ META_ANUAL }}
                    <span class="text-xs font-normal text-gray-400 ml-1">cursos</span>
                  </span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" :style="{
                    width: `${Math.min(100, Math.round(((totalMetas ?? 0) / META_ANUAL) * 100))}%`,
                    background: (totalMetas ?? 0) >= META_ANUAL
                      ? 'linear-gradient(90deg,#7DD87A,#4ade80)'
                      : (cursos?.historialAnual?.length ?? 0) > 0 ? 'linear-gradient(90deg,#F5C242,#fbbf24)' : '#e5e7eb'
                  }"></div>
                </div>

                <div class="flex justify-between text-[11px] text-gray-400">
                  <span>{{ Math.min(100, Math.round(((totalMetas) / META_ANUAL) * 100)) }}% completado</span>
                  <span>Faltan {{ Math.max(0, META_ANUAL - totalMetas) }}</span>
                </div>
              </div>

              <div v-if="(cursos?.historialAnual?.length ?? 0) === 0" class="text-xs text-gray-400 text-center py-3">
                Sin cursos registrados este año.
              </div>
              <div v-else class="space-y-2">
                <div v-for="c in cursos.historialAnual" :key="c.id"
                  class="flex items-start gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    :style="c.tipo === 'INTERNO' ? 'background:linear-gradient(135deg,#2B4EF0,#4B7BF5)' : 'background:linear-gradient(135deg,#FF8B5E,#F5C242)'">
                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path v-if="c.tipo === 'INTERNO'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-gray-800 leading-snug truncate">{{ c.nombre }}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">{{ c.modalidad }} · {{ formatDate(c.fechaFin) }}</p>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="estadoConfig[estadoCurso(c)].cls">
                    {{ estadoConfig[estadoCurso(c)].label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Seguridad -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Seguridad</p>
                <button @click="cambiarPass ? cancelarCambioPass() : cambiarPass = true; passError = ''; passOk = false"
                  class="text-xs font-semibold text-[#4B7BF5] hover:text-[#2B4EF0] transition">
                  {{ cambiarPass ? 'Cancelar' : 'Cambiar contraseña' }}
                </button>
              </div>
              <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                          leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                <div v-if="cambiarPass" class="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div class="relative">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Contraseña actual</label>
                    <input v-model="passActual" :type="showActual ? 'text' : 'password'" placeholder="••••••••"
                      class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 pr-9 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                    <button type="button" @click="showActual = !showActual" class="absolute right-2.5 top-7 text-gray-400 hover:text-gray-600">
                      <svg v-if="!showActual" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    </button>
                  </div>
                  <div class="relative">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
                    <input v-model="passNueva" :type="showNueva ? 'text' : 'password'" placeholder="Mínimo 8 caracteres"
                      class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 pr-9 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                    <button type="button" @click="showNueva = !showNueva" class="absolute right-2.5 top-7 text-gray-400 hover:text-gray-600">
                      <svg v-if="!showNueva" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    </button>
                  </div>
                  <div class="relative">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Confirmar nueva contraseña</label>
                    <input v-model="passConfirm" :type="showConfirm ? 'text' : 'password'" placeholder="••••••••"
                      class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 pr-9 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"/>
                    <button type="button" @click="showConfirm = !showConfirm" class="absolute right-2.5 top-7 text-gray-400 hover:text-gray-600">
                      <svg v-if="!showConfirm" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    </button>
                  </div>
                  <p v-if="passError" class="text-xs text-red-500">{{ passError }}</p>
                  <div v-if="passOk" class="flex items-center gap-2 text-xs text-green-600 font-semibold">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    Contraseña actualizada correctamente
                  </div>
                  <button v-if="!passOk" @click="guardarPassword"
                    class="w-full py-2 rounded-xl text-sm font-semibold text-white transition hover:brightness-110"
                    style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)">
                    Guardar contraseña
                  </button>
                </div>
              </Transition>
              <div v-if="!cambiarPass" class="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <p class="text-xs text-gray-500">Tu contraseña está protegida. Cámbiala periódicamente.</p>
              </div>
            </div>

          </div>

          <div class="px-6 py-4 border-t border-gray-100 shrink-0">
            <button @click="panelCuenta = false; logout()"
              class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </button>
          </div>

        </aside>
      </Transition>
    </Teleport>

  </div>
</template>
