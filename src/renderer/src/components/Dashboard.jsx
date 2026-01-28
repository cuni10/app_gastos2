import { useState, useEffect } from 'react'
import { Plus, Calendar, AlertCircle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import '../css/Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const Dashboard = () => {
  const navigate = useNavigate()
  const [historial, setHistorial] = useState([])
  const [totalMes, setTotalMes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [monthlyData, setMonthlyData] = useState({})

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const datos = await window.api.getHistorial()
        setHistorial(datos)

        // Calcular gastos del mes actual
        const ahora = new Date()
        const mesActual = ahora.getMonth()
        const anioActual = ahora.getFullYear()

        const gastosMes = datos.reduce((total, gasto) => {
          const fecha = new Date(gasto.fechaPago)
          if (fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual) {
            return total + gasto.monto
          }
          return total
        }, 0)

        setTotalMes(gastosMes)

        // Calcular gastos por mes (últimos 6 meses)
        const meses = {}
        const mesAbreviados = []

        for (let i = 5; i >= 0; i--) {
          const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
          const mesAbrev = fecha.toLocaleString('es-AR', { month: 'short' }).toUpperCase()
          const clave = `${mesAbrev}-${fecha.getFullYear()}`
          meses[clave] = 0
          mesAbreviados.push({ clave, label: mesAbrev })
        }

        datos.forEach((gasto) => {
          const fecha = new Date(gasto.fechaPago)
          const mesAbrev = fecha.toLocaleString('es-AR', { month: 'short' }).toUpperCase()
          const clave = `${mesAbrev}-${fecha.getFullYear()}`

          if (Object.prototype.hasOwnProperty.call(meses, clave)) {
            meses[clave] += gasto.monto
          }
        })

        // Crear labels solo con el mes (más limpio visualmente)
        const monthlyDataFormatted = {}
        mesAbreviados.forEach(({ clave, label }) => {
          monthlyDataFormatted[label] = meses[clave]
        })

        setMonthlyData(monthlyDataFormatted)
        setError(null)
      } catch (err) {
        console.error('Error al cargar datos:', err)
        setError('Error al cargar los datos del dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getUltimosGastos = (cantidad = 5) => {
    return historial.slice(0, cantidad)
  }

  const handleAgregarGasto = () => {
    navigate('/agregar')
  }

  const mesesNombres = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ]
  const mesActual = mesesNombres[new Date().getMonth()]

  const chartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Gastos por mes',
        data: Object.values(monthlyData),
        borderColor: '#00bcd4',
        backgroundColor: 'rgba(0, 188, 212, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#00bcd4',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 12 }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: { size: 11 }
        }
      }
    }
  }

  return (
    <div className="dashboard-container">
      {/* Header con Fecha/Hora y Título */}
      <div className="dashboard-header-new">
        <div className="header-top">
          <div className="title-section">
            <h1>Gastos {mesActual}</h1>
            <p className="total-mes">
              ${totalMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="datetime-section">
            <div className="datetime-display">
              <Calendar size={18} />
              <span>{currentDateTime.toLocaleDateString('es-AR')}</span>
            </div>
            <div className="datetime-display">
              <Clock size={18} />
              <span>{currentDateTime.toLocaleTimeString('es-AR')}</span>
            </div>
          </div>
        </div>
        <button className="btn-agregar-principal" onClick={handleAgregarGasto}>
          <Plus size={22} />
          Agregar Gasto
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Gráfica Comparativa */}
      {historial.length > 0 && (
        <div className="chart-section">
          <h2>Comparativa de Gastos</h2>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Últimos Gastos */}
      <div className="recent-section">
        <div className="section-header">
          <h2>Últimos Registros</h2>
          {historial.length > 0 && (
            <button className="link-ver-todos" onClick={() => navigate('/historial')}>
              Ver todos →
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Sin gastos registrados</h3>
            <p>Comienza a registrar tus gastos</p>
            <button className="btn-empty-state" onClick={handleAgregarGasto}>
              <Plus size={18} /> Registrar Primer Gasto
            </button>
          </div>
        ) : (
          <div className="recent-list">
            {getUltimosGastos().map((gasto) => (
              <div key={gasto.id} className="recent-item">
                <div className="item-icon">
                  <span>{gasto.categoria?.charAt(0).toUpperCase() || '💸'}</span>
                </div>
                <div className="item-details">
                  <div className="item-name">{gasto.nombre}</div>
                  <div className="item-category">{gasto.categoria}</div>
                </div>
                <div className="item-amount">${gasto.monto.toLocaleString('es-AR')}</div>
                <div className="item-date">{gasto.fechaPago}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
