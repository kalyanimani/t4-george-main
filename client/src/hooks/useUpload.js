import { useMutation } from "react-query";
import api from "../api/api";

const useUpload = () => {
  return useMutation(({ url, file }) =>
    api.put(url, file, {
      transformRequest: (data, headers) => {
        delete headers.common["Authorization"];
        return data;
      },
    })
  );
};

export default useUpload;
