import React, { useCallback, useEffect, useState } from "react";
import { EditableCell, Cell, Column, Table2 } from "@blueprintjs/table";
import SortableMultiSelect from "../../../components/common/SortableMultiSelect";
import _ from "lodash";

const prepareproductVariantsData = (
  skuGenerationOrderList,
  data,
  skuPrepend
) => {
  if (!data || data.length === 0) return [];
  const clonedData = _.cloneDeep(data);
  const variantsData = []
  for (let row of clonedData) {
    //Calculate SKU
    const variantDataRow = { attributes: row }
    if (skuGenerationOrderList && skuGenerationOrderList.length > 0) {
      const skuList = [skuPrepend];
      for (let attrName of skuGenerationOrderList) {
        const cell = row[attrName];
        if (cell) skuList.push(cell.skuPart);
        else skuList.push("");
      }
      variantDataRow["sku"] = skuList.join("-");
    }
    let totalAdditionalCost = 0;
    for (let cell of Object.values(row)) {
      console.log(cell.cost);
      totalAdditionalCost += cell.cost ? Number(cell.cost) : 0;
    }
    variantDataRow["totalAdditionalCost"] = totalAdditionalCost;
    variantsData.push(variantDataRow)
  }
  return variantsData;
};

const VariantsViewerEditor = ({ data, attributes, productTitle, productVariants, setProductVariants }) => {
  console.log("productVariants productVariants", productVariants);
  const [skuGenerationOrderList, setSkuGenerationOrderList] = useState([]);
  //const [productVariants, setproductVariants] = useState([]);
  const [skuPrepend, setSkuPrepend] = useState("");

  useEffect(() => {
    if (!productTitle) {
      setSkuPrepend("");
      return;
    }
    let skuPrepend = "";
    console.log(productTitle.trim().split(" "))
    for (const productTitlePart of productTitle.trim().split(" ")) {
      const ptp = productTitlePart?.trim();
      if (ptp && ptp.length > 0) skuPrepend += ptp[0].toUpperCase();
    }
    setSkuPrepend(skuPrepend);
  }, [productTitle]);

  useEffect(() => {
    if (skuGenerationOrderList.length === 0)
      setSkuGenerationOrderList(attributes.map((attribute) => attribute.label));
  }, [attributes]);

  useEffect(() => {
    const productVariants = prepareproductVariantsData(
      skuGenerationOrderList,
      data,
      skuPrepend
    );
    setProductVariants(productVariants);
  }, [skuGenerationOrderList, data, skuPrepend]);

  const cellRenderer = (attributeName, rowIdx) => {
    if (!productVariants[rowIdx]['attributes'][attributeName]) return <Cell></Cell>;
    return <Cell>{productVariants[rowIdx]['attributes'][attributeName].label || ""}</Cell>;
  };

  const costRenderer = (rowIdx) => {
    return <Cell>{productVariants[rowIdx].totalAdditionalCost}</Cell>;
  };

  const skuCellRenderer = (rowIdx) => {
    return (
      <EditableCell
        value={productVariants[rowIdx].sku}
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
      <table className="w-100 mb-3">
        <tr>
          <td style={{ width: "8rem" }}>
            <input
              className="form-control"
              value={skuPrepend}
              onChange={(e) => setSkuPrepend(e.target.value)}
            ></input>
          </td>
          <td>
            <SortableMultiSelect
              className="form-control"
              data={getDataForAttributeMultiSelect()}
              defaultSelectAll={true}
              onSelectedItemsChange={handleAttributesMultiSelectValueChanged}
            ></SortableMultiSelect>
          </td>
        </tr>
      </table>
      {productVariants &&
        <Table2 numRows={productVariants.length} defaultColumnWidth={120}>
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
      }
    </div>
  );
};
export default VariantsViewerEditor;
