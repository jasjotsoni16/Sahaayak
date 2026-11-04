import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

// Fades and lifts its content in the first time it scrolls into view.
// Renders plain markup for visitors who asked their device for reduced motion.
export function Reveal({ as = 'div', delay = 0, className = '', children }) {
  const reduce = useReducedMotion();
  if (reduce) return React.createElement(as, { className }, children);
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

// A slow up-and-down drift for the floating cards around the phone.
export function Float({ delay = 0, distance = 10, className = '', children }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -distance, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}
