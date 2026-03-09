export const FREEPIK_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 10,
    durationDays: 7,
    description: "Starter plan for testing the flow",
    features: ["10 credits", "Image download support", "Basic usage"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 499,
    credits: 150,
    durationDays: 30,
    description: "Best for regular design work",
    features: ["150 credits", "Image + video download", "Priority queue"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 999,
    credits: 400,
    durationDays: 30,
    description: "High volume plan for teams and creators",
    features: ["400 credits", "Image + video download", "Fast processing"],
  },
];

export const getFreepikPlanById = (planId) =>
  FREEPIK_PLANS.find((plan) => plan.id === String(planId || "").trim().toLowerCase());
