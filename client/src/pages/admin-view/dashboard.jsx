import ProductImageUpload from "@/components/admin-view/image-upload";
import { Button } from "@/components/ui/button";
import { addFeatureImage, getFeatureImages } from "@/store/common-slice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function AdminDashboard() {
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const dispatch = useDispatch();
  const { featureImageList } = useSelector((state) => state.commonFeature);

  function handleUploadFeatureImage() {
    dispatch(addFeatureImage(uploadedImageUrl)).then((data) => {
      if (data?.payload?.success) {
        dispatch(getFeatureImages());
        setImageFile(null);
        setUploadedImageUrl("");
      }
    });
  }

  useEffect(() => {
    dispatch(getFeatureImages());
  }, [dispatch]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="font-medium">Upload Feature Image</div>
          <ProductImageUpload
            imageFile={imageFile}
            setImageFile={setImageFile}
            imageLoadingState={imageLoadingState}
            uploadedImageUrl={uploadedImageUrl}
            setUploadedImageUrl={setUploadedImageUrl}
            setImageLoadingState={setImageLoadingState}
          />
          <Button
            onClick={handleUploadFeatureImage}
            disabled={!uploadedImageUrl || imageLoadingState}
          >
            Upload Image
          </Button>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="font-medium">Feature Images</div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featureImageList && featureImageList.length > 0
              ? featureImageList.map((imageItem) => (
                  <div key={imageItem._id} className="relative">
                    <img
                      src={imageItem.image}
                      alt={imageItem._id}
                      className="w-full h-[200px] object-cover rounded-lg"
                    />
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
