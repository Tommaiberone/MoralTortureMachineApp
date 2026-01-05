/**
 * Mobile-Aware Button Component
 * Button con haptic feedback per piattaforme native
 */

import React from 'react';
import PropTypes from 'prop-types';
import { hapticLight, hapticMedium } from '../utils/nativeFeatures';

const MobileButton = ({ 
  children, 
  onClick, 
  className = '', 
  haptic = 'light',
  disabled = false,
  type = 'button',
  ...rest 
}) => {
  const handleClick = async (e) => {
    if (disabled) return;
    
    // Haptic feedback
    if (haptic === 'light') {
      await hapticLight();
    } else if (haptic === 'medium') {
      await hapticMedium();
    }
    
    // Chiama il click handler originale
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={className}
      onClick={handleClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

MobileButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  haptic: PropTypes.oneOf(['light', 'medium', 'none']),
  disabled: PropTypes.bool,
  type: PropTypes.string,
};

export default MobileButton;
