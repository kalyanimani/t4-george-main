import React, { useCallback, useEffect, useState } from "react";
import { EditableCell, Cell, Column, Table2 } from "@blueprintjs/table";
import _ from "lodash";
import SortableMultiSelect from "../../../common/SortableMultiSelect";

const prepareProductVariationsData = (skuGenerationOrderList, data) => {
  if (!data || data.length === 0) return [];
  const clonedData = _.cloneDeep(data);
  for (let row of clonedData) {
    //Calculate SKU
    if (skuGenerationOrderList && skuGenerationOrderList.length > 0) {
      const skuList = [];
      for (let attrName of skuGenerationOrderList) {
        const cell = row[attrName];
        if (cell) skuList.push(cell.skuPart);
        else skuList.push("");
      }
      row["sku"] = skuList.join("-");
    }
    const totalAdditionalCost = 0;
    for (let cell of Object.values(row)) {
      console.log(cell.cost);
      totalAdditionalCost += cell.cost ? Number(cell.cost) : 0;
    }
    row["totalAdditionalCost"] = totalAdditionalCost;
  }
  return clonedData;
};

const GeneratorResultsViewerEditor = ({ data, attributes }) => {
  console.log("data", data);
  const [skuGenerationOrderList, setSkuGenerationOrderList] = useState([]);
  const [productVariations, setProductVariations] = useState([]);

  useEffect(() => {
    if (skuGenerationOrderList.length === 0)
      setSkuGenerationOrderList(attributes.map((attribute) => attribute.label));
  }, [attributes]);

  useEffect(() => {
    const productVariations = prepareProductVariationsData(
      skuGenerationOrderList,
      data
    );
    console.log(productVariations);
    setProductVariations(productVariations);
  }, [skuGenerationOrderList, data]);

  const cellRenderer = (attributeName, rowIdx) => {
    if (!productVariations[rowIdx][attributeName]) return <Cell></Cell>;
    return <Cell>{productVariations[rowIdx][attributeName].label || ""}</Cell>;
  };

  const costRenderer = (rowIdx) => {
    return <Cell>{productVariations[rowIdx].totalAdditionalCost}</Cell>;
  };

  const skuCellRenderer = (rowIdx) => {
    return (
      <EditableCell
        value={productVariations[rowIdx].sku}
        intent={"primary"}
      ></EditableCell>
    );
  };

  const getDataForAttributeMultiSelect = useCallback(() => {
    return attributes.map((attribute) => {
      return {
        value: attribute.label,
        label: attribute.label,
      };
    });
  }, [attributes]);

  const handleAttributesMultiSelectValueChanged = (items) => {
    if (items) setSkuGenerationOrderList(items.map((i) => i.value));
    else setSkuGenerationOrderList([]);
  };

  return (
    <div>
      <label>SKU Generation category list</label>
      <SortableMultiSelect
        data={getDataForAttributeMultiSelect()}
        defaultSelectAll={true}
        onSelectedItemsChange={handleAttributesMultiSelectValueChanged}
      ></SortableMultiSelect>
      <br />
      <Table2 numRows={productVariations.length} defaultColumnWidth={120}>
        <Column name={"SKU"} cellRenderer={skuCellRenderer}></Column>
        <Column
          name={"Total Additional Cost"}
          cellRenderer={costRenderer}
        ></Column>
        {attributes.map((attribute) => (
          <Column
            name={attribute.label}
            cellRenderer={(rowIdx) => cellRenderer(attribute.label, rowIdx)}
          />
        ))}
      </Table2>
    </div>
  );
};
export default GeneratorResultsViewerEditor;
