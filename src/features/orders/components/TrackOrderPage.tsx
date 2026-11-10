import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button/Button";
import { orderLink, latestOrderLink, OrderApiError, orderRequest, readOrderLink } from "../services/orderApi";
import { orderMoney, orderReference, orderTime } from "../services/orderFormatting";
import { openRazorpay } from "../services/razorpayCheckout";
import { FULFILMENT_STAGES, ORDER_STATUS_LABELS, PAYMENT_LABELS, type CustomerOrder, type OrderResponse } from "../types/orderTypes";
import { OrderPageShell } from "./OrderPageShell";
import styles from "./OrderPages.module.css";

export default function TrackOrderPage({ accountId }: { accountId?: string }) {
  const [access] = useState(readOrderLink);
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!access) return;
    let active = true;
    let running = false;
    const load = async () => {
      if (running || document.hidden) return;
      running = true;
      try {
        const result = await orderRequest<{ order: CustomerOrder }>("track", access);
        if (active) {
          setOrder(result.order);
          setFailure("");
        }
      } catch (error) {
        if (active) {
          if (error instanceof OrderApiError && error.status === 404) setOrder(null);
          setFailure(error instanceof Error ? error.message : "Could not refresh the order.");
        }
      } finally {
        running = false;
      }
    };
    void load();
    const timer = window.setInterval(load, 8_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [access, refresh]);

  async function pay(openCheckout: boolean) {
    if (!access || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await orderRequest<OrderResponse>("payment", access);
      setOrder(result.order);
      if (result.checkout && openCheckout) {
        const confirmation = await openRazorpay(result.checkout);
        if (confirmation) {
          const verified = await orderRequest<{ order: CustomerOrder }>("verify", { ...access, ...confirmation });
          setOrder(verified.order);
          if (verified.order.status === "unpaid")
            setNotice("Razorpay is confirming the payment. Keep this link and check again shortly.");
        } else {
          setNotice("Checkout was closed. You can resume payment for this order.");
        }
      } else if (result.checkout) {
        setNotice("A captured payment has not reached this order yet.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not confirm payment. Check again before retrying.");
    } finally {
      setBusy(false);
      setRefresh((current) => current + 1);
    }
  }

  async function copyLink() {
    if (!access) return;
    try {
      await navigator.clipboard.writeText(new URL(orderLink(access), window.location.origin).href);
      setNotice("Private tracking link copied.");
    } catch {
      setNotice("Copy the full address from your browser to save your tracking link.");
    }
  }

  const saved = latestOrderLink(accountId);
  const etaActive = order?.etaAt && order.status !== "delivered" && order.status !== "declined";
  const etaPassed = Boolean(etaActive && order?.etaAt && Date.parse(order.etaAt) < Date.now());
  const showTimeline = order && order.status !== "unpaid";
  return (
    <OrderPageShell title="Track your order." label="Soul Bites / Order tracking">
      {!access && (
        <section className={styles.panel}>
          <h2>Your tracking link</h2>
          <p>Open the private link provided after checkout to see kitchen updates and your estimated arrival.</p>
          {saved && <a className={styles.linkButton} href={saved}>Open latest order</a>}
        </section>
      )}
      {access && !order && !failure && <p role="status">Loading your order…</p>}
      {failure && <p className={styles.alert} role="alert">{failure}</p>}
      {order && (
        <div className={styles.trackGrid}>
          <section className={styles.panel} aria-labelledby="tracking-status">
            <div className={styles.panelHeader}>
              <span className={styles.label}>{orderReference(order.id)}</span>
              {order.mode === "test" && <span className={styles.badge}>Test order</span>}
            </div>
            <h2 id="tracking-status" aria-live="polite">{ORDER_STATUS_LABELS[order.status]}</h2>
            <p>{PAYMENT_LABELS[order.paymentState]}</p>
            {order.status === "pending" && <p>The kitchen will confirm your order and set an arrival estimate.</p>}
            {order.status === "unpaid" && (
              <div className={styles.actions}>
                <Button disabled={busy} onClick={() => void pay(true)}>Pay {orderMoney(order.amounts.totalPaise)}</Button>
                <Button variant="outline" disabled={busy} onClick={() => void pay(false)}>Check payment</Button>
              </div>
            )}
            {order.declineReason && <p className={styles.alert}>{order.declineReason}</p>}
            {etaActive && order.etaAt && (
              <div className={styles.eta}>
                <span className={styles.label}>Kitchen estimate · IST</span>
                <strong>{orderTime(order.etaAt)}</strong>
                {etaPassed && <span>This estimate has passed. The latest kitchen status is shown here.</span>}
              </div>
            )}
            {showTimeline && (
              <ol className={styles.timeline} aria-label="Order progress">
                {FULFILMENT_STAGES.map((status) => {
                  const event = order.events.find((entry) => entry.status === status);
                  const current = order.status === status;
                  return (
                    <li key={status} data-reached={Boolean(event)} aria-current={current ? "step" : undefined}>
                      <span>{status === "pending" ? "Order received" : ORDER_STATUS_LABELS[status]}</span>
                      {event && <time dateTime={event.at}>{orderTime(event.at)}</time>}
                    </li>
                  );
                })}
                {order.status === "declined" && <li data-reached aria-current="step">Declined</li>}
              </ol>
            )}
          </section>
          <section className={styles.panel}>
            <h2>Order summary</h2>
            <ul className={styles.lines}>
              {order.lines.map((line) => (
                <li key={line.itemId}>
                  <span>{line.quantity} × {line.name}</span>
                  <strong>{orderMoney(line.quantity * line.unitPaise)}</strong>
                </li>
              ))}
            </ul>
            <dl className={styles.totals}>
              <div><dt>Delivery</dt><dd>{orderMoney(order.amounts.deliveryPaise)}</dd></div>
              <div><dt>Tax</dt><dd>{orderMoney(order.amounts.taxPaise)}</dd></div>
              <div><dt>Total</dt><dd>{orderMoney(order.amounts.totalPaise)}</dd></div>
            </dl>
            <Button variant="outline" onClick={() => void copyLink()}>Copy private tracking link</Button>
          </section>
        </div>
      )}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
    </OrderPageShell>
  );
}
