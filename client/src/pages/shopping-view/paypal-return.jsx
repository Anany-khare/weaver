import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { capturePayment } from "@/store/shop/order-slice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { clearCart } from "@/store/shop/cart-slice";

function PaypalReturnPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const paymentId = params.get("paymentId");
  const payerId = params.get("PayerID");
  const navigate = useNavigate();

  useEffect(() => {
    if (paymentId && payerId) {
      const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

      dispatch(capturePayment({ paymentId, payerId, orderId })).then((data) => {
        if (data?.payload?.success) {
          sessionStorage.removeItem("currentOrderId");
          dispatch(clearCart());
          // Send a broadcast message to notify other tabs that the cart is cleared
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('cart_channel');
            bc.postMessage('cart_cleared');
            bc.close(); // Close the channel after sending
          }
          navigate("/shop/payment-success");
        }
      });
    }
  }, [paymentId, payerId, dispatch, navigate]);

  useEffect(() => {
    // Check if the current URL is the PayPal cancel URL
    if (location.pathname === '/shop/paypal-cancel') {
      const timer = setTimeout(() => {
        window.close(); // Close the current tab
      }, 2000); // 2000 milliseconds = 2 seconds

      // Clean up the timer if the component unmounts or the URL changes
      return () => clearTimeout(timer);
    }
  }, [location.pathname]); // No need for navigate dependency here

  // Render different content based on the URL
  if (location.pathname === '/shop/paypal-cancel') {
    return (
      <Card className="flex flex-col items-center justify-center p-10">
        <CardHeader className="p-0 text-center">
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <p className="mt-4 text-muted-foreground">This tab will automatically close in a few seconds.</p>
        <Button onClick={() => window.close()} className="mt-6">Click to Close This Tab</Button>
      </Card>
    );
  }

  // Default rendering for other PayPal return URLs (e.g., success)
  return (
    <Card className="flex flex-col items-center justify-center p-10">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">Processing Payment...Please wait!</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default PaypalReturnPage;
