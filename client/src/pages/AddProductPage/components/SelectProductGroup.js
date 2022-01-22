import React, { useEffect, useState } from "react";
import { set } from "react-hook-form";
import useGetCategories from "../../../hooks/useGetCategories";

const SelectProductGroup = ({ register, watch, setValue }) => {
  const {
    data: categories,
    error: errorGetCategories,
    isLoading: isLoadingGetCategories,
  } = useGetCategories();

  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryChildren, setSubCategoryChildren] = useState([]);
  const selectedCategoryId = watch("categoryID");
  const selectedSubCategoryId = watch("subcategoryID");

  useEffect(() => {
    if (!categories) return;
    if (categories?.length > 0) setValue("categoryID", categories[0]._id);
  }, [categories]);

  //when category change update the subcategory options
  useEffect(() => {
    console.log("useEffect of category", selectedCategoryId);
    const _subCategories =
      categories?.find((category) => category._id === selectedCategoryId)
        ?.subCategories || [];
    setSubCategories(_subCategories);
    if (_subCategories.length > 0)
      setValue("subcategoryID", _subCategories[0]._id);
  }, [selectedCategoryId, categories]);

  //When subcategories changes update the subcategorychildren options
  useEffect(() => {
    const _subCategoryChildren =
      subCategories?.find(
        (subCategory) => subCategory._id === selectedSubCategoryId
      )?.subCategoryChildren || [];
    setSubCategoryChildren(_subCategoryChildren);
  }, [selectedSubCategoryId, subCategories]);

  return (
    <>
      {isLoadingGetCategories && (
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      )}
      {categories && (
        <>
          <div>
            <label>Select Group</label>
            <select {...register("categoryID")} className="form-control">
              {categories.map((category) => (
                <option value={category._id}>{category.categoryName}</option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <label>Select Sub Group</label>
            <select {...register("subcategoryID")} className="form-control">
              {subCategories.map((subCategory) => (
                <option value={subCategory._id}>
                  {subCategory.subCategoryName}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <label>Select Sub Group Child</label>
            <select
              {...register("subcategoryChildID")}
              className="form-control"
            >
              {subCategoryChildren.map((subCategoryChild) => (
                <option value={subCategoryChild._id}>
                  {subCategoryChild.subCategoryChildName}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </>
  );
};

export default SelectProductGroup;
