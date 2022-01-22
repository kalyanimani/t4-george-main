import React from "react";
import _ from "lodash";
import CreateOptionsV2 from "./CreateOptionsV2";

const CategoryOptionCreatePanel = ({
  categoryOptions,
  setOptionsByCategoryLabelAndOptionId,
}) => {
  const setOptions = (id, options) => {
    console.log("OPtions to set", id, options);
    setOptionsByCategoryLabelAndOptionId(categoryOptions.label, id, options);
  };
  console.log("CategoryOptionCreatePanel categoryOptions", categoryOptions);
  return (
    <div className="card m-1">
      <div className="card-header p-2 d-flex content-space-between">
        <div className="text-primary">
          <strong>{categoryOptions.label}</strong>
        </div>
      </div>
      <div className="card-body p-1">
        {categoryOptions.parent === null && (
          <CreateOptionsV2
            attributeLabel={categoryOptions.label}
            id={"__self__"}
            options={categoryOptions.options.__self__}
            setOptions={setOptions}
          ></CreateOptionsV2>
        )}

        {categoryOptions.parent !== null &&
          Object.keys(categoryOptions.parent.options).map((parentId) => {
            if (_.isEmpty(categoryOptions.parent.options[parentId])) return;
            return categoryOptions.parent.options[parentId].map((option) => {
              let id = `${categoryOptions.parent.label}/${option.label}`;
              if (parentId !== "__self__") {
                id = `${parentId} >>> ${id}`;
              }
              return (
                <CreateOptionsV2
                  attributeLabel={categoryOptions.label}
                  options={categoryOptions.options[id] || []}
                  id={id}
                  setOptions={setOptions}
                ></CreateOptionsV2>
              );
            });
          })}
      </div>
    </div>
  );
};

export default CategoryOptionCreatePanel;
