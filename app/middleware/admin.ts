// Solo permite acceso a usuarios con rol 'admin'
export default defineNuxtRouteMiddleware(() => {
  const { token, rol } = useAuth()
  if (!token.value) return navigateTo('/login')
  if (!rol.value || rol.value !== 'ADMIN') return navigateTo('/login')
})
