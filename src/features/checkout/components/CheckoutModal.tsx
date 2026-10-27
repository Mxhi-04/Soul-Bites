import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { DeliveryDetails, CheckoutFormErrors, PlacedOrder } from '../types/checkoutTypes';
import { validateCheckoutForm } from '../validation/checkoutValidation';
import { formatCurrency } from '../../../utils/formatters';
import styles from './CheckoutModal.module.css';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  itemsCount: number;
  onOrderPlaced: (order: PlacedOrder) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  itemsCount,
  onOrderPlaced,
}) => {
  const [details, setDetails] = useState<DeliveryDetails>({
    fullName: '',
    phone: '',
    address: '',
    unitApt: '',
    city: '',
    postalCode: '',
    deliveryNotes: '',
    paymentMethod: 'card',
  });

  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CheckoutFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCheckoutForm(details);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const order: PlacedOrder = {
        orderId: `SB-${Math.floor(100000 + Math.random() * 900000)}`,
        itemsCount,
        total: totalAmount,
        deliveryAddress: `${details.address}, ${details.city}`,
        estimatedArrivalMinutes: 28,
        placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setIsSubmitting(false);
      onOrderPlaced(order);
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Your Order">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <span className={styles.sectionTitle}>Delivery Destination</span>

        <div className={styles.field}>
          <label className={styles.label}>Full Name</label>
          <input
            type="text"
            name="fullName"
            className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
            placeholder="e.g. Jordan Miller"
            value={details.fullName}
            onChange={handleChange}
          />
          {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Phone Number (For Delivery Updates)</label>
          <input
            type="tel"
            name="phone"
            className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
            placeholder="(555) 000-0000"
            value={details.phone}
            onChange={handleChange}
          />
          {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Street Address</label>
          <input
            type="text"
            name="address"
            className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
            placeholder="124 Grand Ave, Apt 4B"
            value={details.address}
            onChange={handleChange}
          />
          {errors.address && <span className={styles.errorText}>{errors.address}</span>}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>City</label>
            <input
              type="text"
              name="city"
              className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
              placeholder="Metropolis"
              value={details.city}
              onChange={handleChange}
            />
            {errors.city && <span className={styles.errorText}>{errors.city}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Postal Code</label>
            <input
              type="text"
              name="postalCode"
              className={`${styles.input} ${errors.postalCode ? styles.inputError : ''}`}
              placeholder="10001"
              value={details.postalCode}
              onChange={handleChange}
            />
            {errors.postalCode && <span className={styles.errorText}>{errors.postalCode}</span>}
          </div>
        </div>

        <span className={styles.sectionTitle}>Payment Method</span>
        <div className={styles.paymentOptions}>
          <button
            type="button"
            className={`${styles.paymentCard} ${
              details.paymentMethod === 'card' ? styles.activePayment : ''
            }`}
            onClick={() => setDetails((prev) => ({ ...prev, paymentMethod: 'card' }))}
          >
            <span>💳 Card</span>
          </button>
          <button
            type="button"
            className={`${styles.paymentCard} ${
              details.paymentMethod === 'apple-pay' ? styles.activePayment : ''
            }`}
            onClick={() => setDetails((prev) => ({ ...prev, paymentMethod: 'apple-pay' }))}
          >
            <span>🍏 Apple Pay</span>
          </button>
          <button
            type="button"
            className={`${styles.paymentCard} ${
              details.paymentMethod === 'cash-on-delivery' ? styles.activePayment : ''
            }`}
            onClick={() =>
              setDetails((prev) => ({ ...prev, paymentMethod: 'cash-on-delivery' }))
            }
          >
            <span>💵 Cash</span>
          </button>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" fullWidth onClick={onClose}>
            Back
          </Button>
          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Placing Order...' : `Pay ${formatCurrency(totalAmount)}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
