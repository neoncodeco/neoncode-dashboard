import Zavudev from "@zavudev/sdk";

const zavu = new Zavudev({
  apiKey: process.env.ZAVUDEV_API_KEY,
});

export const sendZavuTemplateOtp = async ({ to, code }) => {
  try {
    // 🔴 ENV check
    if (!process.env.ZAVU_TEMPLATE_ID) {
      return {
        ok: false,
        error: "Template ID missing in env",
      };
    }

    const res = await zavu.messages.send({
      to: `+${to}`,
      messageType: "template",
      content: {
        templateId: process.env.ZAVU_TEMPLATE_ID,
        templateVariables: {
          "1": code,
        },
      },
    });

    console.log("TEMPLATE RESPONSE:", res);

    // 🔥 IMPORTANT: response validation
    if (!res || res.error) {
      return {
        ok: false,
        error: res?.error?.message || "Template send failed",
      };
    }

    return { ok: true };
  } catch (err) {
    console.error("TEMPLATE ERROR:", err);

    return {
      ok: false,
      error: err?.message || "Template send failed",
    };
  }
};