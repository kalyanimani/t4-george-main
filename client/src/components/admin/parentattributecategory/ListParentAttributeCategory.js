import React, { Component } from 'react';
import {PropTypes} from 'prop-types';
import {connect} from 'react-redux';
import Sidebarmobile from '../../layouts/SidebarMobile';
import Asidebar from '../../layouts/Asidebar';
import Header from '../../layouts/Header';
import HeadeTopbar from '../../layouts/HeaderTopbar';
import SubHeader from '../../layouts/SubHeader';
import Footer from '../../layouts/Footer';
import {listParentAttributeCategory,deleteParentAttributeCategory} from '../../../actions/parentattributecategoryAction'
import swal from 'sweetalert2';
import SearchInput, {createFilter} from 'react-search-input';
import {checkPermission} from '../../common/MenuList'

const KEYS_TO_FILTERS = ['attributeName','isEnabled',];
const Toast = swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1000
});


class ListParentAttributeCategory extends Component {
  constructor(){
    super();
    this.state={
       errors:{},
       searchTerm: '',
  
    }   
    this.onEditClick = this.onEditClick.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
    this.searchUpdated = this.searchUpdated.bind(this);

  
}
componentDidMount(){
  this.props.listParentAttributeCategory();
}

//calls when edit button is clicked
onEditClick(res){
  localStorage.setItem('editparentattribute',JSON.stringify(res))
  this.props.history.push('editparentattribute')
}
//calls when delete button is clicked
onDeleteClick(id){
  const deleteData={
      id:id
  }
  this.props.deleteParentAttributeCategory(deleteData)
}
searchUpdated (term) {
    this.setState({searchTerm: term})
}
componentWillReceiveProps(nextProps){
 
  if(nextProps.parentattributecategory.deleteparentattributecategory !== this.props.parentattributecategory.deleteparentattributecategory){
      Toast.fire({
          type: 'success',
          title: 'Parent Attribute Deleted Successfully',
        }).then(getResult=>{
          this.props.listParentAttributeCategory();
        })

  }
  if(nextProps.parentattributecategory.addparentattributecategory !== this.props.parentattributecategory.addparentattributecategory){
  
        this.props.listParentAttributeCategory();
  }
  
  if(nextProps.errors !== this.props.errors){
      Toast.fire({
          type: 'error',
          title: 'Check all the fields',
        })
      this.setState({errors:nextProps.errors});
  }
}

render() {
  const {listparentattributecategory,parentattributecategoryloading}=this.props.parentattributecategory;
  var tableResult;
  if(listparentattributecategory==null ||parentattributecategoryloading){
      tableResult=(<tr><td colSpan={5} className="text-center">Loading.....</td></tr>)
  }else{
      if(Object.keys(listparentattributecategory).length >0){
        var filterData= listparentattributecategory.filter(createFilter(this.state.searchTerm, KEYS_TO_FILTERS))
          tableResult=filterData.map(result=>{
                  return <tr>
                  <td>{result.attributeName}</td>
                  <td>{result.isEnabled}</td>
                  {/* <td><button className="btn btn-link" onClick={()=>this.onEditClick(result)}><span className="kt-badge kt-badge--brand kt-badge--inline kt-badge--pill">View/Edit</span></button></td>
                  <td><button  className="btn btn-link" onClick={()=>this.onDeleteClick(result._id)}><span className="kt-badge kt-badge--brand kt-badge--inline kt-badge--danger">Delete</span></button></td> */}
                   <td>
                    {checkPermission(this.props.auth,"PRODUCTS","UPDATE")&&
                    <button className="btn btn-link" onClick={()=>this.onEditClick(result)}><span className="kt-badge kt-badge--brand kt-badge--inline kt-badge--pill">Edit</span>
                    </button>}
                    </td>
                  <td>
                  {checkPermission(this.props.auth,"PRODUCTS","DELETE")&&
                    <button  className="btn btn-link" onClick={()=>this.onDeleteClick(result._id)}><span className="kt-badge kt-badge--brand kt-badge--inline kt-badge--danger">Delete</span>
                    </button>}
                  </td>
              </tr>
          })
      }else{
          tableResult=(<tr><td colSpan={4} className="text-center">No Record Found.....</td></tr>)
      }

  }

   return (
      <div>
    
        
              <div style={{padding:'0'}} className="kt-content  kt-grid__item kt-grid__item--fluid" id="kt_content">
                    <div className="kt-portlet">
                        <div className="kt-portlet__head kt-portlet__head--lg">
                            <div className="kt-portlet__head-label">
                                <span className="kt-portlet__head-icon">
                                <i className="kt-font-brand flaticon2-line-chart" />
                                </span>
                                <h3 className="kt-portlet__head-title">
                               List Parent Attribute Category
                                </h3>
                            </div>
                        </div>
                        <div className="col-sm-12 col-md-12">
                                    <SearchInput  placeholder="Search by Attribute Name" onChange={this.searchUpdated} className="search-input" />
                        </div>
                        <div className="kt-portlet__body" >
                        {/*begin: Datatable */}
                        <table   className="table table-striped table-bordered table-hover table-checkable">
                            <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Is Enabled</th>
                                <th>View/Edit</th>
                                <th>Delete</th>
                            </tr>
                            </thead>
                            <tbody>
                                  {tableResult}                   
                                
                            </tbody>
                            <tfoot>
                                <tr>
                                <th>Category Name</th>
                                <th>Is Enabled</th>
                                <th>View/Edit</th>
                                <th>Delete</th>
                                </tr>
                            </tfoot>
                        </table>
                        {/*end: Datatable */}
                        </div>
                    </div>
                
             </div>
           
          
    </div>
    )
  }
}

ListParentAttributeCategory.propTypes ={
    auth: PropTypes.object.isRequired,
    listParentAttributeCategory: PropTypes.func.isRequired,
    deleteParentAttributeCategory: PropTypes.func.isRequired,
}

const mapStateToProps = (state)=>({
  auth : state.auth,
  errors: state.errors,
  parentattributecategory :state.parentattributecategory
});

export default connect(mapStateToProps,{listParentAttributeCategory,deleteParentAttributeCategory})(ListParentAttributeCategory);