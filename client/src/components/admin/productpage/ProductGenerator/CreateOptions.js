import React, { Fragment, useEffect, useState } from "react";
import _ from "lodash";
import { Cell, Column, Table2, EditableCell } from "@blueprintjs/table";

const CreateOptions = ({ setOptions, id }) => {
  const [_options, _setOptions] = React.useState([]);
  const [newOptionFields, setNewOptionFields] = useState({});
  useEffect(() => {
    setOptions(id, _options);
  }, [_options]);

  const handleAddOptions = () => {
    _setOptions([
      ..._options,
      optionFields.reduce((pre, curr) => {
        return { ...pre, [curr.name]: newOptionFields[curr.name] };
      }, {}),
    ]);
    setNewOptionFields({});
  };

  const handleRemoveOptions = (indexToRemove) => {
    const clonedOptions = _.cloneDeep(_options);
    clonedOptions.splice(indexToRemove, 1);
    _setOptions(clonedOptions);
  };

  const [colWidths, setColWidths] = React.useState([150, 100, 100, 50]);
  const handleColWidthChange = (index, width) => {
    setColWidths(colWidths.map((val, i) => (i === index ? width : val)));
  };

  const handleFieldValueChange = (value, fieldName) => {
    setNewOptionFields({ ...newOptionFields, [fieldName]: value });
  };

  const fieldRenderer = (rowIdx, fieldName) => {
    return rowIdx === _options.length ? (
      <EditableCell
        onChange={(value) => handleFieldValueChange(value, fieldName)}
        intent={"primary"}
      ></EditableCell>
    ) : (
      <Cell>{_options[rowIdx][fieldName]}</Cell>
    );
  };

  const actionRenderer = (rowIdx) => {
    return rowIdx === _options.length ? (
      <Cell style={{ padding: 0 }}>
        <button
          className="btn btn-primary px-2 btn-sm border-0 m-0 w-100 h-100"
          style={{ borderRadius: 0 }}
          onClick={handleAddOptions}
        >
          Add
        </button>
      </Cell>
    ) : (
      <Cell style={{ padding: 0 }}>
        <button
          className="btn btn-outline-danger btn-sm px-2 border-0 m-0 w-100 h-100"
          onClick={() => handleRemoveOptions(rowIdx)}
        >
          Delete
        </button>
      </Cell>
    );
  };

  return (
    <Fragment>
      {id !== "_self" && <div className="bg-secondary">{id}</div>}
      <div>
        <Table2
          defaultRowHeight={28}
          selectionModes={[]}
          columnWidths={colWidths}
          numRows={_options.length + 1}
          onColumnWidthChanged={handleColWidthChange}
        >
          {optionFields.map((field) => (
            <Column
              name={field.displayName}
              cellRenderer={(rowIndex) => fieldRenderer(rowIndex, field.name)}
            />
          ))}
          <Column name="" cellRenderer={actionRenderer} />
        </Table2>
      </div>
    </Fragment>
  );
};

export default CreateOptions;

const optionFields = [
  {
    name: "label",
    displayName: "Label",
  },
  {
    name: "cost",
    displayName: "Cost",
  },
  {
    name: "skuPart",
    displayName: "SKU Part",
  },
];
