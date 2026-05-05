// services/cursos.ts
export const fetchMisCursos = async (config: any, token: string | null) => {
  if (!token) throw new Error('No hay token de sesión');
  const response: any = await $fetch(`${config.public.apiBaseUrl}/usuarios/mis-cursos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response; 
};