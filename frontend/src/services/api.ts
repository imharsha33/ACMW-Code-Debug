export function getBackendUrl(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("acmw_backend_url");
    if (custom && custom.trim()) {
      let url = custom.trim();
      if (!url.endsWith("/api")) url = url.replace(/\/+$/, "") + "/api";
      return url;
    }
  }

  if (import.meta.env.VITE_API_URL) {
    let url = import.meta.env.VITE_API_URL.trim();
    if (!url.endsWith("/api")) url = url.replace(/\/+$/, "") + "/api";
    return url;
  }

  if (typeof window !== "undefined" && window.location.hostname) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8000/api";
    }
  }

  return "https://acmw-code-debug.onrender.com/api";
}

export function setCustomBackendUrl(url: string) {
  if (typeof window !== "undefined") {
    if (url.trim()) {
      localStorage.setItem("acmw_backend_url", url.trim());
    } else {
      localStorage.removeItem("acmw_backend_url");
    }
  }
}

export async function apiRequest(endpoint: string, method: string = "GET", body?: any, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const backendUrl = getBackendUrl();
  const targetUrl = `${backendUrl}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    throw new Error(`Execution Backend unreachable at ${backendUrl}.\nPlease ensure backend server is running (e.g. uvicorn app.main:app --host 0.0.0.0 --port 8000).\n\nError: ${err?.message || "Network error"}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error(`Execution Backend returned HTML at ${backendUrl}. Ensure FastAPI backend is running on port 8000 (not Vite/Firebase SPA).`);
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: "Network response was not ok" }));
    throw new Error(errData.detail || `HTTP Error ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (parseErr) {
    throw new Error(`Execution Backend response parse error from ${backendUrl}. Ensure FastAPI server is active.`);
  }
}

export async function apiLogin(email: string, pass: string) {
  return apiRequest("/auth/login", "POST", { email, password: pass });
}

export async function apiGetMe(token: string) {
  return apiRequest("/auth/me", "GET", undefined, token);
}

export async function apiFetchQuestions(token?: string) {
  return apiRequest("/questions", "GET", undefined, token);
}

export async function apiCreateQuestion(question: any, token: string) {
  return apiRequest("/questions", "POST", question, token);
}

export async function apiUpdateQuestion(id: string, question: any, token: string) {
  return apiRequest(`/questions/${id}`, "PUT", question, token);
}

export async function apiDeleteQuestion(id: string, token: string) {
  return apiRequest(`/questions/${id}`, "DELETE", undefined, token);
}

export async function apiFetchAssessments(token?: string) {
  return apiRequest("/assessments", "GET", undefined, token);
}

export async function apiUpdateAssessment(id: string, data: any, token: string) {
  return apiRequest(`/assessments/${id}`, "PUT", data, token);
}

export async function apiRunCode(payload: { question_id: string; attempt_id: string; language: string; source_code: string; input?: string }, token?: string) {

  return apiRequest("/code/run", "POST", payload, token);
}

export async function apiSubmitQuestion(attemptId: string, questionId: string, payload: any, token: string) {
  return apiRequest(`/attempts/${attemptId}/questions/${questionId}/submit`, "POST", payload, token);
}

export async function apiRecordEvent(attemptId: string, eventType: string, metadata: any, token?: string) {
  return apiRequest(`/attempts/${attemptId}/events`, "POST", { event_type: eventType, metadata }, token);
}

export async function apiFetchAdminDashboard(token: string) {
  return apiRequest("/dashboard/admin", "GET", undefined, token);
}

export async function apiFetchStudentDashboard(token: string) {
  return apiRequest("/dashboard/student", "GET", undefined, token);
}
