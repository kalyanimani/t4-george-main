import React, { Component, Fragment, useEffect, useState } from "react";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import { addAttributeMapping } from "../../../actions/attributemappingAction";
import { listParentAttributeCategory } from "../../../actions/parentattributecategoryAction";
import { listAttributeCategory } from "../../../actions/attributecategoryAction";
import { listProduct } from "../../../actions/productAction";
import axios from "axios";
import _ from "lodash";
import CreatableSelect, { makeCreatableSelect } from "react-select/creatable";
import CreateOptionsV2 from "./ProductGenerator/CreateOptionsV2";
import GeneratorResultsViewerEditor from "./ProductGenerator/GeneratorResultsViewerEditor";
import Select from "react-select";

const queryString = require("query-string");

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

const AddAttributePanel = ({ categories, setAttributeGeberatorResults }) => {
  console.log("categories", categories);
  const [categoryList, setCategoryList] = useState([]);
  const [categoryOptionsData, setCategoryOptionsData] = useState({});
  const [newCategory, setNewCategory] = useState(undefined);
  const [newParent, setNewParent] = useState(null);

  console.log("categoryOptionsData", categoryOptionsData);
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
    console.log("categoryOptionsData", categoryOptionsData);
    const results = [];
    for (let attribute of Object.values(categoryOptionsData)) {
      if (!attribute.parent) {
        const res = {};
        console.log("res", res);
        unFlattenCategoryOptionData(attribute.label, "__self__", res);
        results.push(generateProdcutVariationList(attribute.label, res));
      }
    }
    console.log("results", results);

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
    setAttributeGeberatorResults(final, categoryList);
  };

  return (
    <div className="container-fluid">
      <div className="">
        <div
          className="bg-light p-3"
          style={{
            position: "fixed",
            left: 0,
            zIndex: 999,
            height: "100%",
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
            bottom: 0,
          }}
        >
          <div>
            <div className="mt-3" style={{ width: "13rem" }}>
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
        <div className="d-flex" style={{ marginLeft: "15rem" }}>
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
    </div>
  );
};

class AddAttributeV3 extends Component {
  constructor() {
    super();
    this.state = {
      categories: [],
      show: false,
      attribuiteGeneratorResults: null,
      categoryListResult: [],
    };
  }
  componentDidMount() {
    this.props.listParentAttributeCategory();
    const parsed = queryString.parse("this.props.location.search");
    if (!parsed.productID) {
      return;
    }
    this.setState({
      productID: parsed.productID,
    });
  }

  setAttributeGeberatorResults = (attribuiteGeneratorResults, categoryList) => {
    this.setState({
      attribuiteGeneratorResults: attribuiteGeneratorResults,
      categoryListResult: categoryList,
    });
    this.handleClose();
  };

  handleOpen = () => {
    document.querySelector("body").classList.add("attr-modal-open");
    this.setState({ show: true });
  };

  handleClose = () => {
    document.querySelector("body").classList.remove("attr-modal-open");
    this.setState({ show: false });
  };

  render() {
    const { show } = this.state;
    const { listparentattributecategory, parentattributecategoryloading } =
      this.props.parentattributecategory;

    console.log(listparentattributecategory, parentattributecategoryloading);
    const canDisplay = !!listparentattributecategory;
    return (
      <div className="">
        <div className="d-flex flex-row-reverse">
          <button
            onClick={this.handleOpen}
            type="button"
            className="btn btn-primary btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#kt_modal_2"
          >
            Open Attribute Generator
          </button>
        </div>

        <div style={{ padding: "1rem", background: "#fff" }}>
          {!this.state.attribuiteGeneratorResults ? (
            <div>
              No attributes. Please generate attributes with attribute
              generator.
            </div>
          ) : (
            <GeneratorResultsViewerEditor
              data={this.state.attribuiteGeneratorResults}
              attributes={this.state.categoryListResult}
            ></GeneratorResultsViewerEditor>
          )}
          <div
            className={`modal bg-white fade ${show && "show"}`}
            tabindex="-1"
            id="kt_modal_2"
            style={show ? { display: "block" } : {}}
            role="dialog"
          >
            <div
              className="modal-dialog modal-fullscreen"
              style={{ width: "100%", margin: 0, maxWidth: "100%" }}
            >
              <div className="modal-content shadow-none">
                <div className="modal-header p-1">
                  <h6 className="modal-title" style={{ marginLeft: "15rem" }}>
                    Attributes Generator
                  </h6>
                  <div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      data-bs-dismiss="modal"
                      onClick={this.handleClose}
                    >
                      Close witout generating
                    </button>
                  </div>
                </div>
                <div
                  className="modal-body"
                  style={{ height: "95vh", overflow: "scroll" }}
                >
                  {canDisplay && (
                    <AddAttributePanel
                      setAttributeGeberatorResults={
                        this.setAttributeGeberatorResults
                      }
                      categories={listparentattributecategory || []}
                    ></AddAttributePanel>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

AddAttributeV3.propTypes = {
  auth: PropTypes.object.isRequired,
  addAttributeMapping: PropTypes.func.isRequired,
  listParentAttributeCategory: PropTypes.func.isRequired,
  listAttributeCategory: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  errors: state.errors,
  attributemapping: state.attributemapping,
  parentattributecategory: state.parentattributecategory,
  attributecategory: state.attributecategory,
  product: state.product,
});

export default connect(mapStateToProps, {
  addAttributeMapping,
  listParentAttributeCategory,
  listAttributeCategory,
  listProduct,
})(AddAttributeV3);
