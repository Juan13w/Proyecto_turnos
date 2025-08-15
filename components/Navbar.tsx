"use client"

import { useState, useEffect } from "react"
import LoginForm from "./LoginForm"
import "./Navbar.css"

interface UserInfo {
  id: number
  email: string
  turno?: {
    id: number
    hora_entrada?: string
    hora_salida?: string
  } | null
  isAdmin: boolean
}

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  const handleLoginClick = () => {
    setShowLoginForm(true)
  }

  const handleLogin = (userData: UserInfo) => {
    setUserInfo(userData)
    setIsLoggedIn(true)
    setShowLoginForm(false)
    if (userData.isAdmin) {
      console.log(`Usuario ${userData.email} iniciando sesión como Administrador`)
    } else {
      console.log(`Usuario ${userData.email} iniciando sesión`)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserInfo(null)
    console.log("Usuario cerrando sesión...")
  }

  const handleCloseForm = () => {
    setShowLoginForm(false)
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <h2>TurnoSync</h2>
          </div>
          <div className="navbar-menu">
            {!isLoggedIn ? (
              <div className="navbar-actions">
                <button className="dark-mode-toggle" aria-label="Modo oscuro">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2"/>
                    <path d="M12 21v2"/>
                    <path d="M4.22 4.22l1.42 1.42"/>
                    <path d="M18.36 18.36l1.42 1.42"/>
                    <path d="M1 12h2"/>
                    <path d="M21 12h2"/>
                    <path d="M4.22 19.78l1.42-1.42"/>
                    <path d="M18.36 5.64l1.42-1.42"/>
                  </svg>
                </button>
                <button className="navbar-button login-btn" onClick={handleLoginClick}>
                  Inicio de sesión
                </button>
              </div>
            ) : (
              <div className="user-menu">
                <span className="user-greeting">
                  {userInfo?.isAdmin
                    ? `${userInfo.email} (Admin)`
                    : userInfo?.email}
                </span>
                <button className="navbar-button logout-btn" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {showLoginForm && (
        <LoginForm 
          isOpen={showLoginForm} 
          onClose={handleCloseForm} 
          onLogin={handleLogin} 
        />
      )}
    </>
  )
}

export default Navbar
