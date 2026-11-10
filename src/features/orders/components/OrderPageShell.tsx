import type { ReactNode } from "react";
import styles from "./OrderPages.module.css";

export function OrderPageShell({ title, label, menuLabel = "Back to the menu", children }: {
  title: string;
  label: string;
  menuLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/" aria-label="Soul Bites home">
          <img src="/images/soul_bites_logo_small.webp" width="74" height="53" alt="" />
        </a>
        <a href="/#menu">{menuLabel} <span aria-hidden="true">↗</span></a>
      </header>
      <main className={styles.content}>
        <p className={styles.label}>{label}</p>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}
