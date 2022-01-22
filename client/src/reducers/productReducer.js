import {
  PRODUCT_LOADING,
  ADD_PRODUCT,
  EDIT_PRODUCT,
  DELETE_PRODUCT,
  LIST_PRODUCT,
  ADD_PRODUCT_ID,
  ADD_ORDER_ATTRIBUTES,
  PRODUCT_STOPLOADING,
} from "../actions/types";

const initialState = {
  addproduct: null,
  productloading: false,
  editproduct: null,
  deleteproduct: null,
  listproduct: null,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case PRODUCT_LOADING:
      return {
        ...state,
        productloading: true,
      };
    case PRODUCT_STOPLOADING:
      return {
        ...state,
        productloading: false,
      };

    case ADD_PRODUCT:
      return {
        ...state,
        addproduct: action.payload,
        productloading: false,
      };
    case EDIT_PRODUCT:
      return {
        ...state,
        editproduct: action.payload,
        productloading: false,
      };
    case LIST_PRODUCT:
      return {
        ...state,
        listproduct: action.payload,
        productloading: false,
      };
    case ADD_PRODUCT_ID:
      return {
        id: action.payload,
      };
    case ADD_ORDER_ATTRIBUTES:
      return {
        selectedAttribute: action.payload,
      };

    case DELETE_PRODUCT:
      return {
        ...state,
        deleteproduct: action.payload,
        productloading: false,
      };
      
    default:
      return state;
  }
}
