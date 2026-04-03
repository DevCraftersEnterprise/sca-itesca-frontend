<script setup lang="ts">
// Redirige al login si no hay sesión, o al dashboard correspondiente
const { isAuthenticated, rol } = useAuth()

if (isAuthenticated.value) {
  const destinos = { admin: '/admin', empleado: '/empleado', instructor: '/instructor' }
  navigateTo(destinos[rol.value!])
} else {
  navigateTo('/login')
}
</script>
