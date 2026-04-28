/**
 * Tests for the SubscriptionForm component.
 * Covers default rendering, validation, submission, custom fields,
 * headless mode, loading state, error state, and success state.
 * @module components/__tests__/SubscriptionForm.test
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionForm } from '../SubscriptionForm';
import type { CustomFieldConfig } from '../SubscriptionForm';

// ---------------------------------------------------------------------------
// Mock useSubscribe hook
// ---------------------------------------------------------------------------

const mockSubscribe = vi.fn<(email: string) => Promise<void>>();
const mockReset = vi.fn();

let mockIsLoading = false;
let mockIsSuccess = false;
let mockError: Error | null = null;

vi.mock('../../hooks/useSubscribe.js', () => ({
  useSubscribe: () => ({
    subscribe: mockSubscribe,
    isLoading: mockIsLoading,
    isSuccess: mockIsSuccess,
    error: mockError,
    reset: mockReset,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset all mocks and state before each test */
function resetMockState(): void {
  mockSubscribe.mockReset();
  mockSubscribe.mockResolvedValue(undefined);
  mockReset.mockReset();
  mockIsLoading = false;
  mockIsSuccess = false;
  mockError = null;
}

/** A comprehensive set of custom field configs covering every kind */
const allKindsFields: CustomFieldConfig[] = [
  { key: 'firstName', display: 'First Name', kind: 'string', placeholder: 'Jane' },
  { key: 'age', display: 'Age', kind: 'integer', required: true },
  { key: 'rating', display: 'Rating', kind: 'double' },
  { key: 'newsletter', display: 'Newsletter Opt-in', kind: 'boolean' },
  { key: 'birthDate', display: 'Birth Date', kind: 'date' },
  { key: 'appointmentTime', display: 'Appointment Time', kind: 'datetime' },
  {
    key: 'plan',
    display: 'Plan',
    kind: 'list',
    options: ['Free', 'Pro', 'Enterprise'],
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SubscriptionForm', () => {
  beforeEach(() => {
    resetMockState();
  });

  // ---- Default Render ----
  describe('default render', () => {
    it('renders an email input and a submit button', () => {
      render(<SubscriptionForm />);

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeDefined();
      expect(emailInput.getAttribute('type')).toBe('email');

      const submitBtn = screen.getByRole('button', { name: 'Subscribe' });
      expect(submitBtn).toBeDefined();
    });

    it('uses custom submitLabel and emailPlaceholder', () => {
      render(
        <SubscriptionForm
          submitLabel="Join Now"
          emailPlaceholder="you@example.com"
        />,
      );

      expect(screen.getByRole('button', { name: 'Join Now' })).toBeDefined();
      expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
    });
  });

  // ---- Email Validation ----
  describe('email validation', () => {
    it('shows an error for an empty email', async () => {
      const user = userEvent.setup();
      render(<SubscriptionForm />);

      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      expect(screen.getByRole('alert').textContent).toBe(
        'Please enter a valid email address',
      );
      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('shows an error for an email without @', async () => {
      const user = userEvent.setup();
      render(<SubscriptionForm />);

      await user.type(screen.getByLabelText('Email'), 'notanemail');
      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      expect(screen.getByRole('alert').textContent).toBe(
        'Please enter a valid email address',
      );
    });

    it('shows an error for an email without a dot after @', async () => {
      const user = userEvent.setup();
      render(<SubscriptionForm />);

      await user.type(screen.getByLabelText('Email'), 'user@localhost');
      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      expect(screen.getByRole('alert').textContent).toBe(
        'Please enter a valid email address',
      );
    });

    it('accepts a valid email address', async () => {
      const user = userEvent.setup();
      render(<SubscriptionForm />);

      await user.type(screen.getByLabelText('Email'), 'user@example.com');
      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      expect(mockSubscribe).toHaveBeenCalledWith(expect.objectContaining({ email: 'user@example.com' }));
    });
  });

  // ---- Successful Submission ----
  describe('successful submission', () => {
    it('shows the default success message', () => {
      mockIsSuccess = true;
      render(<SubscriptionForm />);

      expect(screen.getByRole('status').textContent).toBe(
        'Thanks for subscribing!',
      );
    });

    it('shows a custom success message', () => {
      mockIsSuccess = true;
      render(<SubscriptionForm successMessage="You are in!" />);

      expect(screen.getByRole('status').textContent).toBe('You are in!');
    });
  });

  // ---- Error State ----
  describe('error state', () => {
    it('displays hook error message', () => {
      mockError = new Error('Network failure');
      render(<SubscriptionForm />);

      expect(screen.getByRole('alert').textContent).toBe('Network failure');
    });
  });

  // ---- Loading State ----
  describe('loading state', () => {
    it('disables the submit button during loading', () => {
      mockIsLoading = true;
      render(<SubscriptionForm />);

      const button = screen.getByRole('button');
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.textContent).toBe('Submitting...');
    });

    it('disables the email input during loading', () => {
      mockIsLoading = true;
      render(<SubscriptionForm />);

      expect(
        (screen.getByLabelText('Email') as HTMLInputElement).disabled,
      ).toBe(true);
    });
  });

  // ---- Custom Field Rendering ----
  describe('custom field rendering', () => {
    it('renders a text input for string kind', () => {
      render(
        <SubscriptionForm
          customFields={[
            { key: 'name', display: 'Name', kind: 'string', placeholder: 'Jane' },
          ]}
        />,
      );

      const input = screen.getByLabelText('Name') as HTMLInputElement;
      expect(input.type).toBe('text');
      expect(input.placeholder).toBe('Jane');
    });

    it('renders a number input for integer kind', () => {
      render(
        <SubscriptionForm
          customFields={[{ key: 'age', display: 'Age', kind: 'integer' }]}
        />,
      );

      const input = screen.getByLabelText('Age') as HTMLInputElement;
      expect(input.type).toBe('number');
      expect(input.step).toBe('1');
    });

    it('renders a number input for double kind', () => {
      render(
        <SubscriptionForm
          customFields={[{ key: 'rating', display: 'Rating', kind: 'double' }]}
        />,
      );

      const input = screen.getByLabelText('Rating') as HTMLInputElement;
      expect(input.type).toBe('number');
      expect(input.step).toBe('any');
    });

    it('renders a checkbox for boolean kind', () => {
      render(
        <SubscriptionForm
          customFields={[
            { key: 'newsletter', display: 'Newsletter Opt-in', kind: 'boolean' },
          ]}
        />,
      );

      const input = screen.getByLabelText('Newsletter Opt-in') as HTMLInputElement;
      expect(input.type).toBe('checkbox');
    });

    it('renders a date input for date kind', () => {
      render(
        <SubscriptionForm
          customFields={[
            { key: 'birthDate', display: 'Birth Date', kind: 'date' },
          ]}
        />,
      );

      const input = screen.getByLabelText('Birth Date') as HTMLInputElement;
      expect(input.type).toBe('date');
    });

    it('renders a datetime-local input for datetime kind', () => {
      render(
        <SubscriptionForm
          customFields={[
            { key: 'appt', display: 'Appointment', kind: 'datetime' },
          ]}
        />,
      );

      const input = screen.getByLabelText('Appointment') as HTMLInputElement;
      expect(input.type).toBe('datetime-local');
    });

    it('renders a select for list kind with options', () => {
      render(
        <SubscriptionForm
          customFields={[
            {
              key: 'plan',
              display: 'Plan',
              kind: 'list',
              options: ['Free', 'Pro', 'Enterprise'],
            },
          ]}
        />,
      );

      const select = screen.getByLabelText('Plan') as HTMLSelectElement;
      expect(select.tagName).toBe('SELECT');

      const options = within(select).getAllByRole('option');
      // placeholder option + 3 values
      expect(options.length).toBe(4);
      expect(options[1].textContent).toBe('Free');
      expect(options[2].textContent).toBe('Pro');
      expect(options[3].textContent).toBe('Enterprise');
    });

    it('renders all kinds at once', () => {
      render(<SubscriptionForm customFields={allKindsFields} />);

      expect(screen.getByLabelText('First Name')).toBeDefined();
      expect(screen.getByLabelText('Age')).toBeDefined();
      expect(screen.getByLabelText('Rating')).toBeDefined();
      expect(screen.getByLabelText('Newsletter Opt-in')).toBeDefined();
      expect(screen.getByLabelText('Birth Date')).toBeDefined();
      expect(screen.getByLabelText('Appointment Time')).toBeDefined();
      expect(screen.getByLabelText('Plan')).toBeDefined();
    });
  });

  // ---- Headless Mode ----
  describe('headless mode (renderForm)', () => {
    it('calls renderForm with the expected props', () => {
      const renderFormSpy = vi.fn(() => <div data-testid="custom-form" />);

      render(<SubscriptionForm renderForm={renderFormSpy} />);

      expect(renderFormSpy).toHaveBeenCalledTimes(1);

      const props = renderFormSpy.mock.calls[0][0];
      expect(typeof props.email).toBe('string');
      expect(typeof props.setEmail).toBe('function');
      expect(typeof props.customFieldValues).toBe('object');
      expect(typeof props.setCustomField).toBe('function');
      expect(typeof props.handleSubmit).toBe('function');
      expect(typeof props.isLoading).toBe('boolean');
      expect(typeof props.isSuccess).toBe('boolean');
      expect(typeof props.reset).toBe('function');
      // error may be null
      expect(props.error).toBeNull();
    });

    it('renders the custom form content', () => {
      render(
        <SubscriptionForm
          renderForm={() => <p>Custom form here</p>}
        />,
      );

      expect(screen.getByText('Custom form here')).toBeDefined();
      // Default form elements should NOT be present
      expect(screen.queryByLabelText('Email')).toBeNull();
    });

    it('does not render the default submit button', () => {
      render(
        <SubscriptionForm
          renderForm={() => <div />}
        />,
      );

      expect(screen.queryByRole('button', { name: 'Subscribe' })).toBeNull();
    });
  });

  // ---- Required Field Validation ----
  describe('required field validation', () => {
    it('shows an error when a required string field is empty', async () => {
      const user = userEvent.setup();
      render(
        <SubscriptionForm
          customFields={[
            { key: 'company', display: 'Company', kind: 'string', required: true },
          ]}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'user@example.com');
      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      expect(screen.getByRole('alert').textContent).toBe(
        'Company is required',
      );
      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('shows an error when a required list field has no selection', async () => {
      const user = userEvent.setup();
      render(
        <SubscriptionForm
          customFields={[
            {
              key: 'plan',
              display: 'Plan',
              kind: 'list',
              required: true,
              options: ['Free', 'Pro'],
            },
          ]}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'user@example.com');
      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      expect(screen.getByRole('alert').textContent).toBe('Plan is required');
    });

    it('does not block submission when required boolean field is unchecked', async () => {
      const user = userEvent.setup();
      render(
        <SubscriptionForm
          customFields={[
            { key: 'agree', display: 'Agree', kind: 'boolean', required: true },
          ]}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'user@example.com');
      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      // Boolean fields are always valid (false is valid), so subscribe should be called
      expect(mockSubscribe).toHaveBeenCalledWith(expect.objectContaining({ email: 'user@example.com' }));
    });

    it('passes validation when required fields are filled', async () => {
      const user = userEvent.setup();
      render(
        <SubscriptionForm
          customFields={[
            { key: 'company', display: 'Company', kind: 'string', required: true },
          ]}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'user@example.com');
      await user.type(screen.getByLabelText('Company'), 'Acme Inc');
      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      expect(mockSubscribe).toHaveBeenCalledWith(expect.objectContaining({ email: 'user@example.com' }));
    });

    it('shows an error when a required number field is empty', async () => {
      const user = userEvent.setup();
      render(
        <SubscriptionForm
          customFields={[
            { key: 'age', display: 'Age', kind: 'integer', required: true },
          ]}
        />,
      );

      await user.type(screen.getByLabelText('Email'), 'user@example.com');
      await user.click(screen.getByRole('button', { name: 'Subscribe' }));

      expect(screen.getByRole('alert').textContent).toBe('Age is required');
    });
  });

  // ---- CSS class props ----
  describe('className props', () => {
    it('applies className to the form element', () => {
      const { container } = render(
        <SubscriptionForm className="my-form" />,
      );

      const form = container.querySelector('form');
      expect(form?.classList.contains('my-form')).toBe(true);
    });

    it('applies buttonClassName to the submit button', () => {
      render(<SubscriptionForm buttonClassName="my-btn" />);

      const button = screen.getByRole('button', { name: 'Subscribe' });
      expect(button.classList.contains('my-btn')).toBe(true);
    });
  });
});
