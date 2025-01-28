import React, { useEffect, useRef } from 'react';

const AutoResizeTextArea = ({ value, onChange, minRows = 3, ...props }) => {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to match the content
      const minHeight = minRows * parseFloat(getComputedStyle(textarea).lineHeight);
      const newHeight = Math.max(minHeight, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Create a synthetic event that matches what the parent component expects
    onChange({
      target: {
        name,
        value
      }
    });
    adjustHeight();
  };

  return (
    <textarea
      ref={textareaRef}
      value={value || ''}
      onChange={handleChange}
      style={{ 
        overflow: 'hidden',
        resize: 'none',
        minHeight: `${minRows * 1.5}em`
      }}
      {...props}
    />
  );
};

export default AutoResizeTextArea;
