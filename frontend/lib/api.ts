const API_BASE = process.env.NEXT_PUBLIC_API_URL;

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

export const api = {
    // Assignments
    getAssignments: () =>
        fetchJSON<{ success: boolean; data: unknown[] }>(`${API_BASE}/assignments`),

    getAssignment: (id: string) =>
        fetchJSON<{ success: boolean; data: unknown }>(`${API_BASE}/assignments/${id}`),

    createAssignment: (formData: FormData) =>
        fetchJSON<{ success: boolean; data: unknown }>(`${API_BASE}/assignments`, {
            method: 'POST',
            body: formData,
        }),

    deleteAssignment: (id: string) =>
        fetchJSON<{ success: boolean }>(`${API_BASE}/assignments/${id}`, { method: 'DELETE' }),

    getPaper: (assignmentId: string) =>
        fetchJSON<{ success: boolean; data: unknown }>(`${API_BASE}/assignments/${assignmentId}/paper`),

    regenerate: (assignmentId: string) =>
        fetchJSON<{ success: boolean; data: unknown }>(`${API_BASE}/assignments/${assignmentId}/regenerate`, {
            method: 'POST',
        }),
};
