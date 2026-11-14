import { formatMinorCurrency as money } from "@/lib/display-format";

export default function PaymentWebsiteSummary({ summary = [] }) {
  return <section className="panel form-card" aria-label="Payment totals">
    <h2>Payment totals</h2>
    <p className="muted">SeyPrompt payments matching the selected status, grouped by currency. The transaction list shows up to 100 records.</p>
    {summary.length ? <div className="table-wrap"><table className="table">
      <thead><tr><th>Currency</th><th>Transactions</th><th>Successful payments</th><th>Gross payments</th><th>Processed refunds</th><th>Razorpay fees</th><th>Net collections</th></tr></thead>
      <tbody>{summary.map((row) => <tr key={row.currency || "unknown"}>
        <th scope="row">{row.currency || "Unknown"}</th>
        <td>{row.transactionCount}</td><td>{row.successfulPaymentCount}</td>
        <td>{money(row.grossPaymentsMinor, row.currency)}</td>
        <td>{money(row.refundsMinor, row.currency)}<div className="muted">{row.refundCount} refunds</div>
          {row.pendingRefundCount ? <div className="muted">{row.pendingRefundCount} pending</div> : null}
          {row.unknownRefundCount ? <div className="muted">{row.unknownRefundCount} unconfirmed</div> : null}</td>
        <td>{money(row.knownFeesMinor, row.currency)}{row.unknownFeeCount ? <div className="muted">Known fees only; {row.unknownFeeCount} unavailable</div> : null}</td>
        <td>{money(row.netCollectionsMinor, row.currency)}</td>
      </tr>)}</tbody>
    </table></div> : <p className="muted">No payment totals available for these filters.</p>}
    <p className="muted">Net collections are shown only when fees and refund outcomes are known. Historical orders with a matching SeyPrompt checkout receipt are included.</p>
  </section>;
}
