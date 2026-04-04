export type TipoAsistencia = 'asistencia' | 'inasistencia' | 'justificada'
export type Calificacion = 'aprobado' | 'reprobado'

export interface Inscrito {
  id: number
  nombre: string
  departamento: string
  email: string
}

export interface Sesion {
  id: string      // YYYY-MM-DD (clave única)
  fecha: string   // texto legible
  asistencias: Record<number, TipoAsistencia>
}

export interface CursoInstructor {
  id: number
  nombre: string
  descripcion: string
  modalidad: 'Presencial' | 'Online' | 'Híbrido'
  aula: string
  horario: string
  duracion: string
  fechaInicio: string
  fechaFin: string
  estado: 'activo' | 'finalizado'
  inscritos: Inscrito[]
}

// ── Mock estático ─────────────────────────────────────────────────────────
const _ins1: Inscrito[] = [
  { id: 1, nombre: 'Sergio Barreras',   departamento: 'ISC',  email: 'sergio@itesca.edu.mx' },
  { id: 2, nombre: 'Jose Luis Beltran', departamento: 'LANI', email: 'jlbeltran@itesca.edu.mx' },
  { id: 3, nombre: 'Ana García',        departamento: 'LANI', email: 'empleado@itesca.edu.mx' },
  { id: 4, nombre: 'Carlos Ramírez',    departamento: 'ISC',  email: 'carlos@itesca.edu.mx' },
]

const _ins2: Inscrito[] = [
  { id: 1, nombre: 'Sergio Barreras', departamento: 'ISC', email: 'sergio@itesca.edu.mx' },
  { id: 5, nombre: 'María López',     departamento: 'DIR', email: 'mlopez@itesca.edu.mx' },
  { id: 6, nombre: 'Roberto Soto',    departamento: 'ISC', email: 'rsoto@itesca.edu.mx' },
]

export const cursosInstructor: CursoInstructor[] = [
  {
    id: 1,
    nombre: 'Programación',
    descripcion: 'Programación inicial en Java. Estructuras de datos, POO y lógica de programación aplicada al desarrollo de software.',
    modalidad: 'Online',
    aula: 'Aula Virtual 501',
    horario: 'Lun–Vie 10:00–11:00',
    duracion: '40 hrs',
    fechaInicio: '10 Feb 2026',
    fechaFin: '20 May 2026',
    estado: 'activo',
    inscritos: _ins1,
  },
  {
    id: 2,
    nombre: 'Seguridad e Higiene',
    descripcion: 'Normativa de seguridad ocupacional e higiene en instalaciones educativas. Brigadas, señalización y simulacros.',
    modalidad: 'Presencial',
    aula: 'Salón 123',
    horario: 'Sáb 9:00–14:00',
    duracion: '20 hrs',
    fechaInicio: '5 Ene 2026',
    fechaFin: '10 Mar 2026',
    estado: 'finalizado',
    inscritos: _ins2,
  },
]

// ── Estado reactivo global ─────────────────────────────────────────────────
export const useInstructorCursos = () => {
  const sesiones = useState<Record<number, Sesion[]>>('instructor.sesiones', () => ({
    1: [
      { id: '2026-04-01', fecha: '1 abr 2026', asistencias: { 1: 'asistencia', 2: 'asistencia', 3: 'inasistencia', 4: 'justificada' } },
      { id: '2026-04-02', fecha: '2 abr 2026', asistencias: { 1: 'inasistencia', 2: 'justificada', 3: 'asistencia', 4: 'asistencia' } },
    ],
    2: [
      { id: '2026-01-10', fecha: '10 ene 2026', asistencias: { 1: 'asistencia', 5: 'asistencia', 6: 'inasistencia' } },
      { id: '2026-02-21', fecha: '21 feb 2026', asistencias: { 1: 'asistencia', 5: 'justificada', 6: 'asistencia' } },
    ],
  }))

  const calificaciones = useState<Record<number, Record<number, Calificacion | null>>>('instructor.calificaciones', () => ({
    1: { 1: null, 2: null, 3: null, 4: null },
    2: { 1: 'aprobado', 5: 'reprobado', 6: 'aprobado' },
  }))

  return { sesiones, calificaciones, cursosInstructor }
}
