// Solo permite acceso a usuarios con rol 'admin'
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated, rol } = useAuth()
  if (!isAuthenticated.value) return navigateTo('/login')
  if (rol.value !== 'admin') return navigateTo('/login')
})
