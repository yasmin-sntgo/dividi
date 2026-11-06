// Um único lugar para tratar as respostas e os erros do servidor.
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Não foi possível concluir a solicitação.');
  }

  return result as T;
}

export function sendJson<T>(path: string, method: 'POST' | 'PUT', data?: unknown) {
  return request<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
