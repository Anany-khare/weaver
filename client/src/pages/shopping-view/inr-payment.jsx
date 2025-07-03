import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

function INRPayment() {
  const [paid, setPaid] = useState(false);
  const [form, setForm] = useState({
    name: "",
    card: "",
    upi: "",
  });
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");

  // Get INR amount from query string
  function useQuery() {
    return new URLSearchParams(window.location.search);
  }
  const query = useQuery();
  const inrAmount = query.get("amount") || "(see main window)";

  // Parse address from query string
  let addressObj = null;
  try {
    const addressParam = query.get("address");
    if (addressParam) {
      addressObj = JSON.parse(decodeURIComponent(addressParam));
    }
  } catch (e) { addressObj = null; }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePay(e) {
    e.preventDefault();
    // Validation
    if (form.card && !/^\d{12}$/.test(form.card)) {
      setError("Card number must be exactly 12 digits.");
      return;
    }
    if (form.upi && !form.upi.includes("@")) {
      setError("UPI ID must contain '@' symbol.");
      return;
    }
    setError("");
    const newOrderId = `INR${Date.now()}${Math.floor(Math.random()*1000)}`;
    setOrderId(newOrderId);
    setPaid(true);
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage({ type: "inr_payment_success", orderId: newOrderId, status: "success", amount: inrAmount }, "*");
      }
      window.close();
    }, 1500);
  }

  function handleCancel() {
    const newOrderId = `INR${Date.now()}${Math.floor(Math.random()*1000)}`;
    if (window.opener) {
      window.opener.postMessage({ type: "inr_payment_cancelled", orderId: newOrderId, status: "cancelled", amount: inrAmount }, "*");
    }
    window.close();
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-lg text-green-600 mb-2">Thank you for your payment in INR.</p>
        <p className="text-md font-mono mb-6">Order ID: <b>{orderId}</b></p>
        <Button onClick={() => window.close()} className="mt-2">Return to Payment</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">WeaverPay - INR Payment</h1>
        {addressObj && (
          <div className="mb-6 p-4 rounded bg-gray-100 border">
            <div className="font-bold mb-1">Deliver to:</div>
            <div>{addressObj.address}</div>
            <div>{addressObj.city} - {addressObj.pincode}</div>
            <div>{addressObj.phone}</div>
            {addressObj.notes && <div className="text-sm text-muted-foreground">Notes: {addressObj.notes}</div>}
          </div>
        )}
        <form onSubmit={handlePay} className="space-y-4">
          {error && <div className="text-red-600 font-semibold text-center mb-2">{error}</div>}
          <div>
            <label className="block font-semibold mb-1">Name on Card/UPI</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Card Number</label>
            <input
              type="text"
              name="card"
              value={form.card}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="1234 5678 9012 3456"
              maxLength={12}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">or UPI ID</label>
            <input
              type="text"
              name="upi"
              value={form.upi}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="yourname@upi"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="w-full">Pay ₹{inrAmount}</Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleCancel}>Cancel Payment</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default INRPayment; 