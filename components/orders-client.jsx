"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ReceiptText } from "lucide-react";
import { useUserAuth } from "@/components/user-auth-provider";
import { fetchMyPaymentOrders } from "@/lib/payments";

function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    currency: currency || "INR",
    maximumFractionDigits: Number(amount || 0) % 1 === 0 ? 0 : 2,
    style: "currency"
  }).format(Number(amount || 0));
}

function formatDateTime(value) {
  if (!value) {
    return "Not paid";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatOrderType(order) {
  if (order.type === "subscription") {
    return "Membership";
  }

  if (order.type === "credit_plan") {
    return "Credits";
  }

  return "Prompt unlock";
}

function getOrderTitle(order) {
  return (
    order.prompt?.title ||
    order.plan?.name ||
    order.creditPlan?.name ||
    order.productNameSnapshot ||
    formatOrderType(order)
  );
}

function getVisibleOrders(orders) {
  return orders.filter((order) => ["paid", "failed"].includes(order.status));
}

function formatDisplayStatus(status) {
  return status === "paid" ? "success" : "failed";
}

export function OrdersClient() {
  const auth = useUserAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.ready && !auth.isAuthenticated) {
      router.replace("/login?redirect=/orders");
    }
  }, [auth.isAuthenticated, auth.ready, router]);

  useEffect(() => {
    if (!auth.ready || !auth.token) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    fetchMyPaymentOrders(auth.token)
      .then((nextOrders) => {
        if (active) {
          setOrders(nextOrders);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || "Unable to load orders.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [auth.ready, auth.token]);

  const paidCount = useMemo(
    () => getVisibleOrders(orders).filter((order) => order.status === "paid").length,
    [orders]
  );
  const visibleOrders = useMemo(() => getVisibleOrders(orders), [orders]);

  if (!auth.ready || loading) {
    return <div className="account-panel">Loading orders...</div>;
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (!visibleOrders.length) {
    return (
      <div className="account-empty-state">
        <ReceiptText aria-hidden="true" size={30} />
        <h2>No orders yet</h2>
        <p>Your prompt purchases and memberships will appear here.</p>
        <Link className="button" href="/prompts">
          Browse prompts
        </Link>
      </div>
    );
  }

  return (
    <section className="orders-panel" aria-label="Payment orders">
      <div className="orders-summary-row">
        <div>
          <span>{visibleOrders.length}</span>
          <small>Total orders</small>
        </div>
        <div>
          <span>{paidCount}</span>
          <small>Paid</small>
        </div>
      </div>
      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Type</th>
              <th>Payment date</th>
              <th>Amount paid</th>
              <th>Medium</th>
              <th>Status</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{getOrderTitle(order)}</strong>
                  <small>{order.providerPaymentId || order.providerOrderId || order.id}</small>
                </td>
                <td>{formatOrderType(order)}</td>
                <td>{formatDateTime(order.paidAt || order.createdAt)}</td>
                <td>{formatCurrency(order.amount, order.currency)}</td>
                <td>{order.provider === "razorpay" ? "Razorpay" : order.provider || "Payment"}</td>
                <td>
                  <span className={`order-status order-status-${formatDisplayStatus(order.status)}`}>
                    {formatDisplayStatus(order.status)}
                  </span>
                </td>
                <td>
                  {order.prompt?.slug ? (
                    <Link className="orders-open-link" href={`/prompts/${order.prompt.slug}`}>
                      View
                      <ArrowRight aria-hidden="true" size={14} />
                    </Link>
                  ) : (
                    <span className="orders-muted">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
