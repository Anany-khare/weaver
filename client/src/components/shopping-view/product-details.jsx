import { StarIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "../ui/use-toast";
import { setProductDetails } from "@/store/shop/products-slice";
import { Label } from "../ui/label";
import StarRatingComponent from "../common/star-rating";
import { useEffect, useState } from "react";
import { addReview, getReviews } from "@/store/shop/review-slice";

function ProductDetailsDialog({ open, setOpen, productDetails }) {
  const [reviewMsg, setReviewMsg] = useState("");
  const [rating, setRating] = useState(0);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { reviews } = useSelector((state) => state.shopReview);

  const { toast } = useToast();

  function handleRatingChange(getRating) {
    setRating(getRating);
  }

  function handleAddToCart(getCurrentProductId, getTotalStock) {
    let getCartItems = cartItems.items || [];

    if (getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(
        (item) => item.productId === getCurrentProductId
      );
      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added for this item`,
            variant: "destructive",
          });

          return;
        }
      }
    }
    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
      })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({
          title: "Product is added to cart",
        });
      }
    });
  }

  function handleDialogClose() {
    setOpen(false);
    dispatch(setProductDetails());
    setRating(0);
    setReviewMsg("");
  }

  function handleAddReview() {
    dispatch(
      addReview({
        productId: productDetails?._id,
        userId: user?.id,
        userName: user?.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      })
    ).then((data) => {
      if (data.payload.success) {
        setRating(0);
        setReviewMsg("");
        dispatch(getReviews(productDetails?._id));
        toast({
          title: "Review added successfully!",
        });
      }
    });
  }

  useEffect(() => {
    if (productDetails !== null) dispatch(getReviews(productDetails?._id));
  }, [productDetails]);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{productDetails?.title}</h2>
              <div className="flex items-center gap-1">
                <StarIcon className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">
                  {productDetails?.averageReview}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {productDetails?.salePrice > 0 ? (
                  <>
                    <span className="text-2xl font-bold">
                      ${productDetails?.salePrice}
                    </span>
                    <span className="text-lg line-through text-muted-foreground">
                      ${productDetails?.price}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold">
                    ${productDetails?.price}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {productDetails?.totalStock} in stock
                </span>
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="font-medium">Description</div>
              <p className="text-sm text-muted-foreground">
                {productDetails?.description}
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="font-medium">Reviews</div>
              <div className="grid gap-4">
                {reviews && reviews.length > 0
                  ? reviews.map((reviewItem) => (
                      <div key={reviewItem._id} className="flex gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {reviewItem.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {reviewItem.userName}
                            </p>
                            <div className="flex items-center gap-1">
                              <StarIcon className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">
                                {reviewItem.reviewValue}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {reviewItem.reviewMessage}
                          </p>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="font-medium">Add Review</div>
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <Label>Rating</Label>
                  <StarRatingComponent
                    rating={rating}
                    handleRatingChange={handleRatingChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Review</Label>
                  <Input
                    placeholder="Write your review"
                    value={reviewMsg}
                    onChange={(e) => setReviewMsg(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddReview}>Add Review</Button>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="font-medium">Add to Cart</div>
              <Button
                onClick={() =>
                  handleAddToCart(productDetails?._id, productDetails?.totalStock)
                }
                disabled={productDetails?.totalStock === 0}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDetailsDialog;
