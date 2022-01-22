import { useQuery } from "react-query";
import api from "../api/api";

const useGetAttributeCategories = () => {
  return useQuery("GET_ATTRIBUTE_CATEGORIES", () =>
    api.get("/api/attributecategory")
  );
};

export default useGetAttributeCategories;
