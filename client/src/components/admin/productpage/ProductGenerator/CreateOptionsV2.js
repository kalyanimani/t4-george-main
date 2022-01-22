import React, { Fragment, useEffect, useState } from "react";
import _ from "lodash";
import styled from "styled-components";
import { useTable, useBlockLayout, useResizeColumns } from "react-table";

import {
  sortableContainer,
  sortableElement,
  sortableHandle,
} from "react-sortable-hoc";
const DraggableContainer = sortableContainer(({ children }) => children);
const DraggableElement = sortableElement(({ children }) => children);
const DraggableHandle = sortableHandle(({ children }) => children);

const Handle = styled.div`
  flex: none;
  width: 7.5px;
  height: 100%;

  &::before {
    content: "";
    border-left: 4px dotted #ccc;
    display: block;
    height: 15px;
    margin: 3px 3px;
  }

  &:hover::before {
    border-color: #888;
  }
`;

const Styles = styled.div`
  .table {
    display: inline-block;
    border-spacing: 0;
    border: 1px solid #c3c3c3;

    .tr {
      :last-child {
        .td {
          border-bottom: 0;
        }
      }
    }

    .th,
    .td {
      margin: 0;
      padding: 0.2rem;
      border-bottom: 1px solid #c3c3c3;
      border-right: 1px solid #c3c3c3;

      ${
        "" /* In this example we use an absolutely position resizer,
       so this is required. */
      }
      position: relative;

      :last-child {
        border-right: 0;
      }

      .resizer {
        display: inline-block;
        background: #e3e3e3;
        width: 5px;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        transform: translateX(50%);
        z-index: 1;
        ${"" /* prevents from scrolling while dragging on touch devices */}
        touch-action:none;

        &.isResizing {
          background: red;
        }
      }
    }
  }
`;

function Table({
  columns,
  data,
  handleAddOptions,
  handleRemoveOptions,
  tableKey,
}) {
  const [newOptionFields, setNewOptionFields] = useState({});
  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 30,
      width: 150,
      maxWidth: 400,
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    resetResizing,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
    },
    useBlockLayout,
    useResizeColumns
  );

  const handleFieldValueChange = (value, fieldName) => {
    setNewOptionFields((optionFields) => {
      return { ...optionFields, [fieldName]: value };
    });
  };

  const handleAdd = () => {
    handleAddOptions(newOptionFields);
    setNewOptionFields(() => {
      return {};
    });
  };

  return (
    <React.Fragment>
      <div>
        <div
          {...getTableProps()}
          className={`table AtrrCreatorTable__table__${tableKey}`}
        >
          <div>
            {headerGroups.map((headerGroup) => (
              <div {...headerGroup.getHeaderGroupProps()} className="tr">
                <div className="th" style={{ width: "14.5px" }}></div>

                {headerGroup.headers.map((column) => (
                  <div {...column.getHeaderProps()} className="th">
                    {column.render("Header")}
                    {/* Use column.getResizerProps to hook up the events correctly */}
                    <div
                      {...column.getResizerProps()}
                      className={`resizer ${
                        column.isResizing ? "isResizing" : ""
                      }`}
                    />
                  </div>
                ))}
              </div>
            ))}
            {headerGroups.map((headerGroup) => (
              <div {...headerGroup.getHeaderGroupProps()} className="tr">
                <div className="th" style={{ width: "14.5px" }}></div>
                {headerGroup.headers.map((column) => (
                  <div {...column.getHeaderProps()} className="th">
                    {column.id === "__action" ? (
                      <button
                        onClick={() => handleAdd()}
                        className="btn btn-primary btn-sm"
                        style={{
                          width: "100%",
                          height: "100%",
                          boxSizing: "border-box",
                          padding: 0,
                        }}
                      >
                        Add
                      </button>
                    ) : (
                      <input
                        value={newOptionFields[column.id] || ""}
                        onChange={(e) => {
                          handleFieldValueChange(e.target.value, column.id);
                        }}
                        className="form-control px-1"
                        style={{
                          height: "2rem",
                          boxSizing: "border-box",
                          fontSize: 14,
                        }}
                      ></input>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div
            {...getTableBodyProps()}
            className={"AtrrCreatorTable__body__" + tableKey}
          >
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <DraggableElement key={row.id} index={i}>
                  <div {...row.getRowProps()} className="tr">
                    <div className="td">
                      <DraggableHandle>
                        <Handle />
                      </DraggableHandle>
                    </div>
                    {row.cells.map((cell) => {
                      return (
                        <div {...cell.getCellProps()} className="td">
                          {cell.column.id === "__action" ? (
                            <button
                              onClick={() =>
                                handleRemoveOptions(cell.row.index)
                              }
                              className="btn btn-outline-danger"
                              style={{
                                width: "100%",
                                height: "100%",
                                boxSizing: "border-box",
                                padding: 0,
                              }}
                            >
                              Delete
                            </button>
                          ) : (
                            cell.render("Cell")
                          )}
                        </div>
                      );
                    })}
                  </div>
                </DraggableElement>
              );
            })}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function CreateOptionsV2({ attributeLabel, options, setOptions, id }) {
  console.log("attribute", attributeLabel, options);

  const handleAddOptions = (newOptionFields) => {
    setOptions(id, [
      ...options,
      optionFields.reduce((pre, curr) => {
        return { ...pre, [curr.name]: newOptionFields[curr.name] };
      }, {}),
    ]);
  };

  const handleRemoveOptions = (indexToRemove) => {
    const clonedOptions = _.cloneDeep(options);
    clonedOptions.splice(indexToRemove, 1);
    setOptions(id, clonedOptions);
  };

  const columns = React.useMemo(
    () =>
      optionFields
        .map((field) => ({
          Header: field.displayName,
          accessor: field.name,
          width: 100,
        }))
        .concat([
          {
            Header: "",
            id: "__action",
            accessor: "__action",
            width: 50,
          },
        ]),
    []
  );

  const tableKey =
    attributeLabel +
    "__" +
    id
      .replaceAll("/", "--")
      .replaceAll(" >>> ", "---")
      .replace(/^[^a-z]+|[^\w:.-]+/gi, "");

  const getContainer = () => {
    return document.querySelector(".AtrrCreatorTable__body__" + tableKey);
  };

  const getHelperContainer = () => {
    return document.querySelector(".AtrrCreatorTable__table__" + tableKey);
  };

  const handleSortEnd = ({ oldIndex, newIndex }) => {
    const data = _.cloneDeep(options);
    const [removed] = data.splice(oldIndex, 1);
    data.splice(newIndex, 0, removed);
    setOptions(id, data);
  };

  return (
    <Styles>
      {id !== "__self__" && <div className="bg-light p-2">{id}</div>}
      <DraggableContainer
        useDragHandle
        getContainer={getContainer}
        helperContainer={getHelperContainer}
        onSortEnd={handleSortEnd}
      >
        <Table
          tableKey={tableKey}
          columns={columns}
          data={options}
          handleAddOptions={handleAddOptions}
          handleRemoveOptions={handleRemoveOptions}
        />
      </DraggableContainer>
    </Styles>
  );
}

export default CreateOptionsV2;

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
