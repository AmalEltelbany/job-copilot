import type { LoginInput, RegisterInput, UserDto } from "@copilot/shared";
import { api } from "@/lib/api-client";

export const authApi = {
  me: () => api<UserDto>("/auth/me"),
  login: (input: LoginInput) => api<UserDto>("/auth/login", { method: "POST", body: input }),
  register: (input: RegisterInput) => api<UserDto>("/auth/register", { method: "POST", body: input }),
  demo: () => api<UserDto>("/auth/demo", { method: "POST" }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),

};
