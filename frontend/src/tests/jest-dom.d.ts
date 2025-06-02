/// <reference types="vitest" />

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeEmpty(): R;
      toBeEmptyDOMElement(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: Record<string, any>): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value?: string | string[] | number): R;
      toHaveDisplayValue(value: string | string[]): R;
      toBeInTheDOM(): R;
    }
  }
}

// For Vitest
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): T;
    toBeVisible(): T;
    toBeDisabled(): T;
    toBeEnabled(): T;
    toBeEmpty(): T;
    toBeEmptyDOMElement(): T;
    toBeInvalid(): T;
    toBeRequired(): T;
    toBeValid(): T;
    toBeChecked(): T;
    toBePartiallyChecked(): T;
    toContainElement(element: HTMLElement | null): T;
    toContainHTML(htmlText: string): T;
    toHaveAttribute(attr: string, value?: string): T;
    toHaveClass(...classNames: string[]): T;
    toHaveFocus(): T;
    toHaveFormValues(expectedValues: Record<string, any>): T;
    toHaveStyle(css: string | Record<string, any>): T;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): T;
    toHaveValue(value?: string | string[] | number): T;
    toHaveDisplayValue(value: string | string[]): T;
    toBeInTheDOM(): T;
  }
  
  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): any;
    toBeVisible(): any;
    toBeDisabled(): any;
    toBeEnabled(): any;
    toBeEmpty(): any;
    toBeEmptyDOMElement(): any;
    toBeInvalid(): any;
    toBeRequired(): any;
    toBeValid(): any;
    toBeChecked(): any;
    toBePartiallyChecked(): any;
    toContainElement(element: HTMLElement | null): any;
    toContainHTML(htmlText: string): any;
    toHaveAttribute(attr: string, value?: string): any;
    toHaveClass(...classNames: string[]): any;
    toHaveFocus(): any;
    toHaveFormValues(expectedValues: Record<string, any>): any;
    toHaveStyle(css: string | Record<string, any>): any;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): any;
    toHaveValue(value?: string | string[] | number): any;
    toHaveDisplayValue(value: string | string[]): any;
    toBeInTheDOM(): any;
  }
}
