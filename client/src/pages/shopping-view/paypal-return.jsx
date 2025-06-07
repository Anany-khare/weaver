import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { capturePayment } from "@/store/shop/order-slice";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { clearCart } from "@/store/shop/cart-slice";

function PaypalReturnPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const paymentId = params.get("paymentId");
  const token = params.get("token");
  const payerId = params.get("PayerID");
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle PayPal cancel case
    if (location.pathname === '/shop/paypal-cancel') {
      if (window.opener) {
        window.opener.postMessage('payment_cancelled', '*');
        window.close();
      } else {
        window.location.href = '/shop/checkout';
      }
      return;
    }

    // Handle PayPal return case
    if (paymentId && payerId) {
      const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));
      if (!orderId) {
        setError("Order information not found. Please try again.");
        return;
      }

      dispatch(capturePayment({ paymentId, payerId, orderId }))
        .then((data) => {
          if (data?.payload?.success) {
            sessionStorage.removeItem("currentOrderId");
            dispatch(clearCart());
            
            if ('BroadcastChannel' in window) {
              const bc = new BroadcastChannel('cart_channel');
              bc.postMessage('cart_cleared');
              bc.close();
            }

            if (window.opener) {
              window.opener.postMessage('payment_success', '*');
              window.close();
            } else {
              window.location.href = '/shop/payment-success';
            }
          } else {
            setError("Payment processing failed. Please try again.");
          }
        })
        .catch((err) => {
          setError("An error occurred while processing your payment. Please try again.");
          console.error("Payment error:", err);
        });
    } else if (token) {
      // If we only have a token, it might be a cancel case
      if (window.opener) {
        window.opener.postMessage('payment_cancelled', '*');
        window.close();
      } else {
        window.location.href = '/shop/checkout';
      }
    } else {
      setError("Invalid payment information. Please try again.");
    }
  }, [paymentId, payerId, token, location.pathname, dispatch]);

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center p-10">
        <CardHeader className="p-0 text-center">
          <CardTitle className="text-2xl text-red-600">Error</CardTitle>
        </CardHeader>
        <p className="mt-4 text-muted-foreground">{error}</p>
        <Button 
          onClick={() => window.location.href = '/shop/checkout'} 
          className="mt-6"
        >
          Return to Checkout
        </Button>
      </Card>
    );
  }

  if (location.pathname === '/shop/paypal-cancel') {
    return (
      <Card className="flex flex-col items-center justify-center p-10">
        <CardHeader className="p-0 text-center">
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <p className="mt-4 text-muted-foreground">This window will close automatically.</p>
        <Button onClick={() => window.close()} className="mt-6">Close Window</Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center p-10">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">Processing Payment...Please wait!</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default PaypalReturnPage;
