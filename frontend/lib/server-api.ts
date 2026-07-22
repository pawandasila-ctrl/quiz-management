import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5001";

export async function serverFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Cookie"] = `access_token=${token}`;
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BACKEND_URL}/api${endpoint}`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[ServerFetch] Failed to fetch ${endpoint}:`, error);
    return null;
  }
}
