// composables/useSecurity.ts
import { ref } from 'vue'
export const useSecurity = () => {
  const { token } = useAuth()
  const config = useRuntimeConfig()
  
  // 1. Declaración de variables de estado
  const cambiarPass = ref(false)
  const passActual = ref('')
  const passNueva = ref('')
  const passConfirm = ref('')
  const passError = ref('')
  const passOk = ref(false)
  
  // 2. Variables para mostrar/ocultar contraseña (ojitos)
  const showActual = ref(false)
  const showNueva = ref(false)
  const showConfirm = ref(false)
  const resetPasswordForm = () => {
    passActual.value = ''
    passNueva.value = ''
    passConfirm.value = ''

    passError.value = ''
    passOk.value = false

    showActual.value = false
    showNueva.value = false
    showConfirm.value = false
  }
  const cancelarCambioPass = () => {
    cambiarPass.value = false
    resetPasswordForm()
  }
  // 3. Función principal
  const guardarPassword = async () => {
    passError.value = ''
    
    if (!passActual.value) { passError.value = 'Ingresa tu contraseña actual.'; return }
    if (passNueva.value.length < 8) { passError.value = 'Mínimo 8 caracteres.'; return }
    if (passNueva.value !== passConfirm.value) { passError.value = 'No coinciden.'; return }

    try {
      // Usamos apiBaseUrl que es la que tienes en tu nuxt.config
      await $fetch(`${config.public.apiBaseUrl}/usuarios/update-password`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token.value}` },
        body: { 
          passActual: passActual.value, 
          newPassword: passNueva.value 
        }
      })

      // Éxito
      passOk.value = true
      setTimeout(() => {
        passOk.value = false
        cambiarPass.value = false
        passActual.value = ''
        passNueva.value = ''
        passConfirm.value = ''
      }, 2500)

    } catch (error: any) {
      if (error.status === 401) {
        passError.value = 'La contraseña actual es incorrecta.'
      } else {
        passError.value = 'Error al conectar con el servidor.'
      }
    }
  }

  // 4. Retorno de todas las propiedades para que el .vue las vea
  return {
    cambiarPass,
    passActual,
    passNueva,
    passConfirm,
    passError,
    passOk,
    showActual,
    showNueva,
    showConfirm,
    guardarPassword,
    cancelarCambioPass
  }
}