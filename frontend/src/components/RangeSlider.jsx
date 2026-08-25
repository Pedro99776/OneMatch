import React from 'react';

export default function RangeSlider({ value, min, max, onChange, name, className = '', ...props }) {
  return (
    <input
      type="range"
      name={name}
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className={`custom-range ${className}`}
      {...props}
    />
  );
}
