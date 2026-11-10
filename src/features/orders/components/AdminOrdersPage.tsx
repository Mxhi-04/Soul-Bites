import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button/Button";
import { useAuth } from "../../auth/context/authContext";
import { loadAuth, signOut } from "../../auth/services/authService";
import { OrderApiError, orderRequest } from "../services/orderApi";
import { orderMoney, orderReference, orderTime } from "../services/orderFormatting";
import { ORDER_STATUS_LABELS, PAYMENT_LABELS, type OrderingMode, type StaffAction, type StaffOrder } from "../types/orderTypes";
import { OrderPageShell } from "./OrderPageShell";
import styles from "./OrderPages.module.css";

type Queue = "active" | "history" | "unpaid";
interface QueueResponse {
  orders: StaffOrder[];
  hasMore: boolean;
  acceptingOrders: boolean;
  mode: OrderingMode;
}

async function staffRequest<T>(action: string, body: object) {
  const { client } = await loadAuth();
  const { data: { session } } = await client.auth.getSession();
  if (!session) throw new OrderApiError(401, "Sign in again to open the kitchen console.");
  return orderRequest<T>(action, body, session.access_token);
}

const steps = {
  accepted: ["prepare", "Start preparing"],
  preparing: ["ready", "Mark ready"],
  ready: ["dispatch", "Mark out for delivery"],
} as const;

function OrderTicket({ order, busy, update }: {
  order: StaffOrder;
  busy: boolean;
  update: (action: StaffAction) => void;
}) {
  const [prep, setPrep] = useState("20");
  const [delivery, setDelivery] = useState("15");
  const [reason, setReason] = useState("");
  const [cashCollected, setCashCollected] = useState(false);
  const details = order.details;
  const step = order.status === "accepted" || order.status === "preparing" || order.status === "ready"
    ? steps[order.status] : null;
  const canDecline = ["pending", "accepted", "preparing", "ready", "out_for_delivery"].includes(order.status);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    update({ action: "accept", prepMinutes: Number(prep), deliveryMinutes: Number(delivery) });
  };

  return (
    <article className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.label}>{orderReference(order.id)}</p>
          <h2>{ORDER_STATUS_LABELS[order.status]}</h2>
        </div>
        <span className={styles.badge}>{PAYMENT_LABELS[order.paymentState]}</span>
      </div>
      <p className={styles.meta}>Received {orderTime(order.createdAt)} IST</p>
      {order.etaAt && order.status !== "delivered" && <p className={styles.meta}>Estimated arrival {orderTime(order.etaAt)} IST</p>}
      <ul className={styles.lines}>
        {order.lines.map((line) => (
          <li key={line.itemId}>
            <span>{line.quantity} × {line.name}</span>
            <strong>{orderMoney(line.quantity * line.unitPaise)}</strong>
          </li>
        ))}
      </ul>
      <div className={styles.ticketTotal}>
        <span>Total including fees</span><strong>{orderMoney(order.amounts.totalPaise)}</strong>
      </div>
      <details className={styles.deliveryDetails}>
        <summary>Delivery and order details</summary>
        <p>{details.fullName} · <a href={`tel:+91${details.phone}`}>+91 {details.phone}</a></p>
        <p>{[details.address, details.unitApt, details.city, details.postalCode].filter(Boolean).join(", ")}</p>
        {details.deliveryNotes && <p>Instructions: {details.deliveryNotes}</p>}
        <p>Reference: <span className={styles.reference}>{order.id}</span></p>
        {order.paymentReference && <p>Razorpay: {order.paymentReference}</p>}
      </details>
      {order.status === "pending" && (
        <form className={styles.staffForm} onSubmit={submit}>
          <label>Prep minutes<input type="number" min="5" max="180" required value={prep} onChange={(event) => setPrep(event.target.value)} /></label>
          <label>Delivery minutes<input type="number" min="5" max="180" required value={delivery} onChange={(event) => setDelivery(event.target.value)} /></label>
          <Button type="submit" disabled={busy}>Accept order</Button>
        </form>
      )}
      {step && <Button disabled={busy} onClick={() => update({ action: step[0] })}>{step[1]}</Button>}
      {order.status === "out_for_delivery" && (
        <div className={styles.actions}>
          {order.paymentMethod === "cod" && (
            <label className={styles.check}>
              <input type="checkbox" checked={cashCollected} onChange={(event) => setCashCollected(event.target.checked)} />
              Confirm cash collected
            </label>
          )}
          <Button disabled={busy || (order.paymentMethod === "cod" && !cashCollected)} onClick={() => update({ action: "deliver", cashCollected })}>Mark delivered</Button>
        </div>
      )}
      {canDecline && (
        <details className={styles.deliveryDetails}>
          <summary>Decline order</summary>
          <form className={styles.staffForm} onSubmit={(event) => {
            event.preventDefault();
            update({ action: "decline", reason });
          }}>
            <label>Customer-facing reason<input required minLength={3} maxLength={140} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
            <Button type="submit" variant="outline" disabled={busy}>Confirm decline</Button>
          </form>
        </details>
      )}
      {order.declineReason && <p className={styles.meta}>{order.declineReason}</p>}
      {order.paymentState === "refund_required" && (
        <Button variant="outline" disabled={busy} onClick={() => {
          if (window.confirm(`Send a full refund of ${orderMoney(order.amounts.totalPaise)} through Razorpay?`))
            update({ action: "refund" });
        }}>Issue full refund</Button>
      )}
      {order.paymentState === "refund_failed" && <p className={styles.alert}>Review this refund in the Razorpay dashboard.</p>}
    </article>
  );
}

