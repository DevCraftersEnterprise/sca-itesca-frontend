// composables/useCursoDetalle.ts
export const useCursoDetalle = () => {
  const curso = useState<any>('curso-actual', () => null)
  const cargando = useState('curso-cargando', () => false)
  const cargarCurso = async (id: number, force = false) => {
    if (curso.value?.id === id && !force) return
    const config = useRuntimeConfig()
    const token = useCookie('token').value
    cargando.value = true
    try {
      curso.value = await $fetch(`${config.public.apiBaseUrl}/cursos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      curso.value.asistencias = curso.value.asistencias.sort((a: any, b: any) => {
        return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      })
    } finally {
      cargando.value = false
    }
  }

  return { curso, cargarCurso, cargando }
}