import { OrdersClient } from "@/components/orders-client";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata = createNoIndexMetadata("Orders");

export default function OrdersPage() {
  return (
    <main className="section">
      <div className="container stack">
        <div>
          <div className="eyebrow">Account orders</div>
          <h1 className="page-title">Payment history</h1>
          <p className="page-subtitle">
            Review prompt purchases, memberships, payment dates, amounts, and status.
          </p>
        </div>
        <OrdersClient />
      </div>
    </main>
  );
}
