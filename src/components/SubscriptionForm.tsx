/**
 * SubscriptionForm - a drop-in email subscription form component.
 * Handles form state, validation, submission, and success/error UI.
 * Supports custom fields, headless rendering via render props, and
 * full className-based style overrides.
 * @module components/SubscriptionForm
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useSubscribe } from '../hooks/useSubscribe.js';
import type { CustomFieldKind } from '../types/custom-field.js';
import type { SubscriptionInfo } from '../types/subscription.js';

/**
 * Configuration for a single custom field to be rendered in the form.
 * Describes the field's key, label, data type, and validation rules.
 */
export interface CustomFieldConfig {
  /** Matches the generated type key (camelCase display name) */
  key: string;
  /** Label shown to the user */
  display: string;
  /** The data type of the custom field */
  kind: CustomFieldKind;
  /** Whether this field is required for submission */
  required?: boolean;
  /** Available values for list-kind fields */
  options?: string[];
  /** Placeholder text for the input */
  placeholder?: string;
}

/**
 * Props for the SubscriptionForm component.
 *
 * @typeParam TCustomFields - The shape of the custom fields object.
 *   Defaults to `Record<string, unknown>`.
 */
export interface SubscriptionFormProps<TCustomFields = Record<string, unknown>> {
  /** The publication ID. Can be inferred from BeehiivProvider context. */
  publicationId?: string;

  /** Custom field configuration. When provided, the form renders inputs for each field. */
  customFields?: CustomFieldConfig[];

  /** Callback fired after a successful subscription */
  onSuccess?: (subscription: SubscriptionInfo) => void;

  /** Callback fired when a subscription error occurs */
  onError?: (error: Error) => void;

  /** Additional CSS class for the form wrapper element */
  className?: string;

  /** CSS class applied to every input element */
  inputClassName?: string;

  /** CSS class applied to the submit button */
  buttonClassName?: string;

  /** CSS class applied to the error message container */
  errorClassName?: string;

  /** Text for the submit button (default: "Subscribe") */
  submitLabel?: string;

  /** Placeholder text for the email input (default: "Enter your email") */
  emailPlaceholder?: string;

  /** Message displayed on successful subscription (default: "Thanks for subscribing!") */
  successMessage?: string;

  /** UTM source for attribution tracking */
  utmSource?: string;

  /** UTM medium for attribution tracking */
  utmMedium?: string;

  /** UTM campaign for attribution tracking */
  utmCampaign?: string;

  /**
   * Render prop for headless mode. When provided, the default UI is not rendered.
   * Instead, this function receives all form state and handlers for full custom rendering.
   */
  renderForm?: (props: RenderFormProps<TCustomFields>) => React.ReactNode;
}

/**
 * Props passed to the `renderForm` render prop for headless rendering.
 * Provides all state and handlers needed to build a fully custom subscription form.
 *
 * @typeParam TCustomFields - The shape of the custom fields object.
 */
export interface RenderFormProps<TCustomFields> {
  /** Current email input value */
  email: string;

  /** Setter for the email input value */
  setEmail: (v: string) => void;

  /** Current custom field values */
  customFieldValues: Partial<TCustomFields>;

  /** Set a single custom field value by key */
  setCustomField: (key: string, value: unknown) => void;

  /** Form submission handler — attach to `<form onSubmit>` */
  handleSubmit: (e: React.FormEvent) => void;

  /** Whether a subscription request is in progress */
  isLoading: boolean;

  /** Whether the last subscription was successful */
  isSuccess: boolean;

  /** Error from the last subscription attempt, if any */
  error: Error | null;

  /** Reset the form to its initial state */
  reset: () => void;
}

/** Regular expression for basic email format validation (RFC 5322-ish) */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address format.
 *
 * @param email - The email string to validate
 * @returns `true` if the email is valid
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate that all required custom fields have non-empty values,
 * and that numeric fields contain valid numbers.
 *
 * @param fields - The custom field configuration array
 * @param values - The current custom field values
 * @returns An error message string, or `null` if valid
 */
function validateCustomFields(
  fields: CustomFieldConfig[],
  values: Record<string, unknown>,
): string | null {
  for (const field of fields) {
    const value = values[field.key];

    if (field.required) {
      if (field.kind === 'boolean') {
        // Booleans are always valid (false is a valid value)
        continue;
      }
      if (value === undefined || value === null || value === '') {
        return `${field.display} is required`;
      }
    }

    // Validate number fields when a value is present
    if (
      (field.kind === 'integer' || field.kind === 'double') &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      const num = Number(value);
      if (isNaN(num)) {
        return `${field.display} must be a valid number`;
      }
    }
  }

  return null;
}

