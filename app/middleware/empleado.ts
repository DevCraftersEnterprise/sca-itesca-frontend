// Solo permite acceso a usuarios con rol 'empleado'
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated, rol } = useAuth()
  if (!isAuthenticated.value) return navigateTo('/login')
  if (rol.value !== 'empleado') return navigateTo('/login')
})
