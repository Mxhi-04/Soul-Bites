import React from 'react';
import { OrderTrackingState, OrderProgressStep } from '../types/trackingTypes';
import { Button } from '../../../components/ui/Button/Button';
import styles from './OrderTracker.module.css';

export interface OrderTrackerProps {
  tracking: OrderTrackingState;
  onAdvanceStatus?: () => void;
  onClose?: () => void;
}

const STEPS: OrderProgressStep[] = [
  {
    step: 'received',
    label: 'Order Confirmed',
    description: 'Cloud Kitchen Hub has received your order.',
    icon: '🧾',
  },
  {
    step: 'preparing',
    label: 'In The Kitchen',
    description: 'Our culinary artists are grilling and crafting your bites fresh.',
    icon: '👨‍🍳',
  },
  {
    step: 'dispatched',
    label: 'Out For Delivery',
    description: 'Rider picked up your insulated pack. On the way!',
    icon: '🛵',
  },
  {
    step: 'delivered',
    label: 'Delivered Fresh',
    description: 'Enjoy your hot meal. Don’t forget to leave a review!',
    icon: '✨',
  },
];

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  tracking,
  onAdvanceStatus,
  onClose,
}) => {
  const currentStepIndex = STEPS.findIndex((s) => s.step === tracking.currentStep);

  return (
    <div className={styles.trackerContainer}>
      <div className={styles.header}>
        <div>
          <div className={styles.orderNumber}>Order #{tracking.orderId}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-cream-dim)' }}>
            Placed at {tracking.placedAt}
          </div>
        </div>
        <div className={styles.eta}>
          {tracking.currentStep === 'delivered'
            ? 'Delivered!'
            : `Est. Arrival: ${tracking.estimatedArrivalMinutes} mins`}
        </div>
      </div>

      <div className={styles.stepsList}>
        {STEPS.map((s, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;

          const itemClass = isCompleted
            ? styles.stepCompleted
            : isActive
            ? styles.stepActive
            : '';

          return (
            <div key={s.step} className={`${styles.stepItem} ${itemClass}`}>
              <div className={styles.stepIconContainer}>
                {isCompleted ? '✓' : s.icon}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>{s.label}</div>
                <div className={styles.stepDesc}>{s.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footerInfo}>
        <span>📍 Delivering to: {tracking.deliveryAddress}</span>
      </div>

      {onAdvanceStatus && tracking.currentStep !== 'delivered' && (
        <Button variant="outline" size="sm" onClick={onAdvanceStatus}>
          Simulate Next Kitchen Stage ➔
        </Button>
      )}

      {onClose && (
        <Button variant="ghost" size="sm" onClick={onClose}>
          Hide Tracker
        </Button>
      )}
    </div>
  );
};
