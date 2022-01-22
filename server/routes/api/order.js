const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const stripe = require('stripe')("sk_test_51ILJeWFFlK0Wy0K7uswKDiaRS0uuAm7mx5QrUpZosno2bhxfvZEkEWqv4HykEotF90qznPq0sAzFk8uW9ZNJHsta000hE9ir3K");

//Load document Schema
const Order = require('../../models/Order');
const OrderStatus = require('../../models/OrderStatus');
const Product = require('../../models/Product');
const OrderMeta = require('../../models/OrderMeta');
const Setting = require('../../models/Setting');
const axios = require('axios');
//QUICKBOOK OAUTH
const OAuthClient = require('intuit-oauth');
var oauthClientOrder = new OAuthClient({
  clientId: 'AB2T4UWnpedrpGq33wumOOGMzsG92cTzfytneE8xmJwwS1CtuP',
  clientSecret: 'jMywcYPlGTGA9Fd1Lt1eWbLQXJ5Tx19JbL4VBRC0',
  environment: 'sandbox',
  redirectUri: 'http://ec2-3-239-208-80.compute-1.amazonaws.com:5000/admin/quickbook/callback',
  //redirectUri: 'http://localhost:3000/admin/quickbook/callback',

});

const nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'AKIA2DXTH734PPQZQMEN', // generated ethereal user
    pass: 'BBkV+3lM6A14QKZ9O5L8QxW1uk3iL38+sC3MKwfKaZJK' // generated ethereal password
  }
});

//Validation
const validateOrdersInput = require('../../validation/Order/OrderValidation');
const QuickBooksService = require('../../services/QuickBooksService');

// @route GET  api/stores/test
// @desc  Test documents route
// @access public
router.get('/test', (req, res) => res.json({ msg: "Order Works!!" }));

