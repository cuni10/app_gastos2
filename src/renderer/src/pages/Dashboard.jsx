import { useState, useEffect } from 'react'
import { Calendar, Clock, ArrowDownRight, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import '../css/Dashboard.css'

import icon from '../../../../resources/logo.ico'

const Dashboard = () => {
  const [historial, setHistorial] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const navigate = useNavigate()

  // Datos de ejemplo para el gráfico (Esto debería venir de tu API)
  const dataGrafico = [
    { mes: 'Ene', total: 45000 },
    { mes: 'Feb', total: 52000 },
    { mes: 'Mar', total: 38000 },
    { mes: 'Abr', total: 65000 }
  ]

  const handleNavigation = (path) => {
    navigate(path)
  }

  useEffect(() => {
    const fetchData = async () => {
      const datos = await window.api.getHistorial()
      setHistorial(datos.slice(0, 5)) // Solo los últimos 5
    }
    fetchData()

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const totalMesActual = historial.reduce((acc, curr) => acc + curr.monto, 0)

  return (
    <div className="dashboard-container">
      {/* HEADER: Logo, Fecha y Hora */}
      <header className="dash-header">
        <div className="company-brand">
          <div className="logo-placeholder">
            {/* Aquí va tu logo */}
            <div className="temp-logo">
              <img src={icon} alt="logo" />
            </div>
          </div>
          <div className="brand-text">
            <h1>Panel de Control</h1>
            <p>JMT Automotores</p>
          </div>
        </div>

        <div className="header-info">
          <div className="info-pill">
            <Calendar size={16} />
            <span>{currentTime.toLocaleDateString('es-AR')}</span>
          </div>
          <div className="info-pill">
            <Clock size={16} />
            <span>
              {currentTime.toLocaleTimeString(['es-AR'], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      <div className="dash-grid">
        {/* CARD RESUMEN MENSUAL */}
        <div className="dash-card summary-card">
          <div className="card-icon-main">
            <Wallet size={24} />
          </div>
          <div className="summary-content">
            <span className="label">Gasto Mensual Total</span>
            <h2 className="amount">${totalMesActual.toLocaleString('es-AR')}</h2>
            <div className="trend positive">
              <ArrowDownRight size={16} />
              <span>12% menos que el mes anterior</span>
            </div>
          </div>
        </div>

        {/* GRÁFICO PRINCIPAL */}
        <div className="dash-card chart-card">
          <h3>Flujo de Gastos Semestral</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dataGrafico}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-subtle)"
                  vertical={false}
                />
                <XAxis dataKey="mes" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-subtle)'
                  }}
                  itemStyle={{ color: 'var(--text-light)' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--primary-accent)"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MINI HISTORIAL */}
        <div className="dash-card history-mini">
          <div className="card-header-flex">
            <h3>Movimientos Recientes</h3>
            <button className="view-all-btn" onClick={() => handleNavigation('/historial')}>
              Ver todo
            </button>
          </div>
          <div className="mini-list">
            {historial.map((gasto) => (
              <div key={gasto.id} className="mini-item">
                <div className="item-info">
                  <span className="item-name">{gasto.nombre}</span>
                  <span className="item-date">{gasto.fechaPago}</span>
                </div>
                <span className="item-amount">-${gasto.monto.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
