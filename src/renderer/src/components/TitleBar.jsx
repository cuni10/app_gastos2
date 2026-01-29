import '../css/TitleBar.css'
import icon from '../../../../resources/logo.ico?asset'

const TitleBar = () => {
  const handleControl = (action) => {
    window.electron.ipcRenderer.send('window-control', action)
  }

  return (
    <nav className="titlebar">
      {/* Esta zona permite mover la ventana */}

      <div className="titlebar-icon">
        <img src={icon} className="app-icon" alt="App Icon" />
      </div>
      <div className="titlebar-drag-region">
        <span>JMT Automotores</span>
      </div>

      {/* Botones de control */}
      <div className="titlebar-controls">
        <button className="control-button" onClick={() => handleControl('minimize')}>
          <svg viewBox="0 0 10 1">
            <path d="M0 0h10v1H0z" fill="currentColor" />
          </svg>
        </button>

        <button className="control-button" onClick={() => handleControl('maximize')}>
          <svg viewBox="0 0 10 10">
            <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" />
          </svg>
        </button>

        <button className="control-button close" onClick={() => handleControl('close')}>
          <svg viewBox="0 0 10 10">
            <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

export default TitleBar
