import React from "react";
import { OrderPreview } from "../../checkout/types/checkoutTypes";
import { Button } from "../../../components/ui/Button/Button";
import { formatCurrency } from "../../../utils/formatters";
import styles from "./OrderTracker.module.css";

export const OrderTracker: React.FC<{
  tracking: OrderPreview;
  onClose: () => void;
  onClear: () => void;
}> = ({ tracking, onClose, onClear }) => (
  <section
    className={styles.trackerContainer}
    aria-labelledby="preview-title"
    tabIndex={-1}
    id="order-preview"
  >
    <div className={styles.header}>
      <div>
        <h2 id="preview-title" className={styles.orderNumber}>
          Your latest order preview
        </h2>
        <p>Saved {new Date(tracking.placedAt).toLocaleString("en-IN")}</p>
      </div>
    </div>
    <p>
      No order has been placed or paid for. Kitchen acceptance and live delivery
      tracking are not available yet.
    </p>
    <ul className={styles.previewItems}>
      {tracking.items.map(({ item, quantity }) => (
        <li key={item.id}>
          <span>
            {quantity} × {item.name}
          </span>
          <span>{formatCurrency(item.price * quantity)}</span>
        </li>
      ))}
    </ul>
    <div className={styles.footerInfo}>
      <span>Preview total, including fees</span>
      <strong>{formatCurrency(tracking.pricing.total)}</strong>
    </div>
    <div className={styles.footerInfo}>
      <span>
        Address:{" "}
        {[
          tracking.deliveryDetails.address,
          tracking.deliveryDetails.unitApt,
          tracking.deliveryDetails.city,
          tracking.deliveryDetails.postalCode,
        ]
          .filter(Boolean)
          .join(", ")}
      </span>
    </div>
    {tracking.deliveryDetails.deliveryNotes && (
      <p>Instructions: {tracking.deliveryDetails.deliveryNotes}</p>
    )}
    <div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        Hide preview
      </Button>
      <Button variant="outline" size="sm" onClick={onClear}>
        Clear preview
      </Button>
    </div>
  </section>
);
