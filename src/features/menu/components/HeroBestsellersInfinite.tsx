import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { INITIAL_MENU_ITEMS } from "../services/menuService";
import { MenuItem } from "../types/menuTypes";
import { useScrollProgress } from "../../../hooks/useScrollProgress";
import { formatCurrency } from "../../../utils/formatters";
import styles from "./HeroBestsellersInfinite.module.css";

interface PosterItemMeta {
  line1: string;
  scriptLine: string;
  line2: string;
  watermarkWords: [string, string, string];
}

const POSTER_METAS: Record<string, PosterItemMeta> = {
  "sb-pizza-01": {
    line1: "PANEER",
    scriptLine: "Tikka",
    line2: "PIZZA",
    watermarkWords: ["PIZZA", "PANEER", "PANEER"],
  },
  "sb-aloo-tikki": {
    line1: "ALOO",
    scriptLine: "Tikki",
    line2: "BURGER",
    watermarkWords: ["BURGER", "ALOO", "TIKKI"],
  },
  "sb-hot-honey-paneer": {
    line1: "CRISPY",
    scriptLine: "Hot Honey",
    line2: "PANEER",
    watermarkWords: ["PANEER", "HONEY", "CRISPY"],
  },
  "sb-05": {
    line1: "LOADED",
    scriptLine: "Truffle",
    line2: "FRIES",
    watermarkWords: ["FRIES", "TRUFFLE", "LOADED"],
  },
  "sb-08": {
    line1: "SALTED",
    scriptLine: "Caramel",
    line2: "BROWNIE",
    watermarkWords: ["BROWNIE", "CARAMEL", "FUDGE"],
  },
};

const DEFAULT_5_BESTSELLERS = INITIAL_MENU_ITEMS.filter(
  (item) => item.isPopular,
).slice(0, 5);

// Leaf Accent SVG component
const MintLeaf: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M19.5 4.5C14.5 4.5 8 7.5 5 12.5C2.5 16.5 3 20 5.5 21C8 22 13 20.5 17 17C21 13.5 22 8 19.5 4.5Z"
      fill="var(--color-success)"
      fillOpacity="0.9"
    />
    <path
      d="M6 19C10.5 15.5 14.5 11 18.5 6"
      stroke="var(--color-charcoal-surface)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Dish line-art icons removed per design update

export interface HeroBestsellersInfiniteProps {
  items?: MenuItem[];
  initialItemId?: string;
  onAddToCart: (item: MenuItem) => void;
}

export const HeroBestsellersInfinite: React.FC<
  HeroBestsellersInfiniteProps
> = ({ items, initialItemId, onAddToCart }) => {
  const bestsellers = useMemo(() => {
    if (items && items.length >= 5) {
      const popular = items.filter((i) => i.isPopular);
      if (popular.length >= 5) return popular.slice(0, 5);
      return items.slice(0, 5);
    }
    return DEFAULT_5_BESTSELLERS;
  }, [items]);

  const itemCount = bestsellers.length;
  const anglePerItem = 360 / itemCount;
  const initialIndex = Math.max(
    0,
    bestsellers.findIndex((item) => item.id === initialItemId),
  );
  const [currentAngle, setCurrentAngle] = useState(-anglePerItem * initialIndex);
  const scrollStep = useRef(0);
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const followScroll = useCallback(
    (progress: number) => {
      const nextStep = Math.round(progress * (itemCount - 1));
      if (nextStep === scrollStep.current) return;

      scrollStep.current = nextStep;
      setCurrentAngle((previous) => {
        const currentSlot = Math.round(-previous / anglePerItem);
        const targetSlot = initialIndex + nextStep;
        const difference = targetSlot - currentSlot;
        const nearest =
          difference - itemCount * Math.round(difference / itemCount);
        return -(currentSlot + nearest) * anglePerItem;
      });
    },
    [anglePerItem, initialIndex, itemCount],
  );
  useScrollProgress(trackRef, stageRef, followScroll);

  // Drag tracking refs
  const isPointerDownRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const wheelGesture = useRef({ delta: 0, lastAt: 0, rotatedAt: -Infinity });

  // Stage measurement
  const [stageWidth, setStageWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = new ResizeObserver(() => setStageWidth(stage.offsetWidth));
    resize.observe(stage);
    return () => resize.disconnect();
  }, []);

  const isMobile = stageWidth < 640;
  const isTablet = stageWidth >= 640 && stageWidth < 960;

  // Compute 3D radius adaptively for mobile, tablet, and desktop
  const radiusX = useMemo(() => {
    if (isMobile) {
      // Keep adjacent cards visible as peek previews on mobile without clipping
      return Math.min(250, Math.max(160, stageWidth * 0.56));
    }
    if (isTablet) {
      return Math.min(460, Math.max(260, stageWidth * 0.44));
    }
    return Math.min(680, Math.max(280, (stageWidth - 80) * 0.46));
  }, [isMobile, isTablet, stageWidth]);

  const radiusZ = useMemo(() => {
    if (isMobile) {
      return Math.min(180, Math.max(90, radiusX * 0.48));
    }
    return Math.min(320, Math.max(140, radiusX * 0.52));
  }, [isMobile, radiusX]);

  // Navigation handlers
  const rotateNext = useCallback(() => {
    setCurrentAngle((prev) => {
      const nearest = Math.round(prev / anglePerItem);
      return (nearest - 1) * anglePerItem;
    });
  }, [anglePerItem]);

  const rotatePrev = useCallback(() => {
    setCurrentAngle((prev) => {
      const nearest = Math.round(prev / anglePerItem);
      return (nearest + 1) * anglePerItem;
    });
  }, [anglePerItem]);

  const rotateToItem = useCallback(
    (itemIndex: number) => {
      const currentSlot = Math.round(currentAngle / anglePerItem);
      const activeIndex = ((-currentSlot % itemCount) + itemCount) % itemCount;
      let diff = itemIndex - activeIndex;
      if (diff > itemCount / 2) diff -= itemCount;
      if (diff < -itemCount / 2) diff += itemCount;
      setCurrentAngle((currentSlot - diff) * anglePerItem);
    },
    [anglePerItem, currentAngle, itemCount],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartTimeRef.current = Date.now();
    hasDraggedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Only track if pointer is actively held down (avoids any hover rotation)
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - dragStartXRef.current;
    const deltaY = e.clientY - dragStartYRef.current;
    if (Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
      hasDraggedRef.current = true;
    }
    // Note: We deliberately do NOT update currentAngle here
    // Cards do NOT rotate with cursor movement!
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    const deltaX = e.clientX - dragStartXRef.current;
    const deltaY = e.clientY - dragStartYRef.current;
    const elapsed = Date.now() - dragStartTimeRef.current;

    // Trigger swipe advance ONLY upon releasing a deliberate gesture (> 40px in < 800ms)
    if (hasDraggedRef.current && Math.abs(deltaX) > 40 && elapsed < 800) {
      if (deltaX < 0) {
        rotateNext();
      } else {
        rotatePrev();
      }
      return;
    }

    // Small movement is considered a tap
    if (Math.hypot(deltaX, deltaY) < 15) {
      hasDraggedRef.current = false;
    }
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY))
      return;

    const now = performance.now();
    const gesture = wheelGesture.current;
    if (now - gesture.lastAt > 160) gesture.delta = 0;
    gesture.lastAt = now;
    if (now - gesture.rotatedAt < 650) return;

    gesture.delta += event.deltaX * (event.deltaMode === 1 ? 16 : 1);
    if (Math.abs(gesture.delta) < 40) return;
    if (gesture.delta > 0) rotateNext();
    else rotatePrev();
    gesture.delta = 0;
    gesture.rotatedAt = now;
  };

  return (
    <section
      ref={trackRef}
      className={styles.heroWindow}
      aria-label="Featured dishes"
      aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          if (event.key === "ArrowLeft") rotatePrev();
          else rotateNext();
        }
      }}
    >
      {/* 3D Spherical Stage */}
      <div
        className={styles.stageWrapper}
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onPointerCancel={() => {
          isPointerDownRef.current = false;
          hasDraggedRef.current = false;
        }}
      >
        {/* Ambient Spherical Lighting */}
        <div className={styles.ambientGlow} />
        <div className={styles.floorShadow} />

        {/* 3D Carousel Stage */}
        <div className={styles.carouselStage}>
          {bestsellers.map((item, index) => {
            const meta = POSTER_METAS[item.id] || {
              line1: item.name.split(" ")[0] || "CHEF",
              scriptLine: "Special",
              line2: item.name.split(" ").slice(1).join(" ") || "BITE",
              watermarkWords: ["CRAFTED", "FRESH", "KITCHEN"],
            };

            const baseAngle = index * anglePerItem;

            // Normalized relative angle: -180° to +180°
            let relAngle = (baseAngle + currentAngle) % 360;
            if (relAngle > 180) relAngle -= 360;
            if (relAngle < -180) relAngle += 360;

            const absAngle = Math.abs(relAngle);

            // ONLY 3 VISIBLE AT ONCE:
            // Items around the back (> 88°) are hidden completely
            const isVisible = absAngle <= 88;
            const isCenter = absAngle < 36;
            const isSide = isVisible && !isCenter;

            // 3D Spherical Coordinates
            const rad = (relAngle * Math.PI) / 180;
            const x = Math.sin(rad) * radiusX;
            const z = Math.cos(rad) * radiusZ - radiusZ; // Front is 0, sides are negative
            const y = (1 - Math.cos(rad)) * 14;
            const rotateY = -relAngle * 0.42;
            const rotateX = (1 - Math.cos(rad)) * 2.5;

            // Center card is scaled, side cards shrink down gracefully
            const maxScale = isMobile ? 1.0 : 1.14;
            const minScale = isMobile ? 0.72 : 0.78;
            const scale =
              maxScale - Math.min(1, absAngle / 72) * (maxScale - minScale);

            // Smooth opacity
            let opacity = 0;
            if (isVisible) {
              if (isMobile) {
                opacity = isCenter
                  ? 1
                  : Math.max(0.3, 0.7 - (absAngle / 88) * 0.4);
              } else {
                opacity =
                  absAngle <= 60 ? 1 : Math.max(0, 1 - (absAngle - 60) / 25);
              }
            }

            const zIndex = isVisible ? Math.round(1000 + z) : 0;

            return (
              <div
                key={item.id}
                className={`${styles.card3D} ${
                  isCenter ? styles.cardActive : isSide ? styles.cardSide : ""
                }`}
                style={{
                  transform: `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(
                    1,
                  )}px, ${z.toFixed(1)}px) rotateY(${rotateY.toFixed(
                    1,
                  )}deg) rotateX(${rotateX.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
                  opacity: opacity.toFixed(2),
                  zIndex,
                  pointerEvents: isVisible ? "auto" : "none",
                  visibility: isVisible ? "visible" : "hidden",
                }}
                onClick={() => {
                  if (hasDraggedRef.current) return;
                  if (!isCenter) {
                    rotateToItem(index);
                  } else {
                    rotateNext();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!isCenter) {
                      rotateToItem(index);
                    } else {
                      rotateNext();
                    }
                  }
                }}
                tabIndex={isVisible ? 0 : -1}
                role="group"
                aria-label={`${item.name} - ${formatCurrency(item.price)}`}
              >
                {/* Side Overlay for Depth */}
                {isSide && <div className={styles.cardSideOverlay} />}

                {/* Watermark Hollow Typography in Background */}
                <div className={styles.watermarkText} aria-hidden="true">
                  <span className={styles.watermarkWord}>
                    {meta.watermarkWords[0]}
                  </span>
                  <span className={styles.watermarkWord}>
                    {meta.watermarkWords[1]}
                  </span>
                  <span className={styles.watermarkWord}>
                    {meta.watermarkWords[2]}
                  </span>
                </div>

                {/* Left Poster Content Area */}
                <div className={styles.contentArea}>
                  {/* Big Stylized Typography */}
                  <div className={styles.titleGroup}>
                    <span className={styles.titleLine1}>{meta.line1}</span>
                    <span className={styles.titleScriptLine}>
                      {meta.scriptLine}
                    </span>
                    <span className={styles.titleLine2}>{meta.line2}</span>
                    <MintLeaf className={styles.leafIcon} />
                  </div>

                  {/* Flavor Description */}
                  <p className={styles.cardDescription}>{item.description}</p>

                  {/* ORDER NOW / Add to Cart Pill Button */}
                  {isCenter ? (
                    <button
                      type="button"
                      className={styles.ctaWrapper}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.detail === 0 || !hasDraggedRef.current)
                          onAddToCart(item);
                      }}
                      aria-label={`Add to cart: ${item.name} for ${formatCurrency(item.price)}`}
                    >
                      <span className={styles.ctaText}>ADD TO CART</span>
                    </button>
                  ) : (
                    <span className={styles.focusHint}>Tap to Center</span>
                  )}
                </div>

                {/* Right Area: HUGE 3D Product & Floating Price Bubble */}
                <div className={styles.productArea}>
                  <MintLeaf className={styles.floatingMint1} />

                  {/* 3D Round Skillet/Plate Frame */}
                  <div className={styles.dishFrame}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={styles.productImage}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <MintLeaf className={styles.floatingMint2} />

                  {/* Floating Speech-Bubble Price Tag */}
                  <div className={styles.speechBubblePrice}>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
};
