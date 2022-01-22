import axios from "axios";
const api = axios.create({
  baseURL: "",
});

api.interceptors.response.use(
  function (response) {
    return Promise.resolve(response.data);
  },
  function (error) {
    return Promise.reject(error.response.data);
  }
);

export default api;
