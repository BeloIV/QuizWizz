import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthModalContext = createContext();

export function AuthModalProvider({ children }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const openLoginModal = useCallback(() => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  }, []);

  const openRegisterModal = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  }, []);

  const closeModals = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  }, []);

  const value = {
    showLoginModal,
    showRegisterModal,
    openLoginModal,
    openRegisterModal,
    closeModals,
    setShowLoginModal,
    setShowRegisterModal,
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
}
