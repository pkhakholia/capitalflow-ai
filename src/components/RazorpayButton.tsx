"use client";

import { useEffect, useRef } from "react";

interface RazorpayButtonProps {
  buttonId: string;
}

export function RazorpayButton({ buttonId }: RazorpayButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";

    const form = document.createElement("form");
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.async = true;
    script.setAttribute("data-payment_button_id", buttonId);

    form.appendChild(script);
    container.appendChild(form);

    return () => {
      container.innerHTML = "";
    };
  }, [buttonId]);

  return (
    <div
      ref={containerRef}
      className="[&_form]:mx-auto [&_form]:w-full [&_iframe]:mx-auto [&_iframe]:max-w-full"
    />
  );
}

