<script setup lang="ts">
const { user, logout, token } = useAuth()
const config = useRuntimeConfig()
// ── Configuración de roles (etiqueta y color) ──
const rolLabel: Record<string, string> = { 
  ADMIN: 'Admin', 
  EMPLEADO: 'Empleado', 
  INSTRUCTOR: 'Instructor' 
}
const rolColor: Record<string, string> = {
  ADMIN:      'bg-blue-100 text-[#4B7BF5]',
  EMPLEADO:   'bg-green-100 text-green-700',
  INSTRUCTOR: 'bg-orange-100 text-orange-600',
}
// ── Cursos del instructor del año actual ──
const anioActual = new Date().getFullYear()
const cursos = ref<any>([]);
onMounted(async () => {
  try {
    const data = await fetchMisCursos(config, token.value);
    cursos.value = data;
  } catch (error) {}
});
const cursosDelAnio = computed(() => {
  return cursos.value.filter((curso: any) => {
    const fechaCurso = new Date(curso.fechaFin); 
    return fechaCurso.getFullYear() === anioActual
  })
})
// ── Panel cuenta ──
const panelCuenta = ref(false)
// ── Iniciales para avatar ──
const initiales = computed(
  () => user.value?.nombres.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() ?? '?'
)
// ── Formateo de fecha (solo parte de fecha, sin hora) ──
const formatDate = (date: string | Date) => {
  if (!date) return 'Sin fecha';
  const dateStr = date.toString();
  const fechaParte = dateStr.split(/T| /)[0];
  if (!fechaParte) return 'Fecha inválida';
  const [year, month, day] = fechaParte.split('-');
  if (!year || !month || !day) return 'Formato inválido';
  return `${day}/${month}/${year}`;
}
// ── Seguridad (cambio de contraseña) ──
const { 
  passActual, passNueva, passConfirm, passError, passOk, cambiarPass, 
  showActual, showNueva, showConfirm, guardarPassword, cancelarCambioPass
} = useSecurity()
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">

    <!-- Topbar -->
    <header class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div class="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <NuxtLink to="/instructor" class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style="background:linear-gradient(135deg,#2B4EF0,#4B7BF5)">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </NuxtLink>
          <div class="h-6 w-px bg-gray-200 hidden sm:block shrink-0"></div>
          <div class="leading-tight min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">
              <span class="sm:hidden">{{ user?.nombres?.split(' ')[0] ?? 'Instructor' }}</span>
              <span class="hidden sm:inline">¡Hola, <span class="text-[#4B7BF5]">{{ user?.nombres ?? 'Instructor' }}</span>!</span>
            </p>
            <p class="text-xs text-gray-400 hidden sm:block">Portal de Instructor</p>
          </div>
          <span v-if="user?.rol" :class="['text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', rolColor[user.rol]]">
            {{ rolLabel[user.rol] }}
          </span>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button @click="panelCuenta = true"
            class="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 p-2 sm:px-3 rounded-lg hover:bg-gray-100 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span class="hidden sm:inline">Cuenta</span>
          </button>
          <button @click="logout"
            class="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 p-2 sm:px-3 rounded-lg hover:bg-red-50 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">
      <slot />
    </main>

    <!-- Drawer cuenta -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="panelCuenta" class="fixed inset-0 z-40" style="background:rgba(0,0,0,0.3)" @click="panelCuenta = false"/>
      </Transition>
      <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-x-full" enter-to-class="translate-x-0"
                  leave-active-class="transition duration-200 ease-in" leave-from-class="translate-x-0" leave-to-class="translate-x-full">
        <aside v-if="panelCuenta" class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 class="text-sm font-bold text-gray-800">Mi cuenta</h2>
            <button @click="panelCuenta = false" class="text-gray-400 hover:text-gray-600 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <!-- Perfil -->
            <div class="flex flex-col items-center text-center gap-3">
              <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md"
                style="background:linear-gradient(135deg,#FF8B5E,#F5C242)">{{ initiales }}</div>
              <div>
                <p class="text-lg font-bold text-gray-900">{{ user?.nombres }} {{ user?.apellidos }}</p>
                <p class="text-sm text-gray-400 mt-0.5">{{ user?.correo }}</p>
                <span v-if="user?.rol" :class="['inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full', rolColor[user.rol]]">
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
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,#2B4EF0,#4B7BF5)">
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

            <!-- Avance anual (cursos propios como instructor) -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avance {{ new Date().getFullYear() }}</p>
                <span class="text-xs text-gray-400">Histórico: <span class="font-semibold text-gray-700">{{ cursosDelAnio?.length ?? 0 }} cursos</span></span>
              </div>
              <div v-if="(cursosDelAnio?.length ?? 0) === 0" class="text-xs text-gray-400 text-center py-2">Sin cursos registrados este año.</div>
              <div v-else class="space-y-2">
                <div v-for="c in cursosDelAnio" :key="c.id"
                  class="flex items-start gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    :style="c.tipo === 'interno' ? 'background:linear-gradient(135deg,#2B4EF0,#4B7BF5)' : 'background:linear-gradient(135deg,#FF8B5E,#F5C242)'">
                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-gray-800 truncate">{{ c.nombre }}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">{{ c.modalidad === 'ONLINE' ? 'Online' : 'Presencial' }} · {{formatDate(c.fechaFin) }}</p>
                  </div>
                  <span class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                    :class="{
                    'bg-green-100 text-green-700': c.estado === 'FINALIZADO',
                    'bg-blue-100 text-blue-700': c.estado === 'EN_CURSO',
                    'bg-yellow-100 text-yellow-700': c.estado === 'POR_INSCRIBIR'
                    }">
                    {{ 
                      c.estado === 'FINALIZADO' ? 'Finalizado' : 
                      c.estado === 'EN_CURSO' ? 'En curso' : 'Inscripciones' 
                    }}
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
              <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                          leave-active-class="transition-all duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                <div v-if="cambiarPass" class="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div v-for="([model, show, label, showRef], i) in [
                    [passActual, showActual, 'Contraseña actual', 'showActual'],
                    [passNueva, showNueva, 'Nueva contraseña', 'showNueva'],
                    [passConfirm, showConfirm, 'Confirmar nueva contraseña', 'showConfirm'],
                  ] as const" :key="i" class="relative">
                  </div>
                  <!-- Campos manuales para evitar problemas de tipos -->
                  <div class="relative">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Contraseña actual</label>
                    <input v-model="passActual" :type="showActual ? 'text' : 'password'" placeholder="••••••••"
                      class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#4B7BF5] transition"/>
                    <button type="button" @click="showActual = !showActual" class="absolute right-2.5 top-7 text-gray-400 hover:text-gray-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </div>
                  <div class="relative">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
                    <input v-model="passNueva" :type="showNueva ? 'text' : 'password'" placeholder="Mínimo 8 caracteres"
                      class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#4B7BF5] transition"/>
                    <button type="button" @click="showNueva = !showNueva" class="absolute right-2.5 top-7 text-gray-400 hover:text-gray-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </div>
                  <div class="relative">
                    <label class="block text-xs font-medium text-gray-500 mb-1">Confirmar nueva contraseña</label>
                    <input v-model="passConfirm" :type="showConfirm ? 'text' : 'password'" placeholder="••••••••"
                      class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#4B7BF5] transition"/>
                    <button type="button" @click="showConfirm = !showConfirm" class="absolute right-2.5 top-7 text-gray-400 hover:text-gray-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </div>
                  <p v-if="passError" class="text-xs text-red-500">{{ passError }}</p>
                  <p v-if="passOk" class="text-xs text-green-600 font-semibold">✓ Contraseña actualizada</p>
                  <button @click="guardarPassword"
                    class="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
                    style="background:linear-gradient(135deg,#2B4EF0,#4B7BF5)">Guardar contraseña</button>
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
            <button @click="logout"
              class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 transition">
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
