/**
 * SubscriptionForm - a drop-in email subscription form component.
 * Handles form state, validation, submission, and success/error UI.
 * @module components/SubscriptionForm
 */

import React from 'react';

/** Props for the SubscriptionForm component */
export interface SubscriptionFormProps {
  /** The API endpoint to submit to (default: "/api/beehiiv/subscribe") */
  endpoint?: string;
  /** Placeholder text for the email input (default: "Enter your email") */
  placeholder?: string;
  /** Text for the submit button (default: "Subscribe") */
  buttonText?: string;
  /** Message shown on successful subscription */
  successMessage?: string;
  /** UTM source for attribution */
  utmSource?: string;
  /** UTM medium for attribution */
  utmMedium?: string;
  /** UTM campaign for attribution */
  utmCampaign?: string;
  /** Additional CSS class name for the form wrapper */
  className?: string;
  /** Callback fired on successful subscription */
  onSuccess?: (data: unknown) => void;
  /** Callback fired on subscription error */
  onError?: (error: Error) => void;
}

/**
 * A ready-to-use email subscription form for beehiiv.
 *
 * @example
 * ```tsx
 * <SubscriptionForm
 *   endpoint="/api/beehiiv/subscribe"
 *   buttonText="Join Newsletter"
 *   utmSource="website"
 * />
 * ```
 */
export function SubscriptionForm(_props: SubscriptionFormProps): React.JSX.Element {
  // TODO: Implement form with useSubscribe hook in Stage 2
  void _props;
  throw new Error('Not yet implemented');
}
