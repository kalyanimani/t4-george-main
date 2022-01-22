import swal from "sweetalert2";

const CustomToast = swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 5000,
});

export default CustomToast;
