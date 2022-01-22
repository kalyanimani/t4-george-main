import React, { useEffect, useState } from "react";
import useGetProductImageUploadURL from "../../../hooks/useGetProductImageUploadURL";
import useUpload from "../../../hooks/useUpload";
import CustomToast from "../../../commons/CustomToast";

const getPublicURL = (filePath) => {
  return `${process.env.REACT_APP_PUBLIC_CDN_URL}/${filePath}`;
};

const ProductImages = ({ register, setValue, watch, error }) => {
  const {
    mutateAsync: getProductImageUploadURL,
    isLoading: isLoadingGetUploadURL,
  } = useGetProductImageUploadURL();
  const { mutateAsync: upload, isLoading: isLoadingUpload } = useUpload();

  const [uploadedFileURLs, setUploadedFileURLs] = useState([]);
  const [newFile, setNewFile] = useState();

  useEffect(() => {
    setValue('images', uploadedFileURLs)
  }, [uploadedFileURLs])
  const handleUpload = async () => {
    try {
      const urlRes = await getProductImageUploadURL({
        fileType: newFile.type,
        fileName: newFile.name,
      })
      const res = await upload({ url: urlRes.url, file: newFile });
      setUploadedFileURLs([...uploadedFileURLs, getPublicURL(urlRes.filePath)]);
      setNewFile(undefined);
    } catch (e) {
      CustomToast.fire({
        type: "error",
        title: "Upload Failed. Please try again.",
      });
    }
  };

  const moveImage = (index, direction) => {
    const tempUploadedFileURLs = [...uploadedFileURLs];
    if (direction === "UP" && index > 0) {
      const tempFileUrl = tempUploadedFileURLs[index - 1];
      tempUploadedFileURLs[index - 1] = tempUploadedFileURLs[index];
      tempUploadedFileURLs[index] = tempFileUrl;
      setUploadedFileURLs(tempUploadedFileURLs);
    } else if (direction == "DOWN" && index < uploadedFileURLs.length - 1) {
      const tempFileUrl = tempUploadedFileURLs[index + 1];
      tempUploadedFileURLs[index + 1] = tempUploadedFileURLs[index];
      tempUploadedFileURLs[index] = tempFileUrl;
      setUploadedFileURLs(tempUploadedFileURLs);
    }
  };

  const removeImage = (index) => {
    const tempUploadedFileURLs = uploadedFileURLs.filter((_, i) => i !== index);
    setUploadedFileURLs(tempUploadedFileURLs);
  };

  const isLoading = isLoadingGetUploadURL || isLoadingUpload;
  return (
    <div className="py-2 px-3">
      <div className="btn-group w-100">
        <input
          className={`form-control ${error?.message && "is-invalid"
            } `}
          type="file"
          accept="png,jpg,jpeg,"
          onChange={(e) => setNewFile(e.target.files[0])}
        ></input>

        <button
          className="btn btn-outline-primary btn-sm"
          onClick={handleUpload}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div
                class="spinner-border spinner-border-sm text-primary mr-2"
                role="status"
              ></div>
            </>
          ) : (
            "Upload"
          )}
        </button>
      </div>
      <div>
        <div>
          <span className="invalid-feedback" style={{ display: "block" }}>
            {error?.message}
          </span>
        </div>
      </div>
      <div>
        {uploadedFileURLs.map((imgURL, index) => {
          return (
            <div className="mt-2" key={index}>
              <img
                src={imgURL}
                alt="Product Image"
                style={{ width: "100%" }}
              ></img>
              <div>
                <div
                  className="btn-group w-100"
                  role="group"
                  aria-label="Basic example"
                >
                  {uploadedFileURLs.length > 1 && (
                    <>
                      <button
                        onClick={() => moveImage(index, "UP")}
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={index == 0}
                      >
                        Move Up
                      </button>
                      <button
                        onClick={() => moveImage(index, "DOWN")}
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={uploadedFileURLs.length - 1 == index}
                      >
                        Move Down
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    type="button"
                    className="btn btn-outline-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductImages;