export default function AdminOrdersPage() {
  const { status, user } = useAuth();
  const [queue, setQueue] = useState<Queue>("active");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<QueueResponse | null>(null);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    let running = false;
    const load = async () => {
      if (running || document.hidden) return;
      running = true;
      try {
        const data = await staffRequest<QueueResponse>("staff-list", { page, queue });
        if (active) {
          setResult(data);
          setFailure("");
        }
      } catch (error) {
        if (active) {
          if (error instanceof OrderApiError && (error.status === 401 || error.status === 403))
            setResult(null);
          setFailure(error instanceof Error ? error.message : "Could not load orders.");
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
  }, [page, queue, refresh, user]);

  async function run(action: () => Promise<unknown>, key: string, success: string) {
    if (busy) return;
    setBusy(key);
    setNotice("");
    try {
      await action();
      setNotice(success);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The action could not be confirmed.");
    } finally {
      setBusy(null);
      setRefresh((value) => value + 1);
    }
  }

  return (
    <OrderPageShell label="Soul Bites / Staff only" title="Kitchen console." menuLabel="Order food">
      {status === "loading" && <p role="status">Checking your sign-in…</p>}
      {status === "unavailable" && <p className={styles.alert}>Staff sign-in is unavailable.</p>}
      {status === "ready" && !user && <a className={styles.linkButton} href="/login?next=admin">Sign in as staff</a>}
      {user && (
        <>
          <div className={styles.toolbar}>
            <span>{user.email ?? "Signed-in account"}</span>
            <Button variant="ghost" onClick={() => void run(signOut, "sign-out", "Signed out.")}>Sign out</Button>
          </div>
          {!result && !failure && <p role="status">Loading kitchen queue…</p>}
          {failure && <p role="alert" className={styles.alert}>{failure}</p>}
          {notice && <p role="status" className={styles.notice}>{notice}</p>}
          {result && (
            <>
              <section className={styles.toolbar} aria-label="Kitchen availability">
                <div>
                  <span className={styles.badge}>{result.mode === "test" ? "Test mode" : "Live mode"}</span>
                  <strong>{result.acceptingOrders ? "Accepting new orders" : "New orders paused"}</strong>
                </div>
                <Button variant="outline" disabled={Boolean(busy)} onClick={() => {
                  const open = !result.acceptingOrders;
                  if (open && result.mode === "live" && !window.confirm("Open the kitchen to real orders?")) return;
                  void run(() => staffRequest("staff-kitchen", { open }), "kitchen", open ? "Kitchen opened." : "Kitchen paused.");
                }}>{result.acceptingOrders ? "Pause new orders" : "Open kitchen"}</Button>
              </section>
              <div className={styles.queue} aria-label="Order queue">
                {(["active", "history", "unpaid"] as const).map((tab) => (
                  <Button key={tab} variant={queue === tab ? "primary" : "outline"} aria-pressed={queue === tab} onClick={() => {
                    if (queue === tab) return;
                    setQueue(tab);
                    setPage(0);
                    setResult(null);
                  }}>{tab === "active" ? "Active orders" : tab === "history" ? "History & refunds" : "Awaiting payment"}</Button>
                ))}
                <Button variant="ghost" onClick={() => setRefresh((value) => value + 1)}>Refresh</Button>
              </div>
              {!result.orders.length && <p className={styles.notice}>There are no orders in this queue.</p>}
              <div className={styles.orderGrid}>
                {result.orders.map((order) => (
                  <OrderTicket key={order.id} order={order} busy={Boolean(busy)} update={(action) =>
                    void run(() => staffRequest("staff-update", { id: order.id, revision: order.revision, ...action }), order.id, "Order updated.")
                  } />
                ))}
              </div>
              {(page > 0 || result.hasMore) && (
                <div className={styles.actions}>
                  <Button variant="outline" disabled={page === 0} onClick={() => { setResult(null); setPage(page - 1); }}>Newer orders</Button>
                  <Button variant="outline" disabled={!result.hasMore} onClick={() => { setResult(null); setPage(page + 1); }}>Older orders</Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </OrderPageShell>
  );
}