router.post('/quickbook/purchase', async (req, res) => {
  var quickAuthToken;
  var getSetting = await Setting.findOne();
  if (getSetting) {
    quickAuthToken = JSON.parse(getSetting.quickBook);
  }
  oauthClientOrder = new OAuthClient({
    clientId: 'AB2T4UWnpedrpGq33wumOOGMzsG92cTzfytneE8xmJwwS1CtuP',
    clientSecret: 'jMywcYPlGTGA9Fd1Lt1eWbLQXJ5Tx19JbL4VBRC0',
    environment: 'sandbox',
    redirectUri: 'http://ec2-3-239-208-80.compute-1.amazonaws.com:5000/admin/quickbook/callback',
    //redirectUri: 'http://localhost:3000/admin/quickbook/callback',
    token: quickAuthToken,
  });
  if (!oauthClientOrder.isAccessTokenValid()) {
    oauthClientOrder
      .refresh()
      .then(async function (authResponse) {
        oauthClientOrder = new OAuthClient({
          clientId: 'AB2T4UWnpedrpGq33wumOOGMzsG92cTzfytneE8xmJwwS1CtuP',
          clientSecret: 'jMywcYPlGTGA9Fd1Lt1eWbLQXJ5Tx19JbL4VBRC0',
          environment: 'sandbox',
          redirectUri: 'http://ec2-3-239-208-80.compute-1.amazonaws.com:5000/admin/quickbook/callback',
          //redirectUri: 'http://localhost:3000/admin/quickbook/callback',
          token: authResponse.token,
        });
        var updateSetting = await Setting.findOneAndUpdate({ _id: getSetting._id }, { $set: { quickBook: JSON.stringify(authResponse.token) } }, { new: true });


      })
      .catch(function (e) {

      });
  }

  const body = req.body;
  oauthClientOrder
    .makeApiCall({
      url: 'https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365177497720/purchaseorder?minorversion=40',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    .then(function (response) {
      res.json(response)

    })
    .catch(function (e) {
      res.status(400).json(e)
    });

});

router.post('/stripe-checkout', (req, res) => {
  stripe.charges.create(req.body, (stripeErr, stripeRes) => {
    if (stripeErr) {
      res.status(500).send({ error: stripeErr });
    } else {
      res.status(200).send(stripeRes);
    }
  });
});

router.post('/checkpayment', passport.authenticate('jwt', { session: false }), (req, res) => {
  axios({
    method: "GET",
    url: "https://apps.bookeey.com/pgapi/api/payment/paymentstatus",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
    data: {
      "Mid": "mer160009",
      "MerchantTxnRefNo": [req.body.merchantID],
      "HashMac": "3f1d6bfe711e678304b02bc3e08e24cad2afece0856c5550b810c37b948954d9e1122758826df2f04073607f2ed579ac6ac3e8e87b9c8d046e300c6311af8145"
    }
  })
    .then(async result => {
      var resultData = result.data;
      if (resultData.PaymentStatus) {
        var paymentResult = resultData.PaymentStatus[0];

        if (paymentResult.PaymentId && paymentResult.PaymentId != "") {

          var chkpay = await Order.findOne({ paymentID: paymentResult.PaymentId })
          console.log("chk pay", chkpay);
          if (!chkpay) {
            res.json({
              paymentID: paymentResult.PaymentId,
            })
          } else {
            res.status(400).json({
              error: "Payment ID Already Exist"
            })
          }

        }
      }
    })
    .catch(err => {
      res.status(400).json({ error: "Error Occured while Checking Payment Status,Try Again" });
    })
});

///////////////////////////////////////User Routes///////////////////////////////////////////


router.post('/mobile/checkout', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const { errors, isValid } = validateOrdersInput(req.body);
  //Check Validation
  if (!isValid) {
    //if Any errors, send 400 with errors object
    return res.status(400).json(errors);
  }
  //Order Status

  var orderstatus = await OrderStatus.findOne();
  const orderfields = {
    userID: req.user.id,
    name: req.body.name,
    mobile: req.body.mobile,
    email: req.body.email,
    address: req.body.address,
    total: req.body.total,
    product: JSON.stringify(req.body.product),
    status: orderstatus._id,
    paymentType: req.body.paymentType,

  };
  new Order(orderfields).save().then(order => res.json(order));
});

router.get('/getorder', passport.authenticate('jwt', { session: false }), (req, res) => {
  //Order.find({userID: req.user.id})
  Order.aggregate([
    { $match: { userID: mongoose.Types.ObjectId(req.user.id) } },
    {
      $lookup: {
        from: "orderstatuses",
        foreignField: "_id",
        localField: "status",
        as: "status"
      }
    },
    {
      $unwind: "$status"
    },
    {

      $lookup: {
        from: "shippings",
        foreignField: "_id",
        localField: "shippingID",
        as: "shipping"
      }
    },
    {
      $unwind: "$shipping"
    },

    { $sort: { date: -1 } },
  ])
    .then(orders => res.json(orders))
    .catch(err => res.status(404).json({ errors: "No Orders to show" }))
});

router.post('/getordermeta', passport.authenticate('jwt', { session: false }), (req, res) => {
  //Order.find({userID: req.user.id})
  OrderMeta.aggregate([
    { $match: { $and: [{ userID: mongoose.Types.ObjectId(req.user.id) }, { orderID: mongoose.Types.ObjectId(req.body.orderID) }] } },
    {
      $lookup: {
        from: "products",
        foreignField: "_id",
        localField: "productID",
        as: "product"
      }
    },
    {
      $unwind: "$product"
    },

    { $sort: { date: -1 } },
  ])
    .then(orders => res.json(orders))
    .catch(err => res.status(404).json({ errors: "No Orders to show" }))
});

router.post('/getordermetaall', passport.authenticate('jwt', { session: false }), (req, res) => {
  //Order.find({userID: req.user.id})
  OrderMeta.aggregate([
    { $match: { orderID: mongoose.Types.ObjectId(req.body.orderID) } },
    {
      $lookup: {
        from: "products",
        foreignField: "_id",
        localField: "productID",
        as: "product"
      }
    },
    {
      $unwind: "$product"
    },

    { $sort: { date: -1 } },
  ])
    .then(orders => res.json(orders))
    .catch(err => res.status(404).json({ errors: "No Orders to show" }))
});

// router.get('/getorder',passport.authenticate('jwt',{session:false}),(req,res)=>{
//     Order.aggregate([
//         {$match:{ userID:mongoose.Schema.ObjectId(req.user.id)}},
//         {

//             $lookup:{
//                  from:"shippings",
//                  foreignField:"_id",
//                  localField:"shippingID",
//                  as:"shipping"
//             }
//          },
//          {
//             $unwind:"$shipping"
//          },
//          {
//             $lookup:{
//                  from:"orderstatues",
//                  foreignField:"_id",
//                  localField:"status",
//                  as:"status"
//             }
//          },
//          {
//             $unwind:"$status"
//          },
//         { $sort: { date: -1 } },
// ])
//     .then(orders=> res.json(orders))
//     .catch(err=>res.status(404).json({errors:"No Orders to show"}))
// });

// @route GET  api/documents/
// @desc  Get Document
// @access private
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Order.aggregate([
    {
      $lookup: {
        from: "orderstatuses",
        foreignField: "_id",
        localField: "status",
        as: "status"
      }
    },
    {
      $unwind: "$status"
    },
    /*{
 
        $lookup:{
             from:"shippings",
             foreignField:"_id",
             localField:"shippingID",
             as:"shipping"
        }
     },
     {
        $unwind:"$shipping"
     },*/

    { $sort: { date: -1 } },
  ])
    .sort({ date: -1 })
    .then(orders => res.json(orders))
    .catch(err => res.status(404).json({ errors: "No Orders to show" }))
});


