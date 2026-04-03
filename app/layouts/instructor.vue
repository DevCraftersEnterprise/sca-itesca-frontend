<script setup lang="ts">
const { usuario, logout } = useAuth()

const navLinks = [
  { label: 'Inicio',        to: '/instructor' },
  { label: 'Mis Cursos',    to: '/instructor/cursos' },
  { label: 'Mi Perfil',     to: '/instructor/perfil' },
]
</script>

<template>
  <div class="flex min-h-screen">
    <AppSidebar :links="navLinks" titulo="Portal Instructor" />

    <div class="flex-1 flex flex-col">
      <AppHeader :nombre="usuario?.nombre" @logout="logout" />

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
