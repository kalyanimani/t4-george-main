import React, { useState } from "react";
import styled from "styled-components";
import AttributeEditorPanel from "./AttributeEditorPanel";
import VariantsViewerEditor from "./VariantsViewerEditor";
import useGetAttributeCategories from "../../../hooks/useGetAttributeCategories";
import _ from "lodash";

const VariantsGeneratorPanel = ({ productTitle, setAttributesOptions, attributeOptions, productVariants, setProductVariants }) => {
  const { data: categories, isLoading: isLoadingCategories } =
    useGetAttributeCategories();
  const [show, setShow] = useState(false);
  const [attributes, setAttributes] = useState([]);
  const [editorIntermediateResults, setEditorIntermediateResults] = useState(null)


  const handleOpen = () => {
    document.querySelector("body").classList.add("attr-modal-open");
    setShow(true);
  };

  const handleClose = () => {
    document.querySelector("body").classList.remove("attr-modal-open");
    setShow(false);
  };

  const canDisplay = !isLoadingCategories;
  return (
    <Styles>
      <div className="d-flex flex-row-reverse bg-light px-3 py-2">
        <button
          onClick={handleOpen}
          type="button"
          className="btn btn-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#kt_modal_2"
        >
          Open Variants Generator
        </button>
      </div>

      <div className="attribute-generator-body p-3">
        {!attributeOptions ? (
          <div>
            No Variants. Please generate Variants with attribute Variants.
          </div>
        ) : (
          <VariantsViewerEditor
            productTitle={productTitle}
            data={editorIntermediateResults}
            attributes={attributes}
            productVariants={productVariants}
            setProductVariants={setProductVariants}
          ></VariantsViewerEditor>
        )}
        <div
          className={`modal bg-white fade ${show && "show"}`}
          tabindex="-1"
          id="kt_modal_2"
          style={show ? { display: "block" } : {}}
          role="dialog"
        >
          <div className="modal-dialog modal-fullscreen">
            <div className="modal-content shadow-none">
              <div className="modal-header p-1">
                <h6 className="modal-title">Attributes Generator</h6>
                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    data-bs-dismiss="modal"
                    onClick={handleClose}
                  >
                    Close witout generating
                  </button>
                </div>
              </div>
              <div className="modal-body">
                {canDisplay && (
                  <AttributeEditorPanel
                    setAttributesOptions={setAttributesOptions}
                    setEditorIntermediateResults={setEditorIntermediateResults}
                    setAttributes={setAttributes}
                    categories={categories}
                    onGenerateEnd={() => handleClose()}
                  ></AttributeEditorPanel>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Styles >
  );
};

const Styles = styled.div`
  .attribute-generator-body {
    background: #fff;
  }
  .modal-dialog {
    width: 100%;
    margin: 0;
    max-width: 100%;
  }
  .modal-title {
    margin-left: 15rem;
  }
  .modal-body {
    height: 95vh;
    overflow: scroll;
  }
`;

export default VariantsGeneratorPanel;
