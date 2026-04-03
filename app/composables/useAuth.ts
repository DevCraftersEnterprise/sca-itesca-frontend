export type Rol = 'admin' | 'empleado' | 'instructor'

export interface CursoUsuario {
  nombre: string
  tipo: 'interno' | 'externo'
  modalidad: string
  instructor: string
  estado: 'en progreso' | 'esperando_validacion' | 'completado'
  fechaTermino: string
  descripcion?: string
  aula?: string
  horario?: string
  duracion?: string
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
  departamento?: string
  cursosAnio?: CursoUsuario[]
  cursosHistorico?: number
}

const META_INTERNOS = 2
const META_EXTERNOS = 1
export const META_ANUAL = META_INTERNOS + META_EXTERNOS

export const useAuth = () => {
  const usuario = useState<Usuario | null>('auth.usuario', () => null)

  const isAuthenticated = computed(() => !!usuario.value)
  const rol = computed(() => usuario.value?.rol ?? null)

  const login = async (credenciales: { email: string; password: string }) => {
    // TODO: reemplazar con llamada real a API
    // usuario.value = await $fetch('/api/auth/login', { method: 'POST', body: credenciales })

    // ── Mock temporal ──────────────────────────────────────────────
    const mocks: Record<string, Usuario> = {
      'admin@itesca.edu.mx': {
        id: 1, nombre: 'Cristian Geovani', email: credenciales.email, rol: 'admin',
        departamento: 'Dirección', cursosHistorico: 8,
        cursosAnio: [
          { nombre: 'Protección Civil', tipo: 'interno', modalidad: 'Presencial', instructor: 'Carlos Ruiz', estado: 'completado', fechaTermino: '15 Feb 2026' },
          { nombre: 'Derechos Humanos CNDH', tipo: 'externo', modalidad: 'Online', instructor: '—', estado: 'en progreso', fechaTermino: '30 Abr 2026' },
        ],
      },
      'empleado@itesca.edu.mx': {
        id: 3, nombre: 'Ana García', email: credenciales.email, rol: 'empleado',
        departamento: 'LANI', cursosHistorico: 5,
        cursosAnio: [
          { nombre: 'Introducción a la Programación', tipo: 'interno', modalidad: 'Online', instructor: 'Ricardo Pérez', estado: 'en progreso', fechaTermino: '20 May 2026', descripcion: 'Fundamentos de programación orientada a objetos con Java. Incluye estructuras de datos, ciclos y POO.', aula: 'Aula Virtual 3', horario: 'Lun–Vie 10:00–11:00', duracion: '40 hrs' },
          { nombre: 'Protección Civil', tipo: 'interno', modalidad: 'Presencial', instructor: 'Carlos Ruiz', estado: 'completado', fechaTermino: '15 Feb 2026', descripcion: 'Brigadas de seguridad, planes de evacuación y primeros auxilios institucionales.', aula: 'Auditorio ITESCA', horario: 'Sáb 9:00–14:00', duracion: '10 hrs' },
          { nombre: 'Derechos Humanos CNDH', tipo: 'externo', modalidad: 'Online', instructor: '—', estado: 'esperando_validacion', fechaTermino: '01 Mar 2026', descripcion: 'Curso certificado por la Comisión Nacional de Derechos Humanos sobre derechos fundamentales en el servicio público.' },
        ],
      },
      'instructor@itesca.edu.mx': {
        id: 2, nombre: 'Ricardo Pérez', email: credenciales.email, rol: 'instructor',
        departamento: 'ISC', cursosHistorico: 12,
        cursosAnio: [
          { nombre: 'Seguridad e Higiene', tipo: 'interno', modalidad: 'Presencial', instructor: 'María López', estado: 'completado', fechaTermino: '10 Ene 2026' },
        ],
      },
    }
    const mockUser = mocks[credenciales.email]
    if (!mockUser) throw new Error('Usuario no encontrado')
    usuario.value = mockUser

    const destinos: Record<Rol, string> = { admin: '/admin', empleado: '/empleado', instructor: '/instructor' }
    navigateTo(destinos[mockUser.rol])
    // ──────────────────────────────────────────────────────────────
  }

  const logout = () => {
    usuario.value = null
    navigateTo('/login')
  }

  return { usuario, isAuthenticated, rol, login, logout }
}
