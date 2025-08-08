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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    document.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, [scrolled])

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
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-brand">
            <h2>TurnoSync</h2>
          </div>
          <div className="navbar-logos">
            <img src="/images/logo1.png" alt="Logo 1" className="nav-logo" />
            <img src="/images/logo2.png" alt="Logo 2" className="nav-logo" />
            <img src="/images/logo3.png" alt="Logo 3" className="nav-logo" />
            <img src="/images/logo4.png" alt="Logo 4" className="nav-logo" />
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
