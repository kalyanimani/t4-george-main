import { useQuery } from "react-query";
import api from "../api/api";

const useGetCategories = () => {
  return useQuery("GET_CATEGORIES", () => api.get("/api/category"));
};

export default useGetCategories;
