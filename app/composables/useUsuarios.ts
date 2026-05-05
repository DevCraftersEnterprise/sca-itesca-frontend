// composables/useUsuarios.ts
export const useUsuarios = () => {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  // 1. Obtener todos los usuarios (GET)
  const { data: listarUsuarios } = useAsyncData('usuarios-key', () => 
    $fetch(`${config.public.apiBaseUrl}/usuarios`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
  )

  return { listarUsuarios }
}