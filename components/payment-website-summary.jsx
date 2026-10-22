function money(minor, currency) {
  if (minor === null || minor === undefined) return "Unavailable";
  const digits = ["JPY", "KRW"].includes(currency) ? 0 : 2;
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(minor / 10 ** digits); }
  catch { return `${minor / 10 ** digits} ${currency || "unknown currency"}`; }
}

export default function PaymentWebsiteSummary({ summary = [] }) {
  return <section className="panel form-card" aria-label="Payment totals">
    <h2>Payment totals</h2>
    <p className="muted">All records matching the selected website and status, grouped by currency. The transaction list shows up to 100 records.</p>
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
    <p className="muted">Net collections are shown only when fees and refund outcomes are known. They are not a bank settlement balance. Historical payments without website metadata remain unattributed.</p>
  </section>;
}
