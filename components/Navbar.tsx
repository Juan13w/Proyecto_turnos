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
              <button className="navbar-button login-btn" onClick={handleLoginClick}>
                Inicio de sesión
              </button>
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
