// src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:8000",
  timeout: 15000,
});

export const getHealth = async () => (await api.get("/health")).data;

export const getCountryYearPredictions = async ({ country, year, start_year, end_year } = {}) => {
  const params = new URLSearchParams();
  if (country?.length) params.append("country", country.join(","));
  if (year != null) params.append("year", String(year));
  if (start_year != null) params.append("start_year", String(start_year));
  if (end_year != null) params.append("end_year", String(end_year));
  const { data } = await api.get("/predictions/country-year", { params });
  return data; // [{ country, year, ghi_pred }]
};

export const getGlobalYearPredictions = async ({ year, start_year, end_year } = {}) => {
  const params = new URLSearchParams();
  if (year != null) params.append("year", String(year));
  if (start_year != null) params.append("start_year", String(start_year));
  if (end_year != null) params.append("end_year", String(end_year));
  const { data } = await api.get("/predictions/global-year", { params });
  return data; // [{ year, global_ghi_mean }]
};

export default api;
