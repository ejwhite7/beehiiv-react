/**
 * TierBadge - a component that displays a publication tier as a
 * visual badge, or delegates rendering to a headless render prop.
 *
 * Accepts a {@link Tier} object directly and renders its name alongside
 * a `data-tier-type` attribute indicating whether the tier is free or premium.
 *
 * @module components/TierBadge
 */

import React from 'react';

import type { Tier } from '../types/tier.js';

/**
 * Props for the {@link TierBadge} component.
 */
export interface TierBadgeProps {
  /** The tier object to display */
  tier: Tier;
  /** Optional CSS class name applied to the badge wrapper element */
  className?: string;
  /**
   * Headless render prop. When provided, the component renders no default UI --
   * it passes the tier to this function and renders whatever is returned.
   * Use this for fully custom badge designs.
   */
  render?: (tier: Tier) => React.ReactNode;
}

/**
 * Displays a tier name/type badge or delegates rendering via `render` prop.
 *
 * **Default behaviour:**
 * Renders a `<span>` containing the tier name, with a `data-tier-type`
 * attribute set to `"free"` or `"premium"` for CSS styling hooks.
 * An `aria-label` is included for accessibility.
 *
 * **Headless mode:** When the `render` prop is provided, the component
 * passes the full {@link Tier} object to the render function -- no
 * default UI is rendered, giving consumers full control over presentation.
 *
 * @param props - Component props including the tier object and optional overrides
 * @returns A React element wrapping the badge content
 *
 * @example
 * ```tsx
 * // Default badge
 * <TierBadge tier={tier} className="my-badge" />
 *
 * // Headless mode with custom render
 * <TierBadge
 *   tier={tier}
 *   render={(t) => (
 *     <div className={t.type === 'premium' ? 'gold' : 'gray'}>
 *       {t.name} - {t.type}
 *     </div>
 *   )}
 * />
 * ```
 */
export function TierBadge(props: TierBadgeProps): React.JSX.Element {
  const { tier, className, render } = props;

  // --- Headless render prop ---
  if (render) {
    return <>{render(tier)}</>;
  }

  // --- Default badge rendering ---
  return (
    <span
      className={className}
      data-tier-badge=""
      data-tier-type={tier.type}
      aria-label={`${tier.name} tier (${tier.type})`}
    >
      <span>{tier.name}</span>
    </span>
  );
}
