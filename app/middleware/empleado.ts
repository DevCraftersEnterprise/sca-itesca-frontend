// Solo permite acceso a usuarios con rol 'empleado'
export default defineNuxtRouteMiddleware(() => {
  const { token, rol } = useAuth()
  if (!token.value) return navigateTo('/login')
  if (rol.value !== 'EMPLEADO') return navigateTo('/login')
})
