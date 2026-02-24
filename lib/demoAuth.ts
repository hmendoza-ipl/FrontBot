export type DemoRole = "guest" | "staff" | "supervisor" | "admin";

export type DemoUser = {
  id: string;
  role: DemoRole;
  hotelId: string;
  fullName: string;
  roomNumber?: string;
};

export function getDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("frontbot_demo_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDemoUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("frontbot_demo_user");
}
