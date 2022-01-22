import React, { Component, Fragment, useEffect } from "react";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import { addAttributeMapping } from "../../../actions/attributemappingAction";
import { listParentAttributeCategory } from "../../../actions/parentattributecategoryAction";
import { listAttributeCategory } from "../../../actions/attributecategoryAction";
import { listProduct } from "../../../actions/productAction";
import axios from "axios";
import _ from "lodash";
import CreateOptions from "./ProductGenerator/CreateOptions";
import CreateOptionsV2 from "./ProductGenerator/CreateOptions";
import GeneratorResultsViewerEditor from "./ProductGenerator/GeneratorResultsViewerEditor";
const queryString = require("query-string");

/*
const OptionsTags = ({ setOptions, id }) => {
  const [_options, _setOptions] = React.useState([])
  const [newLabel, setNewLabel] = React.useState("");
  const [newCost, setNewCost] = React.useState("");
  const [newSKUPart, setNewSKUPart] = React.useState("");

  useEffect(() => {
    setOptions(id, _options)
  }, [_options])

  const handleAddOptions = () => {
    _setOptions([..._options, { label: newLabel, cost: newCost, skuPart: newSKUPart }])
    setNewLabel("")
    setNewCost("")
    setNewSKUPart("")
  }

  const handleRemoveOptions = (indexToRemove) => {
    console.log(">>>indexToRemove", indexToRemove)
    const clonedOptions = _.cloneDeep(_options)
    clonedOptions.splice(indexToRemove, 1)
    _setOptions(clonedOptions)
  }

  const [colWidths, setColWidths] = React.useState([150, 100, 100, 70])
  const handleColWidthChange = (index, width) => {
    setColWidths(colWidths.map((val, i) => i === index ? width : val))
  }

  const labelRenderer = (rowIdx) => {
    return rowIdx === _options.length ?
      <EditableCell style={{ width: "100%" }} onChange={(value) => setNewLabel(value)} intent={"primary"}></EditableCell>
      : <Cell>{_options[rowIdx].label}</Cell>
  }

  const costRenderer = (rowIdx) => {
    return (rowIdx === _options.length) ?
      <EditableCell onChange={(value) => setNewCost(value)} intent={"primary"}></EditableCell>
      : <Cell>{_options[rowIdx].cost}</Cell>
  }

  const skuPartRenderer = (rowIdx) => {
    return rowIdx === _options.length ?
      <EditableCell onChange={(value) => setNewSKUPart(value)} intent={"primary"} style={{ cursor: "text" }}></EditableCell>
      : <Cell>{_options[rowIdx].skuPart}</Cell>
  }

  const actionRenderer = (rowIdx) => {
    return rowIdx === _options.length ?
      <Cell style={{ padding: 0, lineHeight: "normal" }}><button className="btn btn-primary btn-sm p-0 px-2 border-0 m-0" onClick={handleAddOptions}>Add</button> </Cell>
      : <Cell style={{ padding: 0, lineHeight: "normal" }}> <button className="btn btn-outline-danger btn-sm p-0 px-2 border-0 m-0" onClick={() => handleRemoveOptions(rowIdx)}>Delete</button> </Cell>
  }

  return (
    <Fragment>
      <Table2 selectionModes={[]} columnWidths={colWidths} numRows={_options.length + 1} onColumnWidthChanged={handleColWidthChange}>
        <Column name="Label" cellRenderer={labelRenderer} />
        <Column name="Cost" cellRenderer={costRenderer} />
        <Column name="SKU Part" cellRenderer={skuPartRenderer} />
        <Column name="" cellRenderer={actionRenderer} />
      </Table2 >
    </Fragment >
  )
}
*/

