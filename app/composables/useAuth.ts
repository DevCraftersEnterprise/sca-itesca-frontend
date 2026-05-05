const META_INTERNOS = 2
const META_EXTERNOS = 1
export const META_ANUAL = META_INTERNOS + META_EXTERNOS

export const useAuth = () => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('token', { maxAge: 60 * 60 }) 
  const rol = useCookie<string | null>('rol', { maxAge: 60 * 60 })
  const user = useCookie<any | null>('usuario', { maxAge: 60 * 60 })
  const isAuthenticated = computed(() => !!token.value)

  watch(token, (newToken) => {
    if (!newToken) {
      logout()
    }
  })
  const login = async (form: { correo: string; contrasena: string }) => {
    try {
      const res: any = await $fetch(`${config.public.apiBaseUrl}/auth/login`, {
        method: 'POST',
        body: {
          correo: form.correo,
          contrasena: form.contrasena
        }
      })
      token.value = res.access_token
      user.value = res.user
      rol.value = res.user.rol
    } catch (error: any) {
      throw new Error(error?.data?.message || 'Error en login')
    }
  }
  const logout = () => {
    token.value = null
    user.value = null
    rol.value = null
    navigateTo('/login')
  }
  return {
    login,
    logout,
    user,
    token,
    rol,
    isAuthenticated
  }
}