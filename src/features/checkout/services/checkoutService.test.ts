import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "../../../utils/storage";
import { hydrateCart } from "../../cart/services/cartService";
import { createOrderPreview, restoreOrderPreview } from "./checkoutService";
import { DeliveryDetails } from "../types/checkoutTypes";

const details: DeliveryDetails = {
  fullName: "Test Customer",
  phone: "9876543210",
  address: "123 Sample Road",
  unitApt: "4B",
  city: "Pune",
  postalCode: "411001",
  deliveryNotes: "Sample instruction",
};
const cart = hydrateCart([{ itemId: "sb-pizza-01", quantity: 1 }]);
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("local preview lifecycle", () => {
  it("does not save or complete a cancelled preview", async () => {
    const save = vi.spyOn(storage, "set").mockReturnValue(true);
    const abort = new AbortController();
    const pending = createOrderPreview(details, cart, abort.signal);
    const rejected = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    abort.abort();
    await rejected;
    await vi.runAllTimersAsync();
    expect(save).not.toHaveBeenCalled();
  });
  it("rejects a below-minimum cart at the service boundary", async () => {
    await expect(
      createOrderPreview(
        details,
        hydrateCart([{ itemId: "sb-07", quantity: 1 }]),
        new AbortController().signal,
      ),
    ).rejects.toThrow("minimum");
  });
  it("saves complete details with a unique preview ID and restores the preview safely", async () => {
    const save = vi.spyOn(storage, "set").mockReturnValue(true);
    const pending = createOrderPreview(
      details,
      cart,
      new AbortController().signal,
    );
    await vi.runAllTimersAsync();
    const order = await pending;
    expect(order).toMatchObject({ kind: "preview", deliveryDetails: details });
    expect(order.items[0].item.id).toBe("sb-pizza-01");
    expect(order.orderId).toMatch(/^PREVIEW-/);
    expect(save).toHaveBeenCalledWith(
      "soul_bites_order_preview",
      order,
      "sessionStorage",
    );
    vi.spyOn(storage, "get").mockReturnValue(order);
    expect(restoreOrderPreview()).toEqual(order);
  });
  it("rejects malformed saved previews", () => {
    vi.spyOn(storage, "get").mockReturnValue({ kind: "preview", items: null });
    expect(restoreOrderPreview()).toBeNull();
  });
  it("reports storage failure without claiming success", async () => {
    vi.spyOn(storage, "set").mockReturnValue(false);
    const pending = createOrderPreview(
      details,
      cart,
      new AbortController().signal,
    );
    const rejected = expect(pending).rejects.toThrow("could not save");
    await vi.runAllTimersAsync();
    await rejected;
  });
});
