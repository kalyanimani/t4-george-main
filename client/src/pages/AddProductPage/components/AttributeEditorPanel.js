import React, { useState, useEffect } from "react";
import styled from "styled-components";
import _ from "lodash";
import CreatableSelect, { makeCreatableSelect } from "react-select/creatable";
import Select from "react-select";
import CategoryOptionCreatePanel from "./CategoryOptionCreatePanel";

const AttributeEditorPanel = ({ categories, setAttributes, setAttributesOptions, onGenerateEnd, setEditorIntermediateResults }) => {
  const [categoryList, setCategoryList] = useState([]);
  const [categoryOptionsData, setCategoryOptionsData] = useState({});
  const [newCategory, setNewCategory] = useState(undefined);
  const [newParent, setNewParent] = useState(null);

  //Genereate CategoryList
  useEffect(() => {
    const tempCategories = [];
    for (const inCategory of categories) {
      const categoryAlreadyPresent = !!categoryList.find(
        (_category) => _category.value === inCategory.attributeName
      );
      if (!categoryAlreadyPresent)
        tempCategories.push({
          value: inCategory.attributeName,
          label: inCategory.attributeName,
          isDisabled: false,
        });
    }
    setCategoryList([...categoryList, ...tempCategories]);
  }, [categories]);

  const handleNewCategorySelected = (value) => {
    setNewCategory(value);
  };

  const handleNewParentSelected = (value) => {
    console.log("Parent value", value);
    if (value.value === "__self__") setNewParent(null);
    else setNewParent(value.value);
  };

  const handleAddCategory = () => {
    const tempCategoryList = _.cloneDeep(categoryList);
    const categoryIndex = categoryList.findIndex(
      (_category) => _category.value === newCategory.value
    );
    if (!newCategory.__isNew__) {
      if (categoryIndex < 0) return;
      tempCategoryList[categoryIndex].isDisabled = true;
      setCategoryList(tempCategoryList);
    } else {
      if (categoryIndex >= 0) return;
      tempCategoryList.push({
        value: newCategory.label,
        label: newCategory.label,
        isDisabled: true,
      });
      setCategoryList(tempCategoryList);
    }

    if (categoryOptionsData[newCategory.value]) {
      //Show some error dialog becasue the category is already present
      return;
    }
    const tempCategoryOptionsData = _.cloneDeep(categoryOptionsData);
    tempCategoryOptionsData[newCategory.label] = {
      label: newCategory.label,
      children: [],
      options: { __self__: [] },
      parent: newParent ? tempCategoryOptionsData[newParent] : null,
    };
    if (newParent)
      tempCategoryOptionsData[newParent].children.push(
        tempCategoryOptionsData[newCategory.label]
      );

    setCategoryOptionsData(tempCategoryOptionsData);
  };

  const setOptionsByCategoryLabelAndOptionId = (categoryLabel, id, options) => {
    const tempOptions = _.cloneDeep(categoryOptionsData);
    tempOptions[categoryLabel]["options"][id] = options;
    console.log("Gonna be saved options", tempOptions);
    setCategoryOptionsData(tempOptions);
  };

  const getParentCategoriesSelectOptions = () => {
    return categoryList
      .filter((category) => category.isDisabled)
      .map((category) => {
        return {
          value: category.label,
          label: category.label,
        };
      })
      .concat([
        {
          value: "__self__",
          label: "None",
        },
      ]);
  };

  const unFlattenCategoryOptionData = (attributeName, key, res) => {
    const attirbute = categoryOptionsData[attributeName];
    if (!res[attributeName]) res[attributeName] = {};
    for (let option of attirbute.options[key]) {
      res[attributeName][option.label] = { ...option, children: null };
      if (attirbute.children.length > 0) {
        res[attributeName][option.label]["children"] = {};
        let childKey;
        if (key !== "__self__") {
          childKey = key + " >>> " + attirbute.label + "/" + option.label;
        } else {
          childKey = attirbute.label + "/" + option.label;
        }
        for (let child of attirbute.children) {
          unFlattenCategoryOptionData(
            child.label,
            childKey,
            res[attributeName][option.label].children
          );
        }
      }
    }
  };

  const generateProdcutVariationList = (attributeName, res) => {
    const attribute = res[attributeName];
    const out = [];
    for (let option of Object.values(attribute)) {
      const r = {
        [attributeName]: {
          label: option.label,
          cost: option.cost,
          skuPart: option.skuPart,
        },
      };
      if (option.children) {
        for (let childName of Object.keys(option.children)) {
          const r2 = generateProdcutVariationList(childName, option.children);
          for (let r2single of r2) {
            out.push({ ...r, ...r2single });
          }
        }
      } else {
        out.push(r);
      }
    }
    return out;
  };

  const generate = () => {
    const results = [];
    for (let attribute of Object.values(categoryOptionsData)) {
      if (!attribute.parent) {
        const res = {};
        console.log("res", res);
        unFlattenCategoryOptionData(attribute.label, "__self__", res);
        results.push(generateProdcutVariationList(attribute.label, res));
      }
    }

    let final = [];
    for (let result of results) {
      if (final.length === 0) {
        final = [...result];
      } else {
        if (result.length === 0) continue;
        const tempFinal = [];
        for (let f of final) {
          for (let r of result) {
            tempFinal.push({ ...f, ...r });
          }
        }
        final = [...tempFinal];
      }
    }
    console.log("final, categoryList, categoryOptionsData")
    console.log(final, categoryList)

    setAttributes(categoryList)
    setEditorIntermediateResults(final)

    const attributesOptions = _.cloneDeep(categoryOptionsData)
    for (const attributeOption of Object.values(attributesOptions)) {
      if (attributeOption.parent) {
        attributeOption.parentLabel = attributeOption.parent.label
        delete attributeOption.parent
      }
    }
    setAttributesOptions(attributesOptions)
    onGenerateEnd()
  };

  return (
    <Styles>
      <div className="container-fluid attribute-editor-panel-container">
        <div className="bg-light p-3 attribute-editor-panel-body" style={{}}>
          <div className="bg-light  attribute-editor-menu-section">
            <div className="mt-3">
              <label>Category</label>
              <CreatableSelect
                options={categoryList}
                onChange={handleNewCategorySelected}
              />
            </div>

            <div className="mt-3">
              <label>Parent</label>
              <Select
                options={getParentCategoriesSelectOptions()}
                onChange={handleNewParentSelected}
              ></Select>
            </div>

            <button
              className="btn btn-outline-primary mt-5 form-control"
              onClick={handleAddCategory}
            >
              Add New Category
            </button>
          </div>

          <div>
            <hr />
            <button
              type="button"
              className="btn btn-primary form-control"
              onClick={generate}
            >
              Generate
            </button>
          </div>
        </div>
        <div className="d-flex attribute-editor-main-section">
          {Object.values(categoryOptionsData).map((categoryOptions) => {
            return (
              <div>
                <CategoryOptionCreatePanel
                  setOptionsByCategoryLabelAndOptionId={
                    setOptionsByCategoryLabelAndOptionId
                  }
                  categoryOptions={categoryOptions}
                ></CategoryOptionCreatePanel>
              </div>
            );
          })}
        </div>
      </div>
    </Styles>
  );
};

const Styles = styled.div`
  .attribute-editor-panel-container {
  }
  .attribute-editor-panel-body {
    position: fixed;
    left: 0;
    z-index: 999;
    height: 100%;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    bottom: 0;
  }
  .attribute-editor-menu-section {
    width: 13rem;
    div {
    }
  }
  .attribute-editor-main-section {
    margin-left: 15rem;
  }
`;

export default AttributeEditorPanel;
