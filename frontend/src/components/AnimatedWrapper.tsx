import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * Props for the AnimatedWrapper component.
 * @property initialX - The initial x position of the component.
 * @property initialY - The initial y position of the component.
 * @property animateX - The x position to animate the component to.
 * @property animateY - The y position to animate the component to.
 * @property opacity - The opacity value to animate the component to.
 * @property duration - The duration of the animation in seconds.
 * @property children - The React children to be wrapped.
 * @property show - Whether to show or hide the component.
 */
interface AnimatedWrapperProps {
  initialX?: number; 
  initialY?: number; 
  animateX?: number;
  animateY?: number; 
  opacity?: number;  
  duration?: number; 
  children: ReactNode; 
  show?: boolean;   
}

/**
 * The AnimatedWrapper component, which wraps its children in a motion.div
 * and applies the specified animation properties.
 * @param props - The props for the AnimatedWrapper component.
 * @returns The wrapped children with the specified animation.
 */
const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  initialX = 0,
  initialY = 0,
  animateX = 0,
  animateY = 0,
  opacity = 1,
  duration = 0.5,
  children,
  show = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: initialX, y: initialY }}
      animate={{ opacity: opacity, x: animateX, y: animateY }}
      transition={{ duration: duration }}
      style={{ display: show ? 'block' : 'none' }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedWrapper;
