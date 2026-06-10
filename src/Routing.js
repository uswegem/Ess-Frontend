import { Suspense } from 'react'
import { Routes, Route } from "react-router-dom";
import Loader from './components/loader/Loader'
import Private from './Private.js';
import Login from './pages/login/Login.jsx';
import routes from './routes.js';



export default function Routing() {

  return (
    <Routes>
      <Route element={<Private />}>
        {routes.map(({ path, Component }) => (
          <Route path={path} key={path} element={<Suspense fallback={<Loader />}>{Component}</Suspense>} />
        ))}
      </Route>
      <Route path="/" element={<Login />} />
    </Routes>
  )
}