/**
 * A ready-to-use email subscription form for beehiiv publications.
 *
 * Renders an email input, optional custom field inputs, and a submit button.
 * Handles client-side validation, loading states, and success/error display.
 *
 * Supports headless rendering via the `renderForm` prop for fully custom UIs.
 *
 * @typeParam TCustomFields - The shape of the custom fields object
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SubscriptionForm
 *   publicationId="pub_xxxxx"
 *   submitLabel="Join Newsletter"
 *   utmSource="website"
 * />
 *
 * // With custom fields
 * <SubscriptionForm
 *   customFields={[
 *     { key: 'firstName', display: 'First Name', kind: 'string', required: true },
 *     { key: 'role', display: 'Role', kind: 'list', options: ['Developer', 'Designer'] },
 *   ]}
 * />
 *
 * // Headless mode
 * <SubscriptionForm
 *   renderForm={({ email, setEmail, handleSubmit, isLoading }) => (
 *     <form onSubmit={handleSubmit}>
 *       <input value={email} onChange={e => setEmail(e.target.value)} />
 *       <button disabled={isLoading}>Go</button>
 *     </form>
 *   )}
 * />
 * ```
 */
export function SubscriptionForm<
  TCustomFields = Record<string, unknown>,
>(props: SubscriptionFormProps<TCustomFields>): React.JSX.Element {
  const {
    customFields = [],
    onSuccess,
    onError,
    className,
    inputClassName,
    buttonClassName,
    errorClassName,
    submitLabel = 'Subscribe',
    emailPlaceholder = 'Enter your email',
    successMessage = 'Thanks for subscribing!',
    utmSource,
    utmMedium,
    utmCampaign,
    renderForm,
  } = props;

  const [email, setEmail] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, unknown>
  >({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const hookResult = useSubscribe({
    onSuccess: onSuccess as ((data: unknown) => void) | undefined,
    onError,
  });

  const { subscribe, isLoading, isSuccess, error: hookError, reset: hookReset } = hookResult;

  /** Combined error from hook or client-side validation */
  const error = useMemo(() => {
    if (validationError) return new Error(validationError);
    return hookError;
  }, [validationError, hookError]);

  /**
   * Set a single custom field value by key.
   *
   * @param key - The custom field key
   * @param value - The value to set
   */
  const setCustomField = useCallback((key: string, value: unknown) => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Reset the form to its initial state.
   */
  const reset = useCallback(() => {
    setEmail('');
    setCustomFieldValues({});
    setValidationError(null);
    hookReset();
  }, [hookReset]);

  /**
   * Handle form submission. Validates inputs then delegates to the hook.
   *
   * @param e - The form submission event
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValidationError(null);

      // Validate email format
      if (!isValidEmail(email)) {
        setValidationError('Please enter a valid email address');
        return;
      }

      // Validate required custom fields
      const fieldError = validateCustomFields(customFields, customFieldValues);
      if (fieldError) {
        setValidationError(fieldError);
        return;
      }

      void subscribe({
        email,
        customFields: customFieldValues,
        utmSource,
        utmMedium,
        utmCampaign,
      });
    },
    [email, customFields, customFieldValues, subscribe],
  );

  // Headless mode: delegate all rendering to the consumer
  if (renderForm) {
    return (
      <>
        {renderForm({
          email,
          setEmail,
          customFieldValues: customFieldValues as Partial<TCustomFields>,
          setCustomField,
          handleSubmit,
          isLoading,
          isSuccess,
          error,
          reset,
        })}
      </>
    );
  }

  // Success state: replace form with success message
  if (isSuccess) {
    return (
      <div className={className} role="status" aria-live="polite">
        <p>{successMessage}</p>
      </div>
    );
  }

  return (
    <form className={className} onSubmit={handleSubmit} noValidate>
      {/* Email input */}
      <div>
        <label htmlFor="beehiiv-email">Email</label>
        <input
          id="beehiiv-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder={emailPlaceholder}
          required
          aria-required="true"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'beehiiv-form-error' : undefined}
          autoComplete="email"
          className={inputClassName}
          disabled={isLoading}
        />
      </div>

      {/* Custom field inputs */}
      {customFields.map((field) => (
        <div key={field.key}>
          <label htmlFor={`beehiiv-cf-${field.key}`}>{field.display}</label>
          {renderCustomFieldInput(field, customFieldValues, setCustomField, inputClassName, isLoading, error)}
        </div>
      ))}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className={buttonClassName}
        aria-busy={isLoading}
      >
        {isLoading ? 'Submitting...' : submitLabel}
      </button>

      {/* Error display */}
      {/* Error display linked via aria-describedby on form fields */}
      {error && (
        <div id="beehiiv-form-error" role="alert" className={errorClassName} style={{ color: 'red' }}>
          {error.message}
        </div>
      )}
    </form>
  );
}

