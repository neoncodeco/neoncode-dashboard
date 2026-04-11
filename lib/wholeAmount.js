const WHOLE_NUMBER_PATTERN = /^\d+$/;

export const sanitizeWholeNumberInput = (value) =>
  String(value ?? "").replace(/[^\d]/g, "");

export const isWholeNumberInputValue = (value) => /^\d*$/.test(String(value ?? ""));

export const parseIntegerAmount = (value, { allowZero = false } = {}) => {
  const normalized = String(value ?? "").trim();

  if (!WHOLE_NUMBER_PATTERN.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isSafeInteger(amount) || amount < 0) {
    return null;
  }

  if (!allowZero && amount <= 0) {
    return null;
  }

  return amount;
};

export const parseWholeNumberAmount = (value) => parseIntegerAmount(value);

export const isWholeNumberAmount = (value) => parseWholeNumberAmount(value) !== null;

export const blockDecimalInput = (event) => {
  if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
};
