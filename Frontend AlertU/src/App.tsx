
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import RequireAuth from './components/auth/RequireAuth'
import AppLayout from './components/layout/AppLayout'

import Landing from './pages/Landing'
import CampusPulse from './pages/CampusPulse'
import Posts from './pages/Posts'
import CampusMapPage from './pages/CampusMap'
import IncidentDetails from './pages/IncidentDetails'
import ReportIncident from './pages/ReportIncident'
import SavedIncidents from './pages/SavedIncidents'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

import './pages/auth/Auth.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Landing />} />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>

            <Route path="/dashboard" element={<CampusPulse />} />

            <Route path="/posts" element={<Posts />} />

            <Route path="/map" element={<CampusMapPage />} />

            <Route path="/report" element={<ReportIncident />} />

            <Route path="/saved" element={<SavedIncidents />} />

            <Route
              path="/notifications"
              element={<Notifications />}
            />

            <Route path="/profile" element={<Profile />} />

            <Route path="/settings" element={<Settings />} />

            <Route
              path="/incidents/:id"
              element={<IncidentDetails />}
            />

          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App
