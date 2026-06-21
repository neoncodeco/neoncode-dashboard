import Swal from "sweetalert2";

export function showAccountUnderReviewAlert() {
  return Swal.fire({
    width: 520,
    padding: 0,
    background: "transparent",
    showConfirmButton: true,
    confirmButtonText: "Close",
    showCloseButton: false,
    allowOutsideClick: true,
    allowEscapeKey: true,
    buttonsStyling: false,
    customClass: {
      popup: "neon-under-review-swal",
      confirmButton: "neon-under-review-swal-btn",
      htmlContainer: "neon-under-review-swal-html",
    },
    html: `
      <div class="neon-under-review-card">
        <div class="neon-under-review-glow" aria-hidden="true"></div>
        <div class="neon-under-review-inner">
          <div class="neon-under-review-top">
            <span class="neon-under-review-badge">Under Review</span>
          </div>
          <div class="neon-under-review-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 8v4l3 2" stroke="#d8ff30" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" stroke="#d8ff30" stroke-width="1.8"/>
            </svg>
          </div>
          <h3 class="neon-under-review-title">Your Account Is Under Review</h3>
          <p class="neon-under-review-lead">
            Thanks for joining Neon Code. Our team is currently reviewing your registration before workspace access is enabled.
          </p>
          <div class="neon-under-review-panel">
            <p class="neon-under-review-panel-title">What happens next</p>
            <ul class="neon-under-review-list">
              <li>You will receive an email once your account is approved.</li>
              <li>Approval usually takes a short time after email verification.</li>
              <li>You can close this window and try again later after approval.</li>
            </ul>
          </div>
          <p class="neon-under-review-foot">
            Need help? Contact support if you believe this is taking longer than expected.
          </p>
        </div>
      </div>
    `,
  });
}
