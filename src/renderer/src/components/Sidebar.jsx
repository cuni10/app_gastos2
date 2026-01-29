import { useState } from 'react'
import { LayoutDashboard, PlusCircle, History, Menu, Car, Eye } from 'lucide-react'
import '../css/Sidebar.css'
import { Link } from 'react-router-dom'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <button className="nav-item" onClick={toggleSidebar}>
          <Menu size={24} />
          {!isCollapsed}
        </button>
        <Link to="/" className="link">
          <button className="nav-item">
            <LayoutDashboard className="icon" size={24} />
            {!isCollapsed && <span>Inicio</span>}
          </button>
        </Link>

        <Link to="/agregar" className="link">
          <button className="nav-item">
            <PlusCircle className="icon" size={24} />
            {!isCollapsed && <span>Nuevo gasto</span>}
          </button>
        </Link>

        <Link to="/historial" className="link">
          <button className="nav-item">
            <History className="icon" size={24} />
            {!isCollapsed && <span>Historial</span>}
          </button>
        </Link>

        <div className="sidebar-divider"></div>

        <Link to="/agregar-auto" className="link">
          <button className="nav-item">
            <PlusCircle className="icon" size={24} />
            {!isCollapsed && <span>Agregar auto</span>}
          </button>
        </Link>

        <Link to="/autos" className="link">
          <button className="nav-item">
            <Eye className="icon" size={24} />
            {!isCollapsed && <span>Ver autos</span>}
          </button>
        </Link>
      </nav>
    </aside>
  )
}

export default Sidebar
