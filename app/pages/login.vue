<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login, isAuthenticated, rol } = useAuth()

if (isAuthenticated.value) {
  const destinos = { admin: '/admin', empleado: '/empleado', instructor: '/instructor' }
  navigateTo(destinos[rol.value!])
}

const form = reactive({ email: '', password: '' })
const error = ref('')
const cargando = ref(false)
const mostrarPassword = ref(false)

const handleLogin = async () => {
  error.value = ''
  cargando.value = true
  try {
    await login(form)
    // TODO: redirigir según rol devuelto por la API
  } catch {
    error.value = 'Correo o contraseña incorrectos'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">

    <!-- ── Panel izquierdo decorativo (solo ≥ lg) ── -->
    <div
      class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center"
      style="background: linear-gradient(145deg, #2B4EF0 0%, #4B7BF5 55%, #5B9CF8 100%)"
    >
      <!-- Burbujas de color de la paleta -->
      <div class="absolute top-10 left-8 w-40 h-40 rounded-full blur-2xl opacity-45" style="background:#FF8B5E"></div>
      <div class="absolute top-24 right-8 w-28 h-28 rounded-full blur-xl opacity-40" style="background:#3ECFB2"></div>
      <div class="absolute top-1/2 -left-4 w-32 h-32 rounded-full blur-2xl opacity-35" style="background:#F5A0C0"></div>
      <div class="absolute bottom-20 left-16 w-48 h-48 rounded-full blur-3xl opacity-40" style="background:#F5C242"></div>
      <div class="absolute bottom-10 right-4 w-36 h-36 rounded-full blur-2xl opacity-40" style="background:#7DD87A"></div>
      <div class="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-10" style="background:#ffffff"></div>
      <div class="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10" style="background:#ffffff"></div>

      <!-- Contenido centrado -->
      <div class="relative z-10 text-center text-white px-12">
        <!-- Ícono -->
        <div class="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-xl">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h1 class="text-4xl font-bold tracking-tight mb-2">SCA · ITESCA</h1>
        <p class="text-blue-100 text-lg font-medium mb-4">Sistema de Control de Capacitación</p>
        <p class="text-blue-200 text-sm leading-relaxed max-w-xs mx-auto">
          Gestiona los cursos obligatorios del personal académico y administrativo del ITESCA.
        </p>

        <!-- Indicadores tipo dots -->
        <div class="flex justify-center gap-2 mt-10">
          <div class="w-6 h-2 rounded-full bg-white"></div>
          <div class="w-2 h-2 rounded-full bg-white/40"></div>
          <div class="w-2 h-2 rounded-full bg-white/40"></div>
        </div>
      </div>
    </div>

    <!-- ── Panel derecho — formulario ── -->
    <div class="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 min-h-screen">

      <!-- Logo móvil (oculto en desktop) -->
      <div class="lg:hidden text-center mb-8">
        <div class="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-md" style="background: #4B7BF5">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-gray-800">SCA · ITESCA</h1>
        <p class="text-xs text-gray-400 mt-1">Sistema de Control de Capacitación</p>
      </div>

      <!-- Tarjeta de formulario -->
      <div class="w-full max-w-sm">
        <h2 class="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h2>
        <p class="text-gray-400 text-sm mb-8">Inicia sesión para continuar</p>

        <form @submit.prevent="handleLogin" class="space-y-5">

          <!-- Correo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="nombre@itesca.edu.mx"
              required
              class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"
            />
          </div>

          <!-- Contraseña -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="mostrarPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#4B7BF5] focus:border-transparent transition"
              />
              <!-- Toggle mostrar/ocultar -->
              <button
                type="button"
                tabindex="-1"
                @click="mostrarPassword = !mostrarPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <!-- Ojo abierto -->
                <svg v-if="!mostrarPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <!-- Ojo tachado -->
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Mensaje de error -->
          <div v-if="error" class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            {{ error }}
          </div>

          <!-- Botón principal -->
          <button
            type="submit"
            :disabled="cargando"
            class="w-full text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style="background: linear-gradient(135deg, #2B4EF0, #4B7BF5)"
          >
            <span v-if="!cargando">Iniciar sesión</span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Iniciando sesión...
            </span>
          </button>

        </form>
      </div>

      <!-- Footer -->
      <p class="mt-12 text-xs text-gray-300">© 2026 ITESCA · Todos los derechos reservados</p>
    </div>

  </div>
</template>

