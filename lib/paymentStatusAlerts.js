import Swal from "sweetalert2";
import { formatBdt } from "@/lib/currency";

function paymentAlertBase(customClass) {
  return {
    width: 520,
    padding: 0,
    background: "transparent",
    showConfirmButton: true,
    confirmButtonText: "Close",
    showCloseButton: false,
    allowOutsideClick: true,
    allowEscapeKey: true,
    buttonsStyling: false,
    customClass,
  };
}

export function showUddoktaPaySuccessAlert({ amountBdt, trxId } = {}) {
  const amountLabel =
    amountBdt != null && !Number.isNaN(Number(amountBdt)) && Number(amountBdt) > 0
      ? formatBdt(amountBdt)
      : null;
  const reference = trxId ? String(trxId).trim() : "";

  return Swal.fire({
    ...paymentAlertBase({
      popup: "dashboard-payment-swal dashboard-payment-swal-success",
      confirmButton: "dashboard-payment-swal-btn",
      htmlContainer: "dashboard-payment-swal-html",
    }),
    html: `
      <div class="dashboard-payment-card">
        <div class="dashboard-payment-glow dashboard-payment-glow-success" aria-hidden="true"></div>
        <div class="dashboard-payment-inner">
          <div class="dashboard-payment-top">
            <span class="dashboard-payment-badge dashboard-payment-badge-success">Payment Successful</span>
          </div>
          <div class="dashboard-payment-icon-wrap dashboard-payment-icon-wrap-success">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="dashboard-payment-title">UddoktaPay Payment Completed</h3>
          <p class="dashboard-payment-lead">
            Your payment was verified successfully and your wallet balance has been updated.
          </p>
          ${
            amountLabel
              ? `<div class="dashboard-payment-amount-box">
                  <p class="dashboard-payment-amount-label">Amount added</p>
                  <p class="dashboard-payment-amount-value">${amountLabel}</p>
                </div>`
              : ""
          }
          <div class="dashboard-payment-panel">
            <p class="dashboard-payment-panel-title">What we did</p>
            <ul class="dashboard-payment-list">
              <li>Payment confirmed through the UddoktaPay gateway.</li>
              <li>Your top-up balance was credited automatically.</li>
              <li>You can review this transaction in your payment history.</li>
            </ul>
          </div>
          ${
            reference
              ? `<p class="dashboard-payment-foot">Reference: <span class="dashboard-payment-ref">${reference}</span></p>`
              : `<p class="dashboard-payment-foot">Thank you for topping up your Neon Code wallet.</p>`
          }
        </div>
      </div>
    `,
  });
}

export function showUddoktaPayFailedAlert() {
  return Swal.fire({
    ...paymentAlertBase({
      popup: "dashboard-payment-swal dashboard-payment-swal-failed",
      confirmButton: "dashboard-payment-swal-btn dashboard-payment-swal-btn-muted",
      htmlContainer: "dashboard-payment-swal-html",
    }),
    html: `
      <div class="dashboard-payment-card">
        <div class="dashboard-payment-glow dashboard-payment-glow-failed" aria-hidden="true"></div>
        <div class="dashboard-payment-inner">
          <div class="dashboard-payment-top">
            <span class="dashboard-payment-badge dashboard-payment-badge-failed">Payment Failed</span>
          </div>
          <div class="dashboard-payment-icon-wrap dashboard-payment-icon-wrap-failed">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <h3 class="dashboard-payment-title">UddoktaPay Payment Not Completed</h3>
          <p class="dashboard-payment-lead">
            We could not verify this payment. No balance was added to your wallet.
          </p>
          <div class="dashboard-payment-panel">
            <p class="dashboard-payment-panel-title">You can try again</p>
            <ul class="dashboard-payment-list">
              <li>Check whether the payment was cancelled or interrupted.</li>
              <li>Confirm the transaction on your payment app if needed.</li>
              <li>Return to billing and start a new UddoktaPay top-up.</li>
            </ul>
          </div>
          <p class="dashboard-payment-foot">Contact support if money was deducted but balance did not update.</p>
        </div>
      </div>
    `,
  });
}
