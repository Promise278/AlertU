import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import './AppLayout.css'

function AppLayout() {
  return (
    <div className="app-layout">
      <Header />

      <div className="app-body">
        <Sidebar />

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}

export default AppLayout