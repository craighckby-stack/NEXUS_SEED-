// sample-components.tsx

import React, { useState, ChangeEvent } from 'react';

/**
 * Sample Button Component
 * @returns {JSX.Element} A clickable button element
 */
const SampleButton: React.FC = () => {
  return <button>Click me!</button>;
};

/**
 * Sample Input Field Component
 * @returns {JSX.Element} A text input field element
 */
const SampleInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      placeholder="Enter your text"
    />
  );
};

/**
 * Sample Text Display Component
 * @returns {JSX.Element} A paragraph element with sample text
 */
const SampleText: React.FC = () => {
  return <p>This is a sample text.</p>;
};

export { SampleButton, SampleInput, SampleText };