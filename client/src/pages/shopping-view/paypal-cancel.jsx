import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

function PaypalCancelPage() {
  useEffect(() => {
    // Close window after 3 seconds
    const timer = setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage('payment_cancelled', '*');
        window.close();
      } else {
        window.location.href = '/';
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className="flex flex-col items-center justify-center p-10">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
      </CardHeader>
      <p className="mt-4 text-muted-foreground">
        This window will close automatically in a few seconds...
      </p>
    </Card>
  );
}

export default PaypalCancelPage; 