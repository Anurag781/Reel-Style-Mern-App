import React from 'react'

import './App.css'
import './styles/theme.css'
import AppRoutes from './routes/AppRoutes'
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

function App() {


  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
      />

      <AppRoutes />
    </>
  )
}

export default App
