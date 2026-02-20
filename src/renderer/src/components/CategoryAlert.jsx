import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

import '../css/CategoryAlert.css'

const MySwal = withReactContent(Swal)

/**
 * Muestra una alerta con un formulario para crear una nueva categoría.
 * @returns {Promise<{nombre: string, descripcion: string} | undefined>} Los datos de la categoría o undefined si se cancela.
 */
export const showAddCategoryAlert = async () => {
  const { value: formValues } = await MySwal.fire({
    title: 'Nueva Categoría',
    html: `
      <div>
      <p class="custom-swal-text"> Las categorias son para organizar tus gastos y dividirlos en grupos. Por ejemplo: "Taller", "Publicidad", etc.</p>
        <input 
          id="cat-name" 
          class="custom-swal-input" 
          style="margin: 0;" 
          placeholder="Nombre de la categoría"
          maxLength=20
        >
        <input 
          id="cat-desc" 
          class="custom-swal-input"
          placeholder="Breve descripción (opcional)"
          maxLength=30
        >
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: 'var(--primary-color)',
    cancelButtonColor: 'var(--secondary-color)',

    customClass: {
      popup: 'custom-swal-popup',
      title: 'custom-swal-title',
      confirmButton: 'custom-swal-confirm',
      cancelButton: 'custom-swal-cancel'
    },
    // preConfirm se ejecuta cuando el usuario presiona "Guardar"
    preConfirm: () => {
      const nombre = document.getElementById('cat-name').value.trim()
      const descripcion = document.getElementById('cat-desc').value.trim()

      // Validación simple
      if (!nombre) {
        Swal.showValidationMessage('El nombre de la categoría es obligatorio')
        return false // Detiene el cierre de la alerta
      }

      // Retornamos el objeto con los datos
      return { nombre, descripcion }
    }
  })

  return formValues
}
