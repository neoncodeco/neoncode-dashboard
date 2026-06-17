/** Flip to true to restore affiliate UI in user and admin dashboards. */
export const AFFILIATE_UI_ENABLED = false;

export const affiliateDashboardRedirects = AFFILIATE_UI_ENABLED
  ? []
  : [
      {
        source: "/user-dashboard/affiliate",
        destination: "/user-dashboard/overview",
        permanent: false,
      },
      {
        source: "/user-dashboard/referrals",
        destination: "/user-dashboard/overview",
        permanent: false,
      },
      {
        source: "/admin-dashboard/affiliates",
        destination: "/admin-dashboard/overview",
        permanent: false,
      },
    ];
