const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const mongoose = require("mongoose");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId,
      payerId,
      cartId,
    } = req.body;

    // Validate totalAmount before proceeding
    if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "https://weaver-shop.vercel.app/shop/paypal-return",
        cancel_url: "https://weaver-shop.vercel.app/shop/paypal-cancel",
      },
      transactions: [
        {
          item_list: {
            items: cartItems.map((item) => ({
              name: item.title,
              sku: item.productId,
              price: item.price.toFixed(2),
              currency: "USD",
              quantity: item.quantity,
            })),
          },
          amount: {
            currency: "USD",
            total: Number(totalAmount).toFixed(2),
          },
          description: "description",
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          success: false,
          message: error.response ? error.response.message : "Error while creating paypal payment",
          details: error.response || error, // for debugging
        });
      } else {
        const newlyCreatedOrder = new Order({
          userId,
          cartId,
          cartItems,
          addressInfo,
          orderStatus,
          paymentMethod,
          paymentStatus,
          totalAmount,
          orderDate,
          orderUpdateDate,
          paymentId,
          payerId,
        });

        await newlyCreatedOrder.save();

        const approvalURL = paymentInfo.links.find(
          (link) => link.rel === "approval_url"
        ).href;

        res.status(201).json({
          success: true,
          approvalURL,
          orderId: newlyCreatedOrder._id,
        });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    for (let item of order.cartItems) {
      let productId = item.productId;
      // Ensure productId is an ObjectId
      if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
        productId = new mongoose.Types.ObjectId(productId);
      }
      let product = await Product.findById(productId);

      if (!product) {
        console.log('Product not found for ID:', productId);
        continue; // Skip this item if not found
      }

      product.totalStock -= item.quantity;
      if (product.totalStock < 0) product.totalStock = 0;
      await product.save();
    }

    const getCartId = order.cartId;
    if (getCartId) {
      await Cart.findByIdAndDelete(getCartId);
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

// Create a mock order (for WeaverPay)
const createMockOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems = [],
      addressInfo = {},
      orderStatus = "confirmed",
      paymentMethod = "WeaverPay",
      paymentStatus = "paid",
      totalAmount,
      orderDate = new Date(),
      orderUpdateDate = new Date(),
    } = req.body;

    const newOrder = new Order({
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
    });
    await newOrder.save();

    // Reduce product stock for each item (after saving order)
    if (Array.isArray(cartItems)) {
      for (let item of cartItems) {
        let productId = item.productId;
        if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
          productId = new mongoose.Types.ObjectId(productId);
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) continue;
        let product = await Product.findById(productId);
        if (product) {
          product.totalStock -= item.quantity;
          if (product.totalStock < 0) product.totalStock = 0;
          await product.save();
        }
      }
    }

    // Delete user's cart from backend after successful WeaverPay order
    if (userId) {
      await Cart.findOneAndDelete({ userId });
    }

    res.status(201).json({ success: true, data: newOrder });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
  createMockOrder,
};
