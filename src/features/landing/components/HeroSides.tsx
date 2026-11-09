import type { CSSProperties } from "react";
import styles from "./HeroSides.module.css";

function Mojito() {
  return (
    <div className={styles.glass} role="img" aria-label="Lime and mint mojito">
      <div className={styles.pour} aria-hidden="true">
        <div className={styles.stream} />
        <span className={styles.drop} />
        <span className={styles.drop} />
        <span className={styles.drop} />
        <span className={styles.drop} />
      </div>
      <svg viewBox="0 0 410 800" className={styles.glassBack}>
        <defs>
          <linearGradient id="mojito-reflection">
            <stop stopColor="var(--color-cream-white)" stopOpacity=".42" />
            <stop offset=".09" stopColor="var(--color-cream-white)" stopOpacity=".12" />
            <stop offset=".35" stopColor="var(--color-cream-white)" stopOpacity=".025" />
            <stop offset=".7" stopColor="var(--color-cream-white)" stopOpacity=".06" />
            <stop offset=".94" stopColor="var(--color-cream-white)" stopOpacity=".34" />
            <stop offset="1" stopColor="var(--color-cream-white)" stopOpacity=".15" />
          </linearGradient>
          <linearGradient id="mojito-foot" x2="0" y2="1">
            <stop stopColor="var(--color-cream-white)" stopOpacity=".22" />
            <stop offset=".5" stopColor="var(--color-cream-white)" stopOpacity=".04" />
            <stop offset="1" stopColor="var(--color-cream-white)" stopOpacity=".4" />
          </linearGradient>
          <clipPath id="mojito-interior" clipPathUnits="objectBoundingBox">
            <path d="M.073 .048C.16 .027 .82 .026 .94 .05L.9 .847Q.87 .884 .51 .888Q.14 .888 .12 .846Z" />
          </clipPath>
        </defs>
        <path
          d="M26 43C26 12 384 12 384 43L369 746Q368 785 205 788Q43 786 42 746Z"
          fill="url(#mojito-reflection)"
          stroke="var(--color-cream-white)"
          strokeOpacity=".46"
          strokeWidth="3"
        />
        <path
          d="M43 697Q203 738 369 697L369 751Q351 789 206 789Q62 788 43 751Z"
          fill="url(#mojito-foot)"
        />
        <ellipse
          cx="206"
          cy="702"
          rx="162"
          ry="25"
          fill="none"
          stroke="var(--color-cream-white)"
          strokeOpacity=".4"
          strokeWidth="3"
        />
      </svg>
      <div className={styles.glassInterior}>
        <img
          className={styles.liquid}
          src="/images/landing/mojito-filled.webp"
          loading="lazy"
          decoding="async"
          alt=""
          width="410"
          height="800"
        />
        <div className={styles.surface} />
      </div>
      <svg viewBox="0 0 410 800" className={styles.glassFront}>
        <ellipse cx="205" cy="41" rx="179" ry="24" fill="none" stroke="currentColor" strokeOpacity=".74" strokeWidth="4" />
        <path d="M36 75L52 681M374 78L359 669M62 761Q205 794 350 760" fill="none" stroke="currentColor" strokeOpacity=".44" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Each cutout settles behind the front lip of the pouch.
const fries = [
  { sprite: 2, left: 47, top: 9, height: 38, tilt: 13 },
  { sprite: 4, left: 30, top: 18, height: 34, tilt: -25 },
  { sprite: 5, left: 60, top: 15, height: 32, tilt: 24 },
  { sprite: 1, left: 51, top: 21, height: 29, tilt: -13 },
  { sprite: 6, left: 69, top: 22, height: 34, tilt: 37 },
  { sprite: 3, left: 24, top: 26, height: 25, tilt: -35 },
  { sprite: 4, left: 40, top: 16, height: 37, tilt: 29 },
  { sprite: 2, left: 56, top: 26, height: 32, tilt: -24 },
  { sprite: 1, left: 72, top: 28, height: 27, tilt: 42 },
  { sprite: 6, left: 36, top: 32, height: 29, tilt: -37 },
  { sprite: 3, left: 49, top: 30, height: 33, tilt: 39 },
  { sprite: 5, left: 63, top: 30, height: 31, tilt: 18 },
];

function Fries({ still }: { still: boolean }) {
  if (still) {
    return (
      <img
        className={styles.pouch}
        src="/images/landing/fries-filled.webp"
        width={585}
        height={720}
        loading="lazy"
        decoding="async"
        alt="Charcoal truffle fries"
      />
    );
  }

  return (
    <div className={styles.pouch} role="img" aria-label="Charcoal truffle fries">
      <svg width="0" height="0" className={styles.defs}>
        <defs>
          <clipPath id="fries-opening" clipPathUnits="objectBoundingBox">
            <path d="M0 -1H1V.318L.949 .324Q.908 .351 .86 .389C.75 .484 .65 .536 .5 .536C.35 .536 .24 .487 .133 .387Q.078 .345 .04 .325L0 .318Z" />
          </clipPath>
        </defs>
      </svg>
      <img
        className={styles.pouchBase}
        src="/images/landing/fries-pouch.webp"
        loading="lazy"
        decoding="async"
        alt=""
        width="585"
        height="720"
      />
      <div className={styles.pouchOpening}>
        {fries.map(({ sprite, left, top, height, tilt }, index) => (
          <img
            key={index}
            className={styles.fry}
            src={`/images/landing/fry-${sprite}.webp`}
            loading="lazy"
            decoding="async"
            alt=""
            style={
              {
                left: `${left}%`,
                top: `${top}%`,
                height: `${height + 4}%`,
                "--tilt": `${tilt}deg`,
                "--start": 0.08 + index * 0.056,
              } as CSSProperties
            }
          />
        ))}
        <img
          className={styles.packedFries}
          src="/images/landing/fries-filled.webp"
          loading="lazy"
          decoding="async"
          alt=""
          width="585"
          height="720"
        />
      </div>
    </div>
  );
}

export function HeroSides({ still = false }: { still?: boolean }) {
  return (
    <>
      <Fries still={still} />
      <Mojito />
    </>
  );
}
