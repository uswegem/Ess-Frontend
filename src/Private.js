import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const Private = () => {
    var auth = localStorage.getItem("adminToken")
  return (
    <>
    {auth
      ?
      <Outlet />
      :
      <Navigate to='/'></Navigate>
    }
    </>
    
  )
}

export default Private