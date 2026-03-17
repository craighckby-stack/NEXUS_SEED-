// @flow
import { configure } from '@testing-library/jest-dom';
import 'regenerator-runtime/runtime'; // Support async/await in Jest

configure({
  // Customize the test environment as needed
  // e.g., use `matchMedia` for responsive testing
  // or enable `toHaveStyle` matcher for CSS style checks
});

// Use this to configure global Jest settings
// import jest from 'jest';

export {};