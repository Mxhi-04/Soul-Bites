import React from 'react';

export interface ShoppingCartIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  glow?: boolean;
}

export const ShoppingCartIcon: React.FC<ShoppingCartIconProps> = ({
  size = 20,
  color = 'currentColor',
  glow = true,
  className = '',
  style,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        filter: glow
          ? 'drop-shadow(0 0 3px rgba(245, 183, 0, 0.75)) drop-shadow(0 0 8px rgba(245, 183, 0, 0.35))'
          : undefined,
        ...style,
      }}
      {...props}
    >
      {/* Front nose / start hook */}
      <path
        d="M2.5 3.5H5.2L7.4 14.2C7.55 14.95 8.2 15.5 9 15.5H18.2C19 15.5 19.65 14.95 19.8 14.2L21.5 6.2H6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Basket Grid Lines matching wireframe */}
      <line
        x1="6.8"
        y1="10.5"
        x2="20.5"
        y2="10.5"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="11"
        y1="6.5"
        x2="10.2"
        y2="14.8"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="6.5"
        x2="15.5"
        y2="14.8"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Wheels */}
      <circle
        cx="9"
        cy="19.5"
        r="1.8"
        stroke={color}
        strokeWidth="1.8"
      />
      <circle
        cx="17.5"
        cy="19.5"
        r="1.8"
        stroke={color}
        strokeWidth="1.8"
      />
    </svg>
  );
};
