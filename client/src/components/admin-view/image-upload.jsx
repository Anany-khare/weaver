import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import axios from "axios";
import { Skeleton } from "../ui/skeleton";

function ProductImageUpload({
  imageFile,
  setImageFile,
  imageLoadingState,
  uploadedImageUrl,
  setUploadedImageUrl,
  setImageLoadingState,
  isEditMode,
  isCustomStyling = false,
}) {
  const inputRef = useRef(null);

  function handleImageFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) setImageFile(selectedFile);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) setImageFile(droppedFile);
  }

  function handleRemoveImage() {
    setImageFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function uploadImageToCloudinary() {
    setImageLoadingState(true);
    const data = new FormData();
    data.append("my_file", imageFile);
    const response = await axios.post(
      "http://localhost:5000/api/admin/products/upload-image",
      data
    );

    if (response?.data?.success) {
      setUploadedImageUrl(response.data.result.url);
      setImageLoadingState(false);
    }
  }

  useEffect(() => {
    if (imageFile !== null) uploadImageToCloudinary();
  }, [imageFile]);

  return (
    <div
      className={`${
        isCustomStyling
          ? "w-full"
          : "w-full max-w-sm mx-auto border-2 border-dashed rounded-lg p-4"
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        {imageLoadingState ? (
          <Skeleton className="w-full h-[200px]" />
        ) : imageFile ? (
          <div className="relative w-full">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className="w-full h-[200px] object-cover rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <UploadCloudIcon className="h-10 w-10 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Drag and drop your image here, or click to select
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              ref={inputRef}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Select Image
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductImageUpload;
