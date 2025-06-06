import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function PaymentSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.close();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="flex flex-col items-center justify-center p-10">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-4xl">Payment is successful!</CardTitle>
      </CardHeader>
      <p className="mt-4 text-muted-foreground">This tab will automatically close shortly.</p>
      <Button className="mt-5" onClick={() => navigate("/shop/account")}>
        View Orders
      </Button>
    </Card>
  );
}

export default PaymentSuccessPage;
