import { formatCurrency } from "../../../utils/formatters";
import type { MenuItem } from "../../menu/types/menuTypes";
import styles from "./KitchenPicks.module.css";

export function KitchenPicks({
  items,
  onAdd,
}: {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <>
      <div className={styles.ribbon} aria-hidden="true">
        <span>Veg burgers</span>
        <span>✷</span>
        <span>Loaded fries</span>
        <span>✷</span>
        <span>Grain bowls</span>
        <span>✷</span>
        <span>Soul Bites</span>
      </div>
      <section
        className={styles.section}
        id="kitchen"
        aria-labelledby="picks-title"
      >
        <div className={styles.inner}>
          <header className={styles.header}>
            <div>
              <p className={styles.label}>01 / The kitchen edit</p>
              <h2 id="picks-title">
                The good <em>stuff.</em>
              </h2>
            </div>
            <p>
              Start with a crispy aloo tikki burger, share a plate of loaded
              fries, or build your meal around a grain bowl.
            </p>
          </header>
          <div className={styles.grid}>
            {items.map((item, index) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.picture}>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    width={504}
                    height={672}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.number} aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <div className={styles.meta}>
                  <div>
                    <p className={styles.label}>
                      {item.category} / {formatCurrency(item.price)}
                    </p>
                    <h3>{item.name}</h3>
                  </div>
                  <button
                    type="button"
                    className={styles.add}
                    onClick={() => onAdd(item)}
                    aria-label={`Add ${item.name} from kitchen picks`}
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
