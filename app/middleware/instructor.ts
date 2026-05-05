export default defineNuxtRouteMiddleware(() => {
  const { token, rol } = useAuth()
  if (!token.value) {
    return navigateTo('/login')
  }
  if (rol.value !== 'INSTRUCTOR') {
    return navigateTo('/login')
  }
})
