export const sendZavuOtp = async ({ to, code }) => {
  try {
    const res = await fetch("https://api.zavu.dev/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ZAVU_API_KEY}`,
      },
      body: JSON.stringify({
        to: `+${to}`,
        text: `Your NeonCode OTP is ${code}`,
      }),
    });

    const data = await res.json();

    console.log("ZAVU RESPONSE:", data); 

    if (!res.ok) {
      return {
        ok: false,
        error: data?.message || data?.error || "Zavu failed",
      };
    }

    return { ok: true };
  } catch (err) {
    console.error("ZAVU ERROR:", err);
    return {
      ok: false,
      error: "Network error",
    };
  }
};