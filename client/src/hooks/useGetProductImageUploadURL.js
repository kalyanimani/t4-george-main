import { useMutation } from "react-query";
import api from "../api/api";

const useGetProductImageUploadURL = () => {
  return useMutation(({ fileType, fileName }) =>
    api.post(`/api/getProductImageUploadURL`, { fileType, fileName })
  );
};

export default useGetProductImageUploadURL;
