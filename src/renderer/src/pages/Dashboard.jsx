import { useState, useEffect } from 'react'
import { Calendar, Clock, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
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
  const [historialAnterior, setHistorialAnterior] = useState([])
  const [historialLastMoves, setHistorialLastMoves] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [historialSeisMeses, setHistorialSeisMeses] = useState([])
  const navigate = useNavigate()

  const handleNavigation = (path) => {
    navigate(path)
  }

  useEffect(() => {
    const mesActual = {
      mes: (new Date().getMonth() + 1).toString().padStart(2, '0'),
      anio: new Date().getFullYear().toString()
    }
    const mesAnterior = {
      mes: new Date().getMonth().toString().padStart(2, '0'),
      anio: new Date().getFullYear().toString()
    }
    const fetchData = async () => {
      const datosMesActual = await window.api.getHistorialMes(mesActual)
      const datosMesAnterior = await window.api.getHistorialMes(mesAnterior)
      const datosSeisMeses = await window.api.getHistorialSeisMeses()
      setHistorialSeisMeses(datosSeisMeses)
      setHistorialAnterior(datosMesAnterior)
      setHistorial(datosMesActual)
      setHistorialLastMoves(datosMesActual.slice(-5))
      console.log(datosSeisMeses)
    }
    fetchData()

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date())
  const mesActual = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
  const totalMesActual = historial.reduce((acc, curr) => acc + curr.monto, 0)
  const totalMesAnterior = historialAnterior.reduce((acc, curr) => acc + curr.monto, 0)
  const porcentajeDiferencia = (
    ((totalMesActual - totalMesAnterior) / totalMesAnterior) *
    100
  ).toFixed(2)
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
        <div className="first-row">
          <div className="dash-card summary-card">
            <div className="card-icon-main">
              <Wallet size={24} />
            </div>
            <div className="summary-content">
              <span className="label">Gasto total en {mesActual}</span>
              <h2 className="amount">${totalMesActual.toLocaleString('es-AR')}</h2>

              {porcentajeDiferencia > 0 && porcentajeDiferencia != Infinity ? (
                <div className="trend negative">
                  <ArrowUpRight size={16} />
                  <span>{porcentajeDiferencia}% mas que el mes anterior.</span>
                </div>
              ) : porcentajeDiferencia < 0 && -Infinity ? (
                <div className="trend positive">
                  <ArrowDownRight size={16} />
                  <span>{porcentajeDiferencia}% menos que el mes anterior.</span>
                </div>
              ) : (
                <div className="trend">
                  <span></span>
                </div>
              )}
            </div>
          </div>

          <div className="dash-card history-mini">
            <div className="card-header-flex">
              <h3>Ultimos movimientos</h3>
              <button className="view-all-btn" onClick={() => handleNavigation('/historial')}>
                Ver todo
              </button>
            </div>
            <div className="mini-list">
              {historialLastMoves.map((gasto) => (
                <div key={gasto.id} className="mini-item">
                  <div className="item-info">
                    <span className="item-name">{gasto.nombre}</span>
                    <span className="item-date">
                      {new Date(gasto.fechaPago).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <span className="item-amount">-${gasto.monto.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* GRÁFICO PRINCIPAL */}
        <div className="second-row">
          <div className="dash-card chart-card">
            <h3>Flujo de Gastos Semestral</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart
                  margin={{ top: 10, right: 20, left: 60, bottom: 0 }}
                  data={historialSeisMeses}
                >
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
                  <YAxis
                    tickFormatter={(value) =>
                      `$${value.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
                    }
                    stroke="var(--text-muted)"
                  />
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString('es-AR')}`]}
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px'
                    }}
                    itemStyle={{ color: 'var(--text-light)' }}
                    labelStyle={{
                      color: 'var(--text-light)',
                      fontWeight: 'bold',
                      marginBottom: '5px'
                    }}
                  />
                  <Area
                    type="linear"
                    dataKey="total"
                    stroke="var(--primary-accent)"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
