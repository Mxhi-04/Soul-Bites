import { APP_CONFIG } from "../../../constants/config";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.masthead}>
          <div>
            <p className={styles.brandName}>
              {APP_CONFIG.brandName} · Cloud kitchen
            </p>
            <h2 className={styles.title}>
              Come hungry. <em>Leave happy.</em>
            </h2>
          </div>

          <div className={styles.mascot} aria-hidden="true">
            <img
              src="/images/soul_bites_mascot.webp"
              width={280}
              height={280}
              loading="lazy"
              decoding="async"
              alt=""
            />
          </div>

          <nav className={styles.navigation} aria-label="Footer navigation">
            <h3 className={styles.label}>Explore</h3>
            <ul className={styles.links}>
              <li>
                <a href="#featured">
                  Featured dishes <span aria-hidden="true">→</span>
                </a>
              </li>
              <li>
                <a href="#menu">
                  Full menu <span aria-hidden="true">→</span>
                </a>
              </li>
              <li>
                <a href="#questions">
                  Kitchen FAQs <span aria-hidden="true">→</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p>
            © {new Date().getFullYear()} {APP_CONFIG.brandName}. All rights
            reserved.
          </p>
          <a className={styles.back} href="#">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