/**
 * Render the appropriate input element for a custom field based on its kind.
 *
 * @param field - The custom field configuration
 * @param values - Current field values
 * @param setField - Setter for updating a field value
 * @param inputClassName - Optional CSS class for the input
 * @param disabled - Whether the input should be disabled
 * @returns A React element for the custom field input
 */
function renderCustomFieldInput(
  field: CustomFieldConfig,
  values: Record<string, unknown>,
  setField: (key: string, value: unknown) => void,
  inputClassName: string | undefined,
  disabled: boolean,
  formError: Error | null,
): React.JSX.Element {
  const id = `beehiiv-cf-${field.key}`;
  const value = values[field.key];

  switch (field.kind) {
    case 'boolean':
      return (
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => setField(field.key, e.target.checked)}
          className={inputClassName}
          disabled={disabled}
          aria-required={field.required ? 'true' : undefined}
          aria-invalid={formError?.message?.includes(field.display) ? 'true' : undefined}
          aria-describedby={formError ? 'beehiiv-form-error' : undefined}
          autoComplete="off"
        />
      );

    case 'integer':
    case 'double':
      return (
        <input
          id={id}
          type="number"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => {
            // Store a real number so the API receives the correct type;
            // keep the raw string when empty (controlled input) or
            // non-numeric (so validation can report it).
            const raw = e.target.value;
            const num = Number(raw);
            setField(field.key, raw === '' || Number.isNaN(num) ? raw : num);
          }}
          placeholder={field.placeholder}
          step={field.kind === 'double' ? 'any' : '1'}
          className={inputClassName}
          disabled={disabled}
          required={field.required}
          aria-required={field.required ? 'true' : undefined}
          aria-invalid={formError?.message?.includes(field.display) ? 'true' : undefined}
          aria-describedby={formError ? 'beehiiv-form-error' : undefined}
          autoComplete="off"
        />
      );

    case 'date':
      return (
        <input
          id={id}
          type="date"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => setField(field.key, e.target.value)}
          className={inputClassName}
          disabled={disabled}
          required={field.required}
          aria-required={field.required ? 'true' : undefined}
          aria-invalid={formError?.message?.includes(field.display) ? 'true' : undefined}
          aria-describedby={formError ? 'beehiiv-form-error' : undefined}
          autoComplete="off"
        />
      );

    case 'datetime':
      return (
        <input
          id={id}
          type="datetime-local"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => setField(field.key, e.target.value)}
          className={inputClassName}
          disabled={disabled}
          required={field.required}
          aria-required={field.required ? 'true' : undefined}
          aria-invalid={formError?.message?.includes(field.display) ? 'true' : undefined}
          aria-describedby={formError ? 'beehiiv-form-error' : undefined}
          autoComplete="off"
        />
      );

    case 'list':
      return (
        <select
          id={id}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => setField(field.key, e.target.value)}
          className={inputClassName}
          disabled={disabled}
          required={field.required}
          aria-required={field.required ? 'true' : undefined}
          aria-invalid={formError?.message?.includes(field.display) ? 'true' : undefined}
          aria-describedby={formError ? 'beehiiv-form-error' : undefined}
          autoComplete="off"
        >
          <option value="">{field.placeholder ?? `Select ${field.display}`}</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case 'string':
    default:
      return (
        <input
          id={id}
          type="text"
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          className={inputClassName}
          disabled={disabled}
          required={field.required}
          aria-required={field.required ? 'true' : undefined}
          aria-invalid={formError?.message?.includes(field.display) ? 'true' : undefined}
          aria-describedby={formError ? 'beehiiv-form-error' : undefined}
          autoComplete="off"
        />
      );
  }
}
