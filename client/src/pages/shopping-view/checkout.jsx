import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createNewOrder, capturePayment, addINROrder, getAllOrdersByUserId } from "@/store/shop/order-slice";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { clearCart } from "@/store/shop/cart-slice";
import api from "@/config/api";
import { fetchAllFilteredProducts } from "@/store/shop/products-slice";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const { approvalURL } = useSelector((state) => state.shopOrder);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymemntStart] = useState(false);
  const [isPaypalLoading, setIsPaypalLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const dispatch = useDispatch();
  const { toast } = useToast();

  // console.log(currentSelectedAddress, "cartItems");

  const totalCartAmount =
    cartItems && cartItems.items && cartItems.items.length > 0
      ? cartItems.items.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.salePrice > 0
              ? currentItem?.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;

  // Conversion rate: 1 USD = 83 INR (fixed for demo)
  const INR_TO_USD_RATE = 83;
  // Convert each item's price to USD and sum up for total
  const cartItemsUSD = cartItems && cartItems.items && cartItems.items.length > 0
    ? cartItems.items.map((singleCartItem) => {
        const priceINR = singleCartItem?.salePrice > 0
          ? singleCartItem?.salePrice
          : singleCartItem?.price;
        const priceUSD = Number((priceINR / INR_TO_USD_RATE).toFixed(2));
        return {
          ...singleCartItem,
          priceUSD,
        };
      })
    : [];
  const totalCartAmountUSD = cartItemsUSD.reduce(
    (sum, item) => sum + item.priceUSD * item.quantity,
    0
  ).toFixed(2);

  function handleInitiatePaypalPayment() {
    if (cartItems.length === 0 || totalCartAmount <= 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed",
        variant: "destructive",
      });

      return;
    }
    if (currentSelectedAddress === null) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });

      return;
    }

    setIsPaypalLoading(true);

    const orderData = {
      userId: user?.id,
      cartId: cartItems?._id,
      cartItems: cartItemsUSD.map((item) => ({
        productId: item?.productId,
        title: item?.title,
        image: item?.image,
        price: item.priceUSD,
        quantity: item?.quantity,
      })),
      addressInfo: {
        addressId: currentSelectedAddress?._id,
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        pincode: currentSelectedAddress?.pincode,
        phone: currentSelectedAddress?.phone,
        notes: currentSelectedAddress?.notes,
      },
      orderStatus: "pending",
      paymentMethod: "paypal",
      paymentStatus: "pending",
      totalAmount: totalCartAmountUSD, // Pass USD value for PayPal
      orderDate: new Date(),
      orderUpdateDate: new Date(),
      paymentId: "",
      payerId: "",
    };

    dispatch(createNewOrder(orderData)).then((data) => {
      // console.log(data, "sangam");
      if (data?.payload?.success) {
        setIsPaymemntStart(true);
        // Refresh product list after successful PayPal order
        dispatch(fetchAllFilteredProducts({ filterParams: {}, sortParams: "price-lowtohigh" }));
        // Delete cart from backend
        if (user?.id) {
          api.delete(`/api/shop/cart/user/${user.id}`);
        }
      } else {
        setIsPaymemntStart(false);
        toast({ title: "Failed to initiate Paypal payment", variant: "destructive" });
      }
      setIsPaypalLoading(false);
    });
  }

  useEffect(() => {
    if (approvalURL) {
      // Open PayPal in a new window
      const paypalWindow = window.open(approvalURL, 'PayPal Payment', 'width=800,height=600');
      
      // Check if the window was opened successfully
      if (paypalWindow) {
        // Listen for messages from the PayPal window
        const messageHandler = (event) => {
          if (event.data === 'payment_success') {
            setPaymentStatus('success');
            window.removeEventListener('message', messageHandler);
          } else if (event.data === 'payment_cancelled') {
            setPaymentStatus('cancelled');
            window.removeEventListener('message', messageHandler);
          }
        };

        window.addEventListener('message', messageHandler);

        // Clean up event listener if component unmounts
        return () => {
          window.removeEventListener('message', messageHandler);
        };
      } else {
        toast({
          title: "Please allow popups for this website to proceed with payment",
          variant: "destructive",
        });
        setIsPaypalLoading(false);
      }
    }
    // Listen for INR payment success or cancel
    const inrPaymentHandler = async (event) => {
      if (event.data && (event.data.type === "inr_payment_success" || event.data.type === "inr_payment_cancelled")) {
        // Use the selected address from state for WeaverPay
        const addressInfo = currentSelectedAddress ? {
          addressId: currentSelectedAddress?._id,
          address: currentSelectedAddress?.address,
          city: currentSelectedAddress?.city,
          pincode: currentSelectedAddress?.pincode,
          phone: currentSelectedAddress?.phone,
          notes: currentSelectedAddress?.notes,
        } : {};
        // Ensure cartItems structure matches PayPal
        const cartItemsPayload = cartItems?.items?.map(item => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          price: item.salePrice > 0 ? item.salePrice : item.price,
          quantity: item.quantity,
        })) || [];
        const orderStatus = event.data.status === "success" ? "confirmed" : "cancelled";
        const paymentStatus = event.data.status;
        const orderPayload = {
          userId: user?.id,
          cartItems: cartItemsPayload,
          addressInfo,
          orderStatus,
          paymentMethod: "WeaverPay",
          paymentStatus,
          totalAmount: event.data.amount,
          orderDate: new Date(),
          orderUpdateDate: new Date(),
        };
        try {
          await api.post("/api/shop/order/create-mock", orderPayload);
          dispatch(getAllOrdersByUserId(user?.id));
          // Refresh product list after successful WeaverPay order
          dispatch(fetchAllFilteredProducts({ filterParams: {}, sortParams: "price-lowtohigh" }));
          // Delete cart from backend
          if (user?.id) {
            api.delete(`/api/shop/cart/user/${user.id}`);
          }
        } catch (e) {
          toast({ title: "Failed to save INR order to backend", variant: "destructive" });
        }
        dispatch(addINROrder({
          orderId: event.data.orderId,
          status: event.data.status,
          amount: event.data.amount,
          date: new Date().toISOString(),
          address: addressInfo,
        }));
        if (event.data.type === "inr_payment_success") {
          dispatch(clearCart());
          toast({
            title: `INR Payment Successful! Order ID: ${event.data.orderId}`,
            variant: "success",
          });
        } else if (event.data.type === "inr_payment_cancelled") {
          toast({
            title: `INR Payment Cancelled. Order ID: ${event.data.orderId}`,
            variant: "destructive",
          });
        }
        // Optionally, redirect or update UI here
      }
    };
    window.addEventListener("message", inrPaymentHandler);
    return () => {
      window.removeEventListener("message", inrPaymentHandler);
    };
  }, [approvalURL, toast, dispatch]);

  function handleWeaverPay() {
    if (totalCartAmount <= 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed.",
        variant: "destructive",
      });
      return;
    }
    if (!currentSelectedAddress) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });
      return;
    }
    const addressParam = encodeURIComponent(JSON.stringify(currentSelectedAddress));
    window.open(`/shop/inr-payment?amount=${totalCartAmount}&address=${addressParam}`, '_blank', 'width=500,height=700');
  }

  if (paymentStatus === 'success') {
    return (
      <Card className="flex flex-col items-center justify-center p-10">
        <CardHeader className="p-0 text-center">
          <CardTitle className="text-4xl">Payment is successful!</CardTitle>
        </CardHeader>
        <p className="mt-4 text-muted-foreground">Thank you for your purchase.</p>
        <Button className="mt-5" onClick={() => window.location.href = "/shop/account"}>
          View Orders
        </Button>
      </Card>
    );
  }

  if (paymentStatus === 'cancelled') {
    return (
      <Card className="flex flex-col items-center justify-center p-10">
        <CardHeader className="p-0 text-center">
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <p className="mt-4 text-muted-foreground">Your payment was cancelled.</p>
        <Button className="mt-5" onClick={() => setPaymentStatus(null)}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.items && cartItems.items.length > 0
            ? cartItems.items.map((item) => (
                <UserCartItemsContent cartItem={item} />
              ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">₹{totalCartAmount} (≈ ${totalCartAmountUSD} USD)</span>
            </div>
          </div>
          <div className="mt-4 w-full">
            <Button
              onClick={handleInitiatePaypalPayment}
              className="w-full"
              disabled={isPaypalLoading || totalCartAmount <= 0}
            >
              {isPaypalLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Checkout with Paypal"
              )}
            </Button>
            <div className="mt-2 text-sm text-muted-foreground text-center">
              <div><b>Note:</b> Use PayPal for international transactions only.</div>
              <div>Sample Email: <b>Weaver@example.com</b></div>
              <div>Sample Password: <b>12345678</b></div>
            </div>
            <Button
              className="w-full mt-6 text-lg font-bold"
              onClick={handleWeaverPay}
              disabled={totalCartAmount <= 0}
            >
              Pay Instantly with WeaverPay (INR)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
