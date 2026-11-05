import { describe, expect, it } from "vitest";
import { normalizePhone, validateCheckoutForm } from "./checkoutValidation";
import { DeliveryDetails } from "../types/checkoutTypes";

const valid: DeliveryDetails = {
  fullName: "Test Customer",
  phone: "+91 98765 43210",
  address: "123 Sample Road",
  unitApt: "4B",
  city: "Pune",
  postalCode: "411001",
  deliveryNotes: "",
};
describe("delivery validation", () => {
  it("accepts formatted Indian numbers and a six-digit PIN", () => {
    expect(validateCheckoutForm(valid).isValid).toBe(true);
    expect(normalizePhone(valid.phone)).toBe("9876543210");
  });
  it.each([
    "abc123456789012345678901234",
    "98765432100",
    "1234567890",
    "+1 555 123 4567",
    "",
  ])("rejects invalid phone %s", (phone) => {
    expect(
      validateCheckoutForm({ ...valid, phone }).errors.phone,
    ).toBeDefined();
  });
  it.each(["abcd", "10001", "000000", "4110011", ""])(
    "rejects invalid postal code %s",
    (postalCode) => {
      expect(
        validateCheckoutForm({ ...valid, postalCode }).errors.postalCode,
      ).toBeDefined();
    },
  );
  it("rejects missing names and overlong instructions", () => {
    expect(
      validateCheckoutForm({
        ...valid,
        fullName: " ",
        deliveryNotes: "x".repeat(301),
      }).errors,
    ).toHaveProperty("deliveryNotes");
    expect(
      validateCheckoutForm({ ...valid, fullName: " " }).errors.fullName,
    ).toBeDefined();
  });
});