const ParentAttributePanel = ({
  attribute,
  setParent,
  allAttributes,
  getAttributeByName,
  setOptionsOfAttribute,
}) => {
  console.log("All attributes", allAttributes);
  const setOptions = (id, options) => {
    setOptionsOfAttribute(attribute.name, id, options);
  };

  const renderListOfOptionTagsPerParentOption = () => {
    if (!attribute.parent)
      return <div>This attribute is not dependent on ant other attribute</div>; //If the attribute doest not have parent, no point in calling this  function
    //There are two situations 1. Parent of this attribute does not have parent 2. Or it does have parent.
    //If the parent of this attribute does not have parent , for each option of _self create <OptionTags>
    //If the parent of this attirbute has parent, for all options apart from _self create <Options
    const parentAttribute = getAttributeByName(attribute.parent);
    if (!parentAttribute) return <div>Invalid Parent attribute</div>;
    if (!parentAttribute.parent) {
      // Parent has not parent, map only _self key
      return parentAttribute.options._self.map((option) => (
        <CreateOptionsV2
          attribute={attribute}
          setOptions={setOptions}
          id={`${parentAttribute.name}/${option.label}`}
        ></CreateOptionsV2>
      ));
    } else {
      const parentAttributeOptionKeysWithoutSelf = Object.keys(
        parentAttribute.options
      ).filter((key) => key !== "_self");
      const optionsTags = [];
      for (let key of parentAttributeOptionKeysWithoutSelf) {
        for (let option of parentAttribute.options[key]) {
          optionsTags.push(
            <CreateOptionsV2
              attribute={attribute}
              setOptions={setOptions}
              id={`${key} >>> ${parentAttribute.name}/${option.label}`}
            ></CreateOptionsV2>
          );
        }
      }
      return optionsTags;
    }
  };

  return (
    <div className="mx-1" style={{ border: "1px solid #e3e3e3" }}>
      <div
        className="bg-light"
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "none",
          padding: "0.5rem",
        }}
      >
        <h5>{attribute.name}</h5>
        <div>
          <label className="mr-2">Depends on</label>
          <select
            className="form-select"
            onChange={(e) => setParent(attribute.name, e.target.value)}
            value={attribute.parent}
          >
            <option value={"__none"}>None</option>
            {allAttributes.map((a) => (
              <option value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        {!attribute.parent ? (
          <CreateOptionsV2
            attribute={attribute}
            setOptions={setOptions}
            id={"_self"}
          ></CreateOptionsV2>
        ) : (
          renderListOfOptionTagsPerParentOption()
        )}
      </div>
    </div>
  );
};

class AddAttributeV2 extends Component {
  constructor() {
    super();
    this.uploadImage = this.uploadImage.bind(this);
    this.state = {
      attributesData: null,
      show: false,
      attribuiteGeneratorResults: null,
    };
  }
  componentDidMount() {
    this.props.listParentAttributeCategory();
    // editing here
    // const parsed = queryString.parse(this.props.location.search);
    const parsed = queryString.parse("this.props.location.search");
    if (!parsed.productID) {
      // editing here
      // this.props.history.push("/admin/listproduct");
      return;
    }
    this.setState({
      productID: parsed.productID,
    });
  }

  static getDerivedStateFromProps = (props, state) => {
    const { listparentattributecategory, parentattributecategoryloading } =
      props.parentattributecategory;
    if (
      !!listparentattributecategory &&
      !parentattributecategoryloading &&
      !state.attributesData
    ) {
      const attributesData = [];
      for (let attributeCategory of listparentattributecategory) {
        attributesData.push({
          name: attributeCategory.attributeName,
          enabled: true,
          parent: null,
          children: [],
          options: { _self: [] },
        });
      }
      return { attributesData };
    }
    return {};
  };

  //for upload image
  uploadImage(e) {
    var self = this;
    const data = new FormData();
    data.append("file", e.target.files[0]);
    data.append("filename", e.target.files[0].name);
    axios
      .post("/upload", data)
      .then(function (response) {
        self.setState({
          photoUrl: response.data.file,
          uploadStatus: "Uploaded SuccessFully",
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  getAttributeByName = (name) => {
    return this.state.attributesData.find(
      (attribute) => attribute.name === name
    );
  };

  setParentOfAnAttribute = (name, parentName) => {
    const clonedAttibutesData = _.cloneDeep(this.state.attributesData);
    const attributeForWhichSetParent = clonedAttibutesData.find(
      (attr) => attr.name === name
    );
    if (attributeForWhichSetParent)
      attributeForWhichSetParent.parent =
        parentName == "__none" ? null : parentName;
    const parent = clonedAttibutesData.find((attr) => attr.name === parentName);
    if (parent) parent.children = [...new Set([...parent.children, name])];
    this.setState({ attributesData: clonedAttibutesData });
  };

  setOptionsOfAttribute = (name, key, options) => {
    console.log("setOptionsOfAttribute>>>", name, key, options);
    const clonedAttibutesData = _.cloneDeep(this.state.attributesData);
    const attributeForWhichSetOptions = clonedAttibutesData.find(
      (attr) => attr.name === name
    );
    console.log("attributeForWhichSetOptions", attributeForWhichSetOptions);
    attributeForWhichSetOptions.options[key] = options;
    this.setState({ attributesData: clonedAttibutesData });
  };

  f = (attributeName, key, res) => {
    const attirbute = this.getAttributeByName(attributeName);
    console.log("attributeName, key", attributeName, key);
    if (!res[attributeName]) res[attributeName] = {};
    for (let option of attirbute.options[key]) {
      res[attributeName][option.label] = { ...option, children: null };
      if (attirbute.children.length > 0) {
        res[attributeName][option.label]["children"] = {};
        let childKey;
        if (key !== "_self") {
          childKey = key + " >>> " + attirbute.name + "/" + option.label;
        } else {
          childKey = attirbute.name + "/" + option.label;
        }
        for (let child of attirbute.children) {
          this.f(child, childKey, res[attributeName][option.label].children);
        }
      }
    }
  };

  f2 = (attributeName, res) => {
    //console.log(attributeName, res)
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
          const r2 = this.f2(childName, option.children);
          for (let r2single of r2) {
            out.push({ ...r, ...r2single });
          }
        }
        console.log("out", out);
      } else {
        out.push(r);
      }
    }
    return out;
  };

  generate = () => {
    const results = [];
    for (let attribute of this.state.attributesData) {
      if (!attribute.parent) {
        const res = {};
        this.f(attribute.name, "_self", res);
        console.log("res", res);
        results.push(this.f2(attribute.name, res));
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
    console.log("final", final);

    this.setState({ attribuiteGeneratorResults: final });
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
    const { attributesData, show, attribuiteGeneratorResults } = this.state;
    const canDisplay = !!attributesData;
    return (
      <div className="card mt-2">
        <div
          className="card-header d-flex justify-content-between"
          style={{ background: "none" }}
        >
          <h5 className="">Attribute Generation</h5>
          <div className="card-toolbar">
            <button
              onClick={this.handleOpen}
              type="button"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#kt_modal_2"
            >
              Open Attribute Generator
            </button>
          </div>
        </div>

        <div style={{ padding: "1rem", background: "#fff" }}>
          {!attribuiteGeneratorResults ? (
            <div>
              No attributes. Please generate attributes with attribute
              generator.
            </div>
          ) : (
            <GeneratorResultsViewerEditor
              data={attribuiteGeneratorResults}
              attributes={attributesData}
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
                <div className="modal-header">
                  <h6 className="modal-title">Attributes Generator</h6>
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      data-bs-dismiss="modal"
                      onClick={this.handleClose}
                    >
                      Close witout generating
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={this.generate}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div className="modal-body" style={{ overflow: "scroll" }}>
                  {canDisplay && (
                    <div className="d-flex">
                      {attributesData.map((attribute) => (
                        <ParentAttributePanel
                          attribute={attribute}
                          setParent={this.setParentOfAnAttribute}
                          allAttributes={attributesData}
                          getAttributeByName={this.getAttributeByName}
                          setOptionsOfAttribute={this.setOptionsOfAttribute}
                        ></ParentAttributePanel>
                      ))}
                    </div>
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

AddAttributeV2.propTypes = {
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
})(AddAttributeV2);
