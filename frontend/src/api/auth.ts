import api from "./axios";

export const login = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login", { email, password });
  return data as { token: string };
};

export const register = async (email: string, password: string, name?: string) => {
  const { data } = await api.post("/auth/register", { email, password, name });
  return data as { token: string };
};
