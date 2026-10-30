
const API_BASE = "/api/v1";
const TOKEN_KEY = "meetorbit_access_token";

export type User = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  role: string;
};

export type LiveKitJoinResponse = {
  server_url: string;
  token: string;
  room_name: string;
  participant_identity: string;
  expires_in_seconds: number;
};

export type MeetingStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Meeting = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: MeetingStatus | string;
  scheduled_for: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingCreate = {
  title: string;
  description: string | null;
  scheduled_for: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
};

function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}
export function hasToken(): boolean {
  return Boolean(getToken());
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();

  if (authenticated && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot connect to MeetOrbit. Check that the backend is running.",
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body: { detail?: string | { msg?: string }[] } =
        await response.json();

      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((item) => item.msg ?? "Invalid input")
          .join(". ");
      }
    } catch {
      // Keep the fallback error message.
    }

    if (response.status === 401 && authenticated) {
      clearToken();
      window.dispatchEvent(new Event("meetorbit:unauthorized"));
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const result = await request<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false,
  );

  saveToken(result.access_token);
  return result;
}

export function register(
  full_name: string,
  email: string,
  password: string,
): Promise<User> {
  return request<User>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ full_name, email, password }),
    },
    false,
  );
}

export function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

export function getWorkspaces(): Promise<Workspace[]> {
  return request<Workspace[]>("/auth/me/workspaces");
}

export function getMeetings(
  workspaceId: string,
): Promise<Meeting[]> {
  return request<Meeting[]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/meetings`,
  );
}

export function createMeeting(
  workspaceId: string,
  payload: MeetingCreate,
): Promise<Meeting> {
  return request<Meeting>(
    `/workspaces/${encodeURIComponent(workspaceId)}/meetings`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function cancelMeeting(
  workspaceId: string,
  meetingId: string,
): Promise<Meeting> {
  return request<Meeting>(
    `/workspaces/${encodeURIComponent(workspaceId)}/meetings/${encodeURIComponent(meetingId)}`,
    { method: "DELETE" },
  );
}
export function joinMeeting(
  workspaceId: string,
  meetingId: string,
): Promise<LiveKitJoinResponse> {
  return request<LiveKitJoinResponse>(
    `/workspaces/${encodeURIComponent(workspaceId)}/meetings/${encodeURIComponent(meetingId)}/join`,
    { method: "POST" },
  );
}