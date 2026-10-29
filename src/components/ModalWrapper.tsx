import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  position?: 'center' | 'top';
  overflowHidden?: boolean;
  preventScroll?: boolean;
  zIndex?: string;
  customCard?: boolean;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  position = 'center',
  overflowHidden = true,
  preventScroll = true,
  zIndex = 'z-50',
  customCard = false,
}) => {
  // ESC key listener to gracefully dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is active to prevent awkward background scrolling
  useEffect(() => {
    if (!preventScroll) return;
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, preventScroll]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed inset-0 ${zIndex} flex ${
            position === 'top' ? 'items-start pt-16 sm:pt-20' : 'items-center'
          } justify-center p-3 sm:p-4 bg-neutral-950/60 dark:bg-black/75 backdrop-blur-md`}
          onClick={onClose}
        >
          {customCard ? (
            <motion.div
              key="modal-custom-card"
              initial={{
                opacity: 0,
                scale: 0.94,
                y: position === 'top' ? -12 : 16,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: position === 'top' ? -8 : 10,
              }}
              transition={{
                duration: 0.26,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`w-full ${maxWidth} flex flex-col items-center ${className}`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="modal-card"
              initial={{
                opacity: 0,
                scale: 0.94,
                y: position === 'top' ? -12 : 16,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: position === 'top' ? -8 : 10,
              }}
              transition={{
                duration: 0.26,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`w-full ${maxWidth} bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col ${
                overflowHidden ? 'overflow-hidden' : ''
              } ${className}`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
