import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createNewOrder, capturePayment } from "@/store/shop/order-slice";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { clearCart } from "@/store/shop/cart-slice";

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

  function handleCreateOrder() {
    if (!currentSelectedAddress) {
      toast({
        title: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    setIsPaymemntStart(true);
    dispatch(
      createNewOrder({
        userId: user?.id,
        cartItems: cartItems?.items,
        addressInfo: currentSelectedAddress,
      })
    ).then((data) => {
      if (data?.payload?.success) {
        window.location.href = data?.payload?.approvalURL;
      }
    });
  }

  function handleCapturePayment() {
    setIsPaypalLoading(true);
    dispatch(capturePayment()).then((data) => {
      if (data?.payload?.success) {
        setPaymentStatus("success");
        dispatch(clearCart());
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('cart_channel');
          bc.postMessage('cart_cleared');
          bc.close();
        }
      } else {
        setPaymentStatus("failed");
      }
      setIsPaypalLoading(false);
    });
  }

  useEffect(() => {
    if (approvalURL) {
      window.location.href = approvalURL;
    }
  }, [approvalURL]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <Address
              currentSelectedAddress={currentSelectedAddress}
              setCurrentSelectedAddress={setCurrentSelectedAddress}
            />
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <UserCartItemsContent />
            <div className="p-4">
              <Button
                className="w-full"
                onClick={handleCreateOrder}
                disabled={isPaymentStart}
              >
                {isPaymentStart ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