router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      var cartItems = req.body.cart;
      if (!cartItems || cartItems.length === 0)
        return res.status(400).json({ errors: `Cart is empty` })
      const productIds = cartItems.map(cartItem => cartItem.id)
      const productsInCart = await Product.find({ _id: { $in: productIds } })
      for (let cartItem of cartItems) {
        const product = productsInCart.find((product) => product.id === cartItem.id)
        if (!product) {
          return res.status(400).json({ errors: `Product not found` })
        }

        if (parseInt(product.stockCount) <= 0) {
          return res.status(400).json({ errors: `Product ${product.name} is out of stock` })
        }
      }

      var OrderNo = 1000
      const orderStatus = await OrderStatus.findOne({ StatusName: 'Pending' })
      const orderNoData = await Order.findOne().sort({ date: -1 })
      if (orderNoData) {
        OrderNo = orderNoData.orderNo + 1
      }
      const orderfields = {
        userID: req.user.id,
        orderNo: OrderNo,
        shippingAddress: JSON.stringify(req.body.shippingAddress),
        billingAddress: JSON.stringify(req.body.billingAddress),
        couponAmount: req.body.couponAmount,
        couponCode: req.body.couponCode,
        finalAmount: req.body.finalAmount,
        orderType: req.body.orderType,
        giftAmount: req.body.giftAmount,
        paymentMethod: req.body.paymentMethod,
        shippingAmount: req.body.shippingAmount,
        shippingID: req.body.shippingID,
        totalAmount: req.body.totalAmount,
        status: orderStatus._id,
        paymentID: req.body.paymentID
      };

      const newOrder = await new Order(orderfields).save()
      const lineData = []
      for (let [index, cartItem] of cartItems.entries()) {
        //await Product.findOneAndUpdate({ _id: cartItem.id }, { $inc: { 'stockCount': -10 } })
        const product = productsInCart.find((product) => product.id === cartItem.id)
        lineData.push({
          "Description": cartItem.description,
          "DetailType": "SalesItemLineDetail",
          "SalesItemLineDetail": {
            "TaxCodeRef": {
              "value": "NON"
            },
            "Qty": parseInt(cartItem.quantity),
            "UnitPrice": cartItem.price,
            "ItemRef": {
              "value": product.quickbooksID
            }
          },
          "LineNum": index + 1,
          "Amount": parseFloat(cartItem.price) * parseFloat(cartItem.quantity),
          "Id": `${index + 1}`
        })
      }
      const ShipAddr = {
        "Line1": req.body.shippingAddress.address,
        "PostalCode": req.body.shippingAddress.zip,
      }
      const BillAddr = {
        "Line1": req.body.billingAddress.address,
        "PostalCode": req.body.billingAddress.zip,
      }
      var saleOrderData = {
        "Line": lineData,
        "BillEmail": {
          "Address": req.user.email,
        },
        "CustomerRef": {
          "value": req.user.quickbooksID
        },
        "CustomerMemo": {
          "value": "Thank you for your business and have a great day!"
        },
        ShipAddr,
        BillAddr
      }
      try {
        const quickbookService = new QuickBooksService()
        await quickbookService.init()
        await quickbookService.createSalesOrder(saleOrderData)
      } catch (e) {
        return res.status(400).json({ errors: "Sorry. Something went wrong while placing the order." })
      }
      return res.status(200).json({ data: newOrder })
    } catch (e) {
      console.log(e)
      return res.status(400).json({ errors: "Sorry. Something went wrong while placing the order." })
    }
  })

///////////////////////////////////vendor Routes///////////////////////////////////////////////////

//all orders
router.get('/all', (req, res) => {


  Order.find()
    .sort({ date: -1 })
    .then(storesall => res.json(storesall))
    .catch(err => res.status(404).json({ errors: "No stores to show" }))

});
router.post('/orderupdate', (req, res) => {

  Order.findOneAndUpdate({ _id: req.body.orderID }, { $set: { status: req.body.status } })
    .then(orderdata => {
      res.json(orderdata)
    })
    .catch(err => console.log(err));

});

module.exports = router;
