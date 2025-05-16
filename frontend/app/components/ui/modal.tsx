// components/ui/Modal.tsx
import { Portal } from './portal'
import { useNavigate } from '@remix-run/react'
import React from "react";

interface Props {
  children: React.ReactNode
  isOpen: boolean
  ariaLabel?: string
  className?: string
}

export const Modal: React.FC<Props> = ({ children, isOpen, ariaLabel, className }) => {
  const navigate = useNavigate()
  if (!isOpen) return null

  return (
    <Portal wrapperId="modal">
      <div
        className="fixed inset-0 overflow-y-auto bg-black bg-opacity-60 z-40"
        aria-labelledby={ariaLabel ?? 'modal-title'}
        role="dialog"
        aria-modal="true"
        onClick={() => navigate('.')} 
      />
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-center items-center">
        <div className={`${className} p-6 bg-white dark:bg-gray-800 pointer-events-auto rounded-md shadow-xl`}>
          {children}
        </div>
      </div>
    </Portal>
  )
}
