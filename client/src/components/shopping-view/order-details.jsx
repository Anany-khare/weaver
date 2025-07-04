import { useSelector } from "react-redux";
import { Badge } from "../ui/badge";
import { DialogContent } from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

function ShoppingOrderDetailsView({ orderDetails }) {
  const { user } = useSelector((state) => state.auth);

  return (
    <DialogContent className="sm:max-w-[600px] bg-background">
      <div className="grid gap-6">
        <div className="grid gap-2">
          <div className="flex mt-6 items-center justify-between">
            <p className="font-medium">Payment Status</p>
            <Label>{orderDetails?.paymentStatus}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Payment Method</p>
            <Label>{orderDetails?.paymentMethod}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Status</p>
            <Label>
              <Badge
                className={`py-1 px-3 ${
                  orderDetails?.orderStatus === "confirmed"
                    ? "bg-green-500"
                    : orderDetails?.orderStatus === "rejected"
                    ? "bg-red-600"
                    : orderDetails?.orderStatus === "pending"
                    ? "bg-red-600"
                    : "bg-black"
                }`}
              >
                {orderDetails?.orderStatus}
              </Badge>
            </Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order ID</p>
            <Label>{orderDetails?._id}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Date</p>
            <Label>{orderDetails?.orderDate.split("T")[0]}</Label>
          </div>
          <div className="flex mt-2 items-center justify-between">
            <p className="font-medium">Order Price</p>
            <Label>
              {orderDetails?.paymentMethod === 'WeaverPay'
                ? `₹${orderDetails?.totalAmount}`
                : `$${orderDetails?.totalAmount}`}
            </Label>
          </div>
        </div>
        <Separator />
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Order Details</div>
            <ul className="grid gap-3">
              {orderDetails?.cartItems && orderDetails?.cartItems.length > 0
                ? orderDetails?.cartItems.map((item) => (
                    <li className="flex items-center justify-between">
                      <span>Title: {item.title}</span>
                      <span>Quantity: {item.quantity}</span>
                      <span>
                        Price: {orderDetails?.paymentMethod === 'WeaverPay'
                          ? `₹${item.price}`
                          : `$${item.price}`}
                      </span>
                    </li>
                  ))
                : null}
            </ul>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="font-medium">Shipping Info</div>
            <div className="grid gap-0.5 text-muted-foreground">
              <span>{user.userName}</span>
              {orderDetails?.addressInfo && (
                orderDetails.addressInfo.address ||
                orderDetails.addressInfo.city ||
                orderDetails.addressInfo.pincode ||
                orderDetails.addressInfo.phone ||
                orderDetails.addressInfo.notes
              ) ? (
                <>
                  {orderDetails.addressInfo.address && <span>{orderDetails.addressInfo.address}</span>}
                  {orderDetails.addressInfo.city && <span>{orderDetails.addressInfo.city}</span>}
                  {orderDetails.addressInfo.pincode && <span>{orderDetails.addressInfo.pincode}</span>}
                  {orderDetails.addressInfo.phone && <span>{orderDetails.addressInfo.phone}</span>}
                  {orderDetails.addressInfo.notes && <span>{orderDetails.addressInfo.notes}</span>}
                </>
              ) : (
                <span>No address info available.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export default ShoppingOrderDetailsView;
