// Solo permite acceso a usuarios con rol 'instructor'
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated, rol } = useAuth()
  if (!isAuthenticated.value) return navigateTo('/login')
  if (rol.value !== 'instructor') return navigateTo('/login')
})
