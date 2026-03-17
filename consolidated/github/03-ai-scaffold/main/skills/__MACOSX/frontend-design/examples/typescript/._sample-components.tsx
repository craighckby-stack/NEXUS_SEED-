/**
 * Production React components with full TypeScript support.
 *
 * @link https://github.com/Sovereign-Evolution-Engine/frontend-design#typescript-examples
 */

import { FC } from 'react';
import clsx from 'clsx';
import tailwindMerge from 'tailwind-merge';

// Import components
import Button from './Button';
import Input from './Input';
import Card from './Card';
import Modal from './Modal';
import Alert from './Alert';

// Component utils
const getClasses = (className?: string) => {
  if (typeof className === 'string') {
    return clsx('bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded', className);
  } else {
    return '';
  }
};

// Sample components
const SampleButton: FC = () => {
  return (
    <button className={getClasses('shadow-md hover:shadow-lg transition duration-150')}>Click me!</button>
  );
};

const SampleInput: FC = () => {
  return (
    <input
      type="text"
      placeholder="Type something..."
      className="border-2 border-gray-200 p-2 rounded-lg focus:outline-none focus:border-gray-400 transition duration-150"
    />
  );
};

const SampleCard: FC = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-bold mb-2">Card title</h2>
      <p className="text-gray-600 mb-4">Card description</p>
    </div>
  );
};

// Export components
export { Button, Input, Card, Modal, Alert, SampleButton, SampleInput, SampleCard };

// Example usage with Tailwind merge
const mergedClasses = tailwindMerge(' bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded', 'mx-auto p-4');
console.log(mergedClasses);