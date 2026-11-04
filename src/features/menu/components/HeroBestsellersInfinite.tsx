import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MenuItem } from '../types/menuTypes';
import { formatCurrency } from '../../../utils/formatters';
import styles from './HeroBestsellersInfinite.module.css';

interface PosterItemMeta {
  line1: string;
  scriptLine: string;
  line2: string;
  promoTag: string;
  watermarkWords: [string, string, string];
}

const POSTER_METAS: Record<string, PosterItemMeta> = {
  'sb-pizza-01': {
    line1: 'PANEER',
    scriptLine: 'Makhana',
    line2: 'PIZZA',
    promoTag: '15% OFF',
    watermarkWords: ['PIZZA', 'PANEER', 'PANEER'],
  },
  'sb-01': {
    line1: 'DOUBLE',
    scriptLine: 'Smash',
    line2: 'BURGER',
    promoTag: 'HOT & FRESH',
    watermarkWords: ['BURGER', 'SMASH', 'SMASH'],
  },
  'sb-02': {
    line1: 'CRISPY',
    scriptLine: 'Hot Honey',
    line2: 'CHICKEN',
    promoTag: 'TOP RATED',
    watermarkWords: ['CRISPY', 'HONEY', 'HONEY'],
  },
  'sb-05': {
    line1: 'LOADED',
    scriptLine: 'Truffle',
    line2: 'FRIES',
    promoTag: 'MUST TRY',
    watermarkWords: ['FRIES', 'TRUFFLE', 'LOADED'],
  },
  'sb-08': {
    line1: 'SALTED',
    scriptLine: 'Caramel',
    line2: 'BROWNIE',
    promoTag: 'FRESH BAKED',
    watermarkWords: ['BROWNIE', 'CARAMEL', 'FUDGE'],
  },
};

const DEFAULT_5_BESTSELLERS: MenuItem[] = [
  {
    id: 'sb-pizza-01',
    name: 'Artisanal Woodfired Paneer Tikka Pizza',
    description: 'Hand-stretched sourdough loaded with tandoori paneer, caramelized onions, herbs & melted stretchy mozzarella.',
    price: 269,
    category: 'pizzas',
    dietaryTags: ['veg', 'chef-special'],
    spiceLevel: 'medium',
    imageUrl: '/images/tandoori_paneer_pizza.jpg',
    preparationTimeMinutes: 20,
    calories: 640,
    isPopular: true,
  },
  {
    id: 'sb-01',
    name: 'Soul Fire Smash Burger',
    description: 'Double smashed patties, melted smoked cheddar, caramelized onions, house truffle aioli on a toasted brioche bun.',
    price: 249,
    category: 'burgers',
    dietaryTags: ['non-veg', 'chef-special'],
    spiceLevel: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    preparationTimeMinutes: 18,
    calories: 740,
    isPopular: true,
  },
  {
    id: 'sb-02',
    name: 'Crispy Truffle Hot Honey Chicken Burger',
    description: 'Buttermilk fried crisp chicken thigh, hot honey drizzle, crunchy purple slaw & dill pickles in golden potato bun.',
    price: 279,
    category: 'burgers',
    dietaryTags: ['non-veg', 'chef-special'],
    spiceLevel: 'spicy',
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
    preparationTimeMinutes: 20,
    calories: 680,
    isPopular: true,
  },
  {
    id: 'sb-05',
    name: 'Charcoal Truffle Loaded Fries',
    description: 'Hand-cut double cooked fries dusted with aromatic charcoal sea salt, white truffle oil & shaved parmesan.',
    price: 169,
    category: 'fries',
    dietaryTags: ['veg', 'chef-special'],
    spiceLevel: 'mild',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    preparationTimeMinutes: 12,
    calories: 460,
    isPopular: true,
  },
  {
    id: 'sb-08',
    name: 'Warm Salted Caramel Brownie Skillet Bite',
    description: 'Rich dark chocolate fudge brownie infused with espresso, warm salted caramel sauce & toasted pecans.',
    price: 149,
    category: 'desserts',
    dietaryTags: ['veg'],
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    preparationTimeMinutes: 8,
    calories: 420,
    isPopular: true,
  },
];

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
      fill="#4ADE80"
      fillOpacity="0.9"
    />
    <path
      d="M6 19C10.5 15.5 14.5 11 18.5 6"
      stroke="#166534"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// Dish line-art icons removed per design update

export interface HeroBestsellersInfiniteProps {
  items?: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export const HeroBestsellersInfinite: React.FC<HeroBestsellersInfiniteProps> = ({
  items,
  onAddToCart,
}) => {
  const bestsellers = useMemo(() => {
    if (items && items.length >= 5) {
      const popular = items.filter((i) => i.isPopular);
      if (popular.length >= 5) return popular.slice(0, 5);
      return items.slice(0, 5);
    }
    return DEFAULT_5_BESTSELLERS;
  }, [items]);

  const itemCount = bestsellers.length; // 5 items
  const anglePerItem = 360 / itemCount; // 72 degrees

  // 3D Spherical Rotation State
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(() => Date.now());

  // Reset 30-second countdown on user interaction
  const resetTimer = useCallback(() => {
    setLastInteractionTime(Date.now());
  }, []);

  // Drag tracking refs
  const isPointerDownRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Stage measurement
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(1100);

  useEffect(() => {
    const updateSize = () => {
      if (stageRef.current) {
        setStageWidth(stageRef.current.offsetWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
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
    resetTimer();
    setCurrentAngle((prev) => {
      const nearest = Math.round(prev / anglePerItem);
      return (nearest - 1) * anglePerItem;
    });
  }, [anglePerItem, resetTimer]);

  const rotatePrev = useCallback(() => {
    resetTimer();
    setCurrentAngle((prev) => {
      const nearest = Math.round(prev / anglePerItem);
      return (nearest + 1) * anglePerItem;
    });
  }, [anglePerItem, resetTimer]);

  const rotateToItem = useCallback(
    (itemIndex: number) => {
      resetTimer();
      const currentSlot = Math.round(currentAngle / anglePerItem);
      const activeIndex = ((-currentSlot % itemCount) + itemCount) % itemCount;
      let diff = itemIndex - activeIndex;
      if (diff > 2) diff -= 5;
      if (diff < -2) diff += 5;
      setCurrentAngle((currentSlot - diff) * anglePerItem);
    },
    [anglePerItem, currentAngle, itemCount, resetTimer]
  );

  // Auto-rotation: ONLY moves automatically after every 30 seconds (pauses on hover)
  useEffect(() => {
    if (isHovered) return;
    const AUTO_ROTATE_INTERVAL_MS = 30000; // 30 seconds
    const timer = setInterval(() => {
      setCurrentAngle((prev) => {
        const nearest = Math.round(prev / anglePerItem);
        return (nearest - 1) * anglePerItem;
      });
    }, AUTO_ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isHovered, anglePerItem, lastInteractionTime]);

  // Pointer / Touch handlers: NO rotation with cursor during hover
  // Cards only move on click/tap, intentional swipe release, or the 30s timer
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
      resetTimer();
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

  // Active item index for indicator dots
  const nearestSlot = Math.round(currentAngle / anglePerItem);
  const activeIndex = ((-nearestSlot % itemCount) + itemCount) % itemCount;

  return (
    <section
      className={styles.heroWindow}
      aria-label="Our Best Selling Cloud Kitchen Bites"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Spherical Stage */}
      <div
        className={styles.stageWrapper}
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Ambient Spherical Lighting */}
        <div className={styles.ambientGlow} />
        <div className={styles.floorShadow} />

        {/* Floating 3D Navigation Controls */}
        <button
          type="button"
          className={`${styles.navButton} ${styles.navPrev}`}
          onClick={(e) => {
            e.stopPropagation();
            rotatePrev();
          }}
          aria-label="Previous bestselling bite"
        >
          ‹
        </button>
        <button
          type="button"
          className={`${styles.navButton} ${styles.navNext}`}
          onClick={(e) => {
            e.stopPropagation();
            rotateNext();
          }}
          aria-label="Next bestselling bite"
        >
          ›
        </button>

        {/* 3D Carousel Stage */}
        <div className={styles.carouselStage}>
          {bestsellers.map((item, index) => {
            const meta =
              POSTER_METAS[item.id] || {
                line1: item.name.split(' ')[0] || 'CHEF',
                scriptLine: 'Special',
                line2: item.name.split(' ').slice(1).join(' ') || 'BITE',
                promoTag: '15% OFF',
                watermarkWords: ['CRAFTED', 'FRESH', 'KITCHEN'],
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
            const scale = maxScale - Math.min(1, absAngle / 72) * (maxScale - minScale);

            // Smooth opacity
            let opacity = 0;
            if (isVisible) {
              if (isMobile) {
                opacity = isCenter ? 1 : Math.max(0.3, 0.7 - (absAngle / 88) * 0.4);
              } else {
                opacity = absAngle <= 60 ? 1 : Math.max(0, 1 - (absAngle - 60) / 25);
              }
            }

            const zIndex = isVisible ? Math.round(1000 + z) : 0;

            return (
              <div
                key={item.id}
                className={`${styles.card3D} ${
                  isCenter ? styles.cardActive : isSide ? styles.cardSide : ''
                }`}
                style={{
                  transform: `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(
                    1
                  )}px, ${z.toFixed(1)}px) rotateY(${rotateY.toFixed(
                    1
                  )}deg) rotateX(${rotateX.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
                  opacity: opacity.toFixed(2),
                  zIndex,
                  pointerEvents: isVisible ? 'auto' : 'none',
                  visibility: isVisible ? 'visible' : 'hidden',
                  transition: 'transform 0.55s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.4s ease, filter 0.4s ease',
                }}
                onClick={() => {
                  if (hasDraggedRef.current) return;
                  resetTimer();
                  if (!isCenter) {
                    rotateToItem(index);
                  } else {
                    rotateNext();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    resetTimer();
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
                  <span className={styles.watermarkWord}>{meta.watermarkWords[0]}</span>
                  <span className={styles.watermarkWord}>{meta.watermarkWords[1]}</span>
                  <span className={styles.watermarkWord}>{meta.watermarkWords[2]}</span>
                </div>

                {/* Left Poster Content Area */}
                <div className={styles.contentArea}>
                  {/* Big Stylized Typography */}
                  <div className={styles.titleGroup}>
                    <span className={styles.titleLine1}>{meta.line1}</span>
                    <span className={styles.titleScriptLine}>{meta.scriptLine}</span>
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
                        onAddToCart(item);
                      }}
                      aria-label={`Order ${item.name} for ${formatCurrency(item.price)}`}
                    >
                      <span className={styles.ctaText}>ORDER NOW</span>
                      <span className={styles.ctaPromoTag}>{meta.promoTag}</span>
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
                      loading={isVisible ? 'eager' : 'lazy'}
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

      {/* Indicator Dots & Drag Prompt */}
      <div className={styles.controlsRow}>
        <div className={styles.dotsWrapper}>
          {bestsellers.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === activeIndex ? styles.activeDot : ''}`}
              onClick={() => rotateToItem(i)}
              aria-label={`Rotate to item ${i + 1}`}
            />
          ))}
        </div>
        <span className={styles.swipeHint}>
          ✨ Tap any card to rotate • Auto-rotates every 30s
        </span>
      </div>
    </section>
  );
};
