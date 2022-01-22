import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import VariantsGeneratorPanel from './components/VariantsGeneratorPanel';
import styled from 'styled-components';
import SelectProductGroup from './components/SelectProductGroup';
import ProductImages from './components/ProductImages';
import Asidebar from '../../components/layouts/Asidebar';
import Header from '../../components/layouts/Header';
import SubHeader from '../../components/layouts/SubHeader';
import HeaderTopbar from '../../components/layouts/HeaderTopbar';
import createProductRequestSchema from '../../../../common/schemas/createProductRequestSchema-ecma';
import { Card } from '@blueprintjs/core';

const AddProductPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(createProductRequestSchema)
  });
  const onSubmit = (data) => console.log(data);

  const productTitle = watch('name');
  return (
    <Styles>
      <div
        className='kt-content kt-grid__item kt-grid__item--fluid'
        id='kt_content'
      >
        <div className='kt-portlet card border-light'>
          <div className='kt-portlet__head card-header bg-white'>
            <div className='kt-portlet__head-label card-title'>
              <h3 className='kt-portlet__head-title'>Add Product</h3>
            </div>
          </div>
          <div className='kt-portlet__body card-body'>
            <form onSubmit={handleSubmit(onSubmit)} id={'add-product-form'}>
              <div className='row'>
                <div className='col-md-9'>
                  <Card className=''>
                    <legend className='w-auto text-primary'>
                      Basic Details
                    </legend>
                    <div className='row'>
                      <div className='col-md-3'>
                        <label className=''>Name</label>
                        <input
                          {...register('name')}
                          name='name'
                          type='text'
                          className={`form-control ${
                            errors.name?.message && 'is-invalid'
                          } `}
                          maxLength={100}
                        />
                        <span className='invalid-feedback'>
                          {errors.name?.message}
                        </span>
                      </div>

                      <div className='col-md-3'>
                        <label className=''>Price</label>
                        <input
                          {...register('price')}
                          type='number'
                          name='price'
                          className={`form-control ${
                            errors.price?.message && 'is-invalid'
                          } `}
                        />
                        <span className='invalid-feedback'>
                          {errors.price?.message}
                        </span>
                      </div>

                      <div className='col-md-3'>
                        <label className=''>Discount Price</label>
                        <input
                          {...register('discountPrice')}
                          name='discountPrice'
                          type='number'
                          className={`form-control ${
                            errors.discountPrice?.message && 'is-invalid'
                          } `}
                        />
                        <span className='invalid-feedback'>
                          {errors.discountPrice?.message}
                        </span>
                      </div>

                      <div className='col-md-3'>
                        <label className=''>Count In Stock</label>
                        <input
                          {...register('stockCount')}
                          name='stockCount'
                          type='number'
                          className={`form-control ${
                            errors.stockCount?.message && 'is-invalid'
                          } `}
                        />
                        <span className='invalid-feedback'>
                          {errors.stockCount?.message}
                        </span>
                      </div>
                    </div>

                    <div className='row mt-3'>
                      <div className='col-md-12'>
                        <label className=''>Description</label>
                        <textarea
                          {...register('description')}
                          name='description'
                          rows='2'
                          maxLength={150}
                          className={`form-control ${
                            errors.description?.message && 'is-invalid'
                          } `}
                        ></textarea>
                        <span className='invalid-feedback'>
                          {errors.description?.message}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <div className='row'>
                    <div className='col-md-4'>
                      <fieldset className='border p-3 mt-3'>
                        <legend className='w-auto text-primary'>
                          Product Group
                        </legend>
                        <SelectProductGroup
                          register={register}
                          setValue={setValue}
                          watch={watch}
                        ></SelectProductGroup>
                      </fieldset>
                    </div>
                  </div>

                  <div className='row'>
                    <div className='col-md-12'>
                      <fieldset className='border mt-3'>
                        <legend className='w-auto ml-3 text-primary'>
                          Product Variants
                        </legend>
                        <small className='text-danger p-2'>
                          {errors?.productVariants?.message}
                        </small>
                        <VariantsGeneratorPanel
                          productTitle={productTitle}
                          attributeOptions={watch('attributeOptions')}
                          productVariants={watch('productVariants')}
                          setAttributesOptions={(attributeOptions) =>
                            setValue('attributeOptions', attributeOptions)
                          }
                          setProductVariants={(productVariants) =>
                            setValue('productVariants', productVariants)
                          }
                        ></VariantsGeneratorPanel>
                      </fieldset>
                    </div>
                  </div>
                </div>
                <div className='col-md-3'>
                  <fieldset className='border'>
                    <legend className='w-auto ml-3 text-primary'>
                      Gallery
                    </legend>
                    <ProductImages
                      register={register}
                      setValue={setValue}
                      watch={watch}
                      error={errors.images}
                    ></ProductImages>
                  </fieldset>
                </div>
              </div>
            </form>
            <div className='mt-4'>
              <button
                type='submit'
                className='btn btn-primary'
                form='add-product-form'
              >
                Save & Publish
              </button>

              <button
                type='submit'
                className='btn btn-primary ml-2'
                form='add-product-form'
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </Styles>
  );
};

const Styles = styled.div`
  legend {
    font-size: 1.2rem;
  }
`;

export default () => {
  return (
    <div className='kt-grid kt-grid--hor kt-grid--root'>
      <div className='kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver kt-page'>
        {/* begin:: Aside */}
        <Asidebar />
        {/* end:: Aside */}
        <div
          className='kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor kt-wrapper'
          id='kt_wrapper'
        >
          {/* begin:: Header */}
          <div
            id='kt_header'
            className='kt-header kt-grid__item  kt-header--fixed '
          >
            <Header />
            <HeaderTopbar />
          </div>
          <div className='kt-grid__item kt-grid__item--fluid kt-grid kt-grid--hor'>
            <SubHeader first='Home' second='Add Product' third='' />
            <div
              className='kt-content  kt-grid__item kt-grid__item--fluid p-0'
              id='kt_content'
            ></div>
            <AddProductPage></AddProductPage>
          </div>
        </div>
      </div>
    </div>
  );
};
