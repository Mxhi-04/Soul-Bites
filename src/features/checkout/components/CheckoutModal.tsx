import React, { useEffect, useRef, useState } from "react";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { APP_CONFIG } from "../../../constants/config";
import { useCart } from "../../cart/hooks/useCart";
import {
  DeliveryDetails,
  CheckoutFormErrors,
  OrderPreview,
} from "../types/checkoutTypes";
import { validateCheckoutForm } from "../validation/checkoutValidation";
import { createOrderPreview } from "../services/checkoutService";
import { formatCurrency } from "../../../utils/formatters";
import styles from "./CheckoutModal.module.css";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreviewSaved: (order: OrderPreview) => void;
}
const EMPTY_DETAILS: DeliveryDetails = {
  fullName: "",
  phone: "",
  address: "",
  unitApt: "",
  city: "",
  postalCode: "",
  deliveryNotes: "",
};
const FIELDS: {
  name: keyof DeliveryDetails;
  label: string;
  placeholder: string;
  autoComplete: string;
  maxLength: number;
  type?: string;
}[] = [
  {
    name: "fullName",
    label: "Full name",
    placeholder: "Your name",
    autoComplete: "name",
    maxLength: 100,
  },
  {
    name: "phone",
    label: "Mobile number",
    placeholder: "+91 98765 43210",
    autoComplete: "tel",
    maxLength: 25,
    type: "tel",
  },
  {
    name: "address",
    label: "Street address",
    placeholder: "House number and street",
    autoComplete: "address-line1",
    maxLength: 200,
  },
  {
    name: "unitApt",
    label: "Apartment or floor (optional)",
    placeholder: "Apartment, floor or landmark",
    autoComplete: "address-line2",
    maxLength: 100,
  },
  {
    name: "city",
    label: "City",
    placeholder: "Your city",
    autoComplete: "address-level2",
    maxLength: 100,
  },
  {
    name: "postalCode",
    label: "PIN code",
    placeholder: "6-digit PIN code",
    autoComplete: "postal-code",
    maxLength: 6,
  },
  {
    name: "deliveryNotes",
    label: "Delivery instructions (optional)",
    placeholder: "Anything the rider should know",
    autoComplete: "off",
    maxLength: 300,
  },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onPreviewSaved,
}) => {
  const { items, pricing, completeCheckout } = useCart();
  const [details, setDetails] = useState<DeliveryDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [failure, setFailure] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!isOpen) {
      controller.current?.abort();
      controller.current = null;
      setIsSubmitting(false);
    }
    return () => {
      controller.current?.abort();
    };
  }, [isOpen]);

  const close = () => {
    controller.current?.abort();
    controller.current = null;
    setIsSubmitting(false);
    onClose();
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (controller.current) return;
    const validation = validateCheckoutForm(details);
    setErrors(validation.errors);
    setFailure("");
    if (!validation.isValid) {
      formRef.current
        ?.querySelector<HTMLInputElement>(
          `[name="${Object.keys(validation.errors)[0]}"]`,
        )
        ?.focus();
      return;
    }
    const pending = new AbortController();
    controller.current = pending;
    setIsSubmitting(true);
    try {
      const order = await createOrderPreview(details, items, pending.signal);
      if (pending.signal.aborted) return;
      completeCheckout(order.items);
      onPreviewSaved(order);
      setDetails(EMPTY_DETAILS);
      setErrors({});
      onClose();
    } catch (error) {
      if (!pending.signal.aborted)
        setFailure(
          error instanceof Error
            ? error.message
            : "Could not save the preview. Try again.",
        );
    } finally {
      if (controller.current === pending) {
        controller.current = null;
        setIsSubmitting(false);
      }
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={close} title="Review your order">
      <form
        ref={formRef}
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting}
      >
        <p className={styles.notice}>
          This is an order preview. No payment is collected and nothing is sent
          to a kitchen. Use sample details.
        </p>
        <fieldset className={styles.fields} disabled={isSubmitting}>
          <legend className={styles.sectionTitle}>Delivery details</legend>
          {FIELDS.map(
            ({ name, label, placeholder, autoComplete, maxLength, type }) => (
              <div key={name} className={styles.field}>
                <label className={styles.label} htmlFor={`checkout-${name}`}>
                  {label}
                </label>
                <input
                  id={`checkout-${name}`}
                  name={name}
                  type={type ?? "text"}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  maxLength={maxLength}
                  inputMode={name === "postalCode" ? "numeric" : undefined}
                  required={!["unitApt", "deliveryNotes"].includes(name)}
                  aria-invalid={Boolean(errors[name])}
                  aria-describedby={errors[name] ? `error-${name}` : undefined}
                  className={`${styles.input} ${errors[name] ? styles.inputError : ""}`}
                  value={details[name]}
                  onChange={(event) => {
                    setDetails((previous) => ({
                      ...previous,
                      [name]: event.target.value,
                    }));
                    setErrors((previous) => ({
                      ...previous,
                      [name]: undefined,
                    }));
                  }}
                />
                {errors[name] && (
                  <span id={`error-${name}`} className={styles.errorText}>
                    {errors[name]}
                  </span>
                )}
              </div>
            ),
          )}
        </fieldset>
        <div className={styles.summary}>
          {items.map(({ item, quantity }) => (
            <div key={item.id} className={styles.summaryRow}>
              <span>
                {quantity} × {item.name}
              </span>
              <span>{formatCurrency(item.price * quantity)}</span>
            </div>
          ))}
          <div className={styles.summaryRow}>
            <span>Delivery</span>
            <span>
              {pricing.deliveryFee
                ? formatCurrency(pricing.deliveryFee)
                : "Free"}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span>Estimated tax</span>
            <span>{formatCurrency(pricing.tax)}</span>
          </div>
          <div className={styles.summaryRow}>
            <strong>Preview total</strong>
            <strong>{formatCurrency(pricing.total)}</strong>
          </div>
        </div>
        {failure && (
          <p role="alert" className={styles.errorText}>
            {failure}
          </p>
        )}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" fullWidth onClick={close}>
            Back
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={
              isSubmitting ||
              pricing.subtotal < APP_CONFIG.delivery.minimumOrderAmount
            }
          >
            {isSubmitting ? "Saving preview…" : "Save order preview"}
          </Button>
        </div>
        <p className={styles.notice}>
          Your latest preview stays in this tab until you close it or clear the
          preview. Delivery availability has not been checked.
        </p>
      </form>
    </Modal>
  );
};
