// gestionusuarios.js

// URLs de las APIs
const API_URLS = {
    usuarios: '/api/usuarios/',
    crearUsuario: '/api/usuario/crear/',
    obtenerUsuario: (id) => `/api/usuario/${id}/`,
    actualizarUsuario: (id) => `/api/usuario/${id}/actualizar/`,
    eliminarUsuario: (id) => `/api/usuario/${id}/eliminar/`,
    colaboradores: '/api/colaboradores/',
    obtenerColaborador: (id) => `/api/colaborador/${id}/`,
    crearColaborador: '/api/colaborador/crear/',
    actualizarColaborador: (id) => `/api/colaborador/${id}/actualizar/`,
    eliminarColaborador: (id) => `/api/colaborador/${id}/eliminar/`,
    puestos: '/api/puestos/',
    crearPuesto: '/api/puesto/crear/',
};

// Estado global
let puestosList = [];
let colaboradoresList = [];
let usuariosList = [];
let colaboradorSeleccionado = null;
let colaboradorFilterTerm = '';
let colaboradorFilterPuesto = '';
let colaboradorEditandoDatos = null;
let usuariosFilterTerm = '';
let usuariosFilterPuesto = '';
let colaboradoresGestionFilterTerm = '';
let colaboradoresGestionFilterPuesto = '';

let usuarioIdParaEliminar = null;
let colaboradorIdParaEliminar = null;
let deleteUsuarioBtnDefaultHTML = '';
let deleteColaboradorBtnDefaultHTML = '';

// Contador de modales abiertos para gestionar la clase modal-open en el body
let modalesAbiertos = 0;

// =====================================================
// FUNCIONES HELPER PARA GESTIONAR MODALES
// =====================================================

/**
 * Añade la clase modal-open al body cuando se abre un modal
 */
function abrirModal(modalElement) {
    if (!modalElement) return;
    
    // Cerrar el drawer móvil si está abierto
    const drawer = document.getElementById('drawer');
    if (drawer && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        drawer.setAttribute('inert', '');
        const btnHamburger = document.getElementById('btnHamburger');
        if (btnHamburger) {
            btnHamburger.setAttribute('aria-expanded', 'false');
        }
    }
    
    // Cerrar el dropdown de usuario si está abierto
    const navUserDropdown = document.getElementById('navUserDropdown');
    if (navUserDropdown && navUserDropdown.classList.contains('show')) {
        navUserDropdown.classList.remove('show');
    }
    
    modalElement.style.display = 'block';
    modalesAbiertos++;
    if (modalesAbiertos === 1) {
        document.body.classList.add('modal-open');
    }
}

/**
 * Quita la clase modal-open del body cuando se cierra un modal
 */
function cerrarModal(modalElement) {
    if (!modalElement) return;
    modalElement.style.display = 'none';
    if (modalesAbiertos > 0) {
        modalesAbiertos--;
    }
    if (modalesAbiertos === 0) {
        document.body.classList.remove('modal-open');
    }
}

/**
 * Verifica si hay modales abiertos y actualiza la clase del body
 */
function actualizarEstadoModal() {
    const modales = document.querySelectorAll('.modal[style*="display: block"], .modal[style*="display:block"]');
    const modalesVisibles = Array.from(modales).filter(modal => {
        const style = window.getComputedStyle(modal);
        return style.display === 'block';
    });
    
    modalesAbiertos = modalesVisibles.length;
    if (modalesAbiertos > 0) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    inicializarNavegacion();
    inicializarFormularios();
    cargarDatosIniciales();
    inicializarValidaciones();
    inicializarPasswordToggles();
});

// =====================================================
// NAVEGACIÓN ENTRE VISTAS
// =====================================================

function inicializarNavegacion() {
    const mainView = document.getElementById('mainView');
    const manageUsersView = document.getElementById('manageUsersView');
    const managePersonnelView = document.getElementById('managePersonnelView');
    
    const openManageUsersBtn = document.getElementById('openManageUsersBtn');
    const openManagePersonnelBtn = document.getElementById('openManagePersonnelBtn');
    const backFromUsersBtn = document.getElementById('backFromUsersBtn');
    const backFromPersonnelBtn = document.getElementById('backFromPersonnelBtn');
    
    const manageUsersCard = document.getElementById('manageUsersCard');
    const managePersonnelCard = document.getElementById('managePersonnelCard');
    
    function showView(viewToShow) {
        if (mainView) mainView.style.display = 'none';
        if (manageUsersView) manageUsersView.style.display = 'none';
        if (managePersonnelView) managePersonnelView.style.display = 'none';
        
        if (viewToShow) {
            viewToShow.style.display = 'block';
        }
    }
    
    function showMainView() {
        showView(null);
        if (mainView) mainView.style.display = 'block';
    }
    
    if (openManageUsersBtn) {
        openManageUsersBtn.addEventListener('click', () => {
            showView(manageUsersView);
            cargarUsuarios();
        });
    }
    
    if (openManagePersonnelBtn) {
        openManagePersonnelBtn.addEventListener('click', () => {
            showView(managePersonnelView);
            cargarColaboradores();
        });
    }
    
    if (backFromUsersBtn) {
        backFromUsersBtn.addEventListener('click', showMainView);
    }
    
    if (backFromPersonnelBtn) {
        backFromPersonnelBtn.addEventListener('click', showMainView);
    }
    
    if (manageUsersCard) {
        manageUsersCard.addEventListener('click', (e) => {
            if (e.target.closest('.card-button')) return;
            showView(manageUsersView);
            cargarUsuarios();
        });
    }
    
    if (managePersonnelCard) {
        managePersonnelCard.addEventListener('click', (e) => {
            if (e.target.closest('.card-button')) return;
            showView(managePersonnelView);
            cargarColaboradores();
        });
    }
}

// =====================================================
// CARGA DE DATOS INICIALES
// =====================================================

async function cargarDatosIniciales() {
    await cargarPuestos();
    await cargarColaboradoresParaSelect();
}

async function cargarPuestos() {
    try {
        const response = await fetch(API_URLS.puestos);
        const data = await response.json();
        
        if (data.success) {
            puestosList = data.puestos;
            actualizarSelectPuestos();
        }
    } catch (error) {
        console.error('Error al cargar puestos:', error);
    }
}

async function cargarPuestosParaSelect(selectId) {
    try {
        const response = await fetch(API_URLS.puestos);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById(selectId);
            if (select) {
                // Guardar valor actual
                const currentValue = select.value;
                
                // Limpiar opciones excepto la primera
                select.innerHTML = '<option value="">Seleccione un puesto...</option>';
                
                // Agregar puestos
                data.puestos.forEach(puesto => {
                    const option = document.createElement('option');
                    option.value = puesto.id;
                    option.textContent = `${puesto.codigo} - ${puesto.nombre}`;
                    select.appendChild(option);
                });
                
                // Restaurar valor si existe
                if (currentValue) {
                    select.value = currentValue;
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar puestos para select:', error);
    }
}

async function cargarColaboradoresParaSelect(selectId = 'colaboradorSelect') {
    try {
        const response = await fetch(API_URLS.colaboradores);
        const data = await response.json();
        
        if (data.success) {
            colaboradoresList = data.colaboradores;
            actualizarOpcionesFiltroColaboradores();
            
            if (selectId === 'colaboradorSelect') {
                actualizarSelectColaboradores();
            } else {
                const select = document.getElementById(selectId);
                if (select) {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">Seleccione un colaborador...</option>';
                    data.colaboradores.forEach(colab => {
                        const option = document.createElement('option');
                        option.value = colab.id;
                        option.textContent = colab.nombre;
                        select.appendChild(option);
                    });
                    if (currentValue) {
                        select.value = currentValue;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar colaboradores:', error);
    }
}

// =====================================================
// ACTUALIZAR SELECTS
// =====================================================

function actualizarSelectPuestos() {
    const selectUserPuesto = document.getElementById('userPuesto');
    const selectColaboradorPuesto = document.getElementById('colaboradorPuesto');
    const selectFiltroPuesto = document.getElementById('colaboradorPuestoFilter');
    
    const options = puestosList.map(puesto => 
        `<option value="${puesto.id}">${puesto.codigo} - ${puesto.nombre}</option>`
    ).join('');
    
    if (selectUserPuesto) {
        const currentValue = selectUserPuesto.value;
        selectUserPuesto.innerHTML = '<option value="">Seleccione un puesto...</option>' + options;
        if (currentValue) selectUserPuesto.value = currentValue;
    }
    
    if (selectColaboradorPuesto) {
        const currentValue = selectColaboradorPuesto.value;
        selectColaboradorPuesto.innerHTML = '<option value="">Seleccione un puesto...</option>' + options;
        if (currentValue) selectColaboradorPuesto.value = currentValue;
    }

    if (selectFiltroPuesto) {
        const currentValue = selectFiltroPuesto.value;
        const opciones = ['<option value="">Todos los puestos</option>']
            .concat(puestosList.map(puesto => `<option value="${puesto.id}">${puesto.nombre}</option>`));
        selectFiltroPuesto.innerHTML = opciones.join('');
        if (currentValue) selectFiltroPuesto.value = currentValue;
    }
}

function actualizarOpcionesFiltroColaboradores() {
    const selectFiltroPuesto = document.getElementById('colaboradorPuestoFilter');
    if (!selectFiltroPuesto) return;

    const currentValue = selectFiltroPuesto.value;
    const puestosDisponibles = new Map();
    let haySinPuesto = false;

    colaboradoresList.forEach(colab => {
        if (colab.puesto_id && colab.puesto_nombre) {
            puestosDisponibles.set(colab.puesto_id, colab.puesto_nombre);
        } else if (!colab.puesto_id) {
            haySinPuesto = true;
        }
    });

    const opciones = ['<option value="">Todos los puestos</option>'];
    const puestosOrdenados = Array.from(puestosDisponibles.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    puestosOrdenados.forEach(([id, nombre]) => {
        opciones.push(`<option value="${id}">${nombre}</option>`);
    });
    if (haySinPuesto) {
        opciones.push('<option value="__sin_puesto">Sin puesto asignado</option>');
    }

    selectFiltroPuesto.innerHTML = opciones.join('');
    if (currentValue) {
        selectFiltroPuesto.value = currentValue;
        if (selectFiltroPuesto.value !== currentValue) {
            colaboradorFilterPuesto = '';
        }
    }
}

function actualizarOpcionesFiltroUsuarios() {
    const select = document.getElementById('usersPuestoFilter');
    if (!select) return;

    const currentValue = select.value;
    const puestosDisponibles = new Map();
    let haySinPuesto = false;

    usuariosList.forEach(usuario => {
        if (usuario.puesto_id && usuario.puesto_nombre) {
            puestosDisponibles.set(usuario.puesto_id, usuario.puesto_nombre);
        } else if (!usuario.puesto_id) {
            haySinPuesto = true;
        }
    });

    const opciones = ['<option value="">Todos los puestos</option>'];
    const ordenados = Array.from(puestosDisponibles.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    ordenados.forEach(([id, nombre]) => {
        opciones.push(`<option value="${id}">${nombre}</option>`);
    });
    if (haySinPuesto) {
        opciones.push('<option value="__sin_puesto">Sin puesto asignado</option>');
    }

    select.innerHTML = opciones.join('');
    if (currentValue) {
        select.value = currentValue;
        if (select.value !== currentValue) {
            usuariosFilterPuesto = '';
        }
    }
}

function actualizarOpcionesFiltroColaboradoresGestion() {
    const select = document.getElementById('colaboradoresPuestoFilter');
    if (!select) return;

    const currentValue = select.value;
    const puestosDisponibles = new Map();
    let haySinPuesto = false;

    colaboradoresList.forEach(colab => {
        if (colab.puesto_id && colab.puesto_nombre) {
            puestosDisponibles.set(colab.puesto_id, colab.puesto_nombre);
        } else if (!colab.puesto_id) {
            haySinPuesto = true;
        }
    });

    const opciones = ['<option value="">Todos los puestos</option>'];
    const ordenados = Array.from(puestosDisponibles.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    ordenados.forEach(([id, nombre]) => {
        opciones.push(`<option value="${id}">${nombre}</option>`);
    });
    if (haySinPuesto) {
        opciones.push('<option value="__sin_puesto">Sin puesto asignado</option>');
    }

    select.innerHTML = opciones.join('');
    if (currentValue) {
        select.value = currentValue;
        if (select.value !== currentValue) {
            colaboradoresGestionFilterPuesto = '';
        }
    }
}

function normalizarTexto(valor) {
    return valor ? String(valor).toLowerCase() : '';
}

function filtrarColaborador(colab) {
    const termino = normalizarTexto(colaboradorFilterTerm);
    if (termino) {
        const campos = [
            colab.nombre,
            colab.correo,
            colab.telefono,
            colab.puesto_nombre,
        ];
        const coincideBusqueda = campos.some(campo => normalizarTexto(campo).includes(termino));
        if (!coincideBusqueda) {
            return false;
        }
    }

    if (colaboradorFilterPuesto) {
        if (colaboradorFilterPuesto === '__sin_puesto') {
            if (colab.puesto_id) {
                return false;
            }
        } else if (colab.puesto_id !== colaboradorFilterPuesto) {
            return false;
        }
    }

    return true;
}

function obtenerColaboradoresFiltrados() {
    return colaboradoresList.filter(filtrarColaborador);
}

function formatearDetalleColaborador(colab) {
    if (colab.tiene_usuario) {
        return ' - ⚠️ Ya tiene usuario asignado';
    }
    if (!colab.activo) {
        return ' - Inactivo';
    }
    if (!colab.es_personal_fijo) {
        return ' - Se marcará como personal fijo al crear el usuario';
    }
    return '';
}

function actualizarSelectColaboradores() {
    const selectColaborador = document.getElementById('colaboradorSelect');
    if (!selectColaborador) return;

    const colaboradoresFiltrados = obtenerColaboradoresFiltrados();
    const opciones = colaboradoresFiltrados.map(colab => {
        const disponible = Boolean(colab.activo) && !colab.tiene_usuario;
        const detalle = formatearDetalleColaborador(colab);
        const disabled = disponible ? '' : 'disabled';
        const clase = disponible ? '' : ' class="option-disabled"';
        return `<option value="${colab.id}" ${disabled}${clase}>${colab.nombre}${detalle}</option>`;
    }).join('');

    let contenido = '<option value="">Seleccione un colaborador...</option>';
    if (opciones) {
        contenido += opciones;
    } else {
        contenido += '<option value="" disabled>No se encontraron colaboradores con los filtros actuales</option>';
    }
    selectColaborador.innerHTML = contenido;

    const seleccionadoActual = colaboradorSeleccionado ? colaboradorSeleccionado.id : '';
    if (seleccionadoActual && colaboradoresFiltrados.some(colab => colab.id === seleccionadoActual)) {
        selectColaborador.value = seleccionadoActual;
    } else {
        selectColaborador.value = '';
        if (seleccionadoActual) {
            colaboradorSeleccionado = null;
            resetearAutocompletadoUsuario();
        }
    }

    const suggestions = document.getElementById('colaboradorSuggestions');
    if (suggestions && suggestions.style.display === 'block') {
        renderColaboradorSuggestions();
    }
}

function renderColaboradorSuggestions() {
    const contenedor = document.getElementById('colaboradorSuggestions');
    const input = document.getElementById('colaboradorSearchInput');
    if (!contenedor || !input) return;

    const termino = normalizarTexto(colaboradorFilterTerm);
    if (!termino) {
        ocultarColaboradorSuggestions();
        return;
    }

    const sugerencias = obtenerColaboradoresFiltrados()
        .filter(colab => colab.activo && !colab.tiene_usuario)
        .slice(0, 8);

    if (!sugerencias.length) {
        contenedor.innerHTML = '<div style="padding: 6px 10px; font-size: 0.85rem; color: var(--text-muted);">Sin coincidencias disponibles</div>';
        contenedor.style.display = 'block';
        return;
    }

    contenedor.innerHTML = sugerencias.map(colab => `
        <button type="button" class="suggestion-item" data-colaborador-id="${colab.id}" style="width: 100%; text-align: left; padding: 8px 10px; border-radius: 8px; border: none; background: transparent; color: var(--text-primary); cursor: pointer; display: flex; flex-direction: column; gap: 2px;">
            <span style="font-weight: 600;">${colab.nombre}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${colab.puesto_nombre || 'Sin puesto'} · ${colab.correo || 'Sin correo'}</span>
        </button>
    `).join('');

    contenedor.querySelectorAll('.suggestion-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-colaborador-id');
            const select = document.getElementById('colaboradorSelect');
            if (select) {
                select.value = id;
                select.dispatchEvent(new Event('change'));
            }
            const seleccionado = colaboradoresList.find(colab => colab.id === id);
            if (seleccionado && input) {
                input.value = seleccionado.nombre;
                colaboradorFilterTerm = seleccionado.nombre;
                actualizarSelectColaboradores();
            }
            ocultarColaboradorSuggestions();
        });
    });

    contenedor.style.display = 'block';
}

function ocultarColaboradorSuggestions() {
    const contenedor = document.getElementById('colaboradorSuggestions');
    if (contenedor) {
        contenedor.style.display = 'none';
        contenedor.innerHTML = '';
    }
}

// =====================================================
// FORMULARIOS
// =====================================================

function inicializarFormularios() {
    // Formulario de Usuario
    const createUserBtn = document.getElementById('createUserBtn');
    const userForm = document.getElementById('userForm');
    const cancelCreateUsuarioBtn = document.getElementById('cancelCreateUsuarioBtn');
    const saveCreateUsuarioBtn = document.getElementById('saveCreateUsuarioBtn');
    const closeCreateUsuarioModal = document.getElementById('closeCreateUsuarioModal');
    const createUsuarioModal = document.getElementById('createUsuarioModal');
    const colaboradorSelect = document.getElementById('colaboradorSelect');
    const colaboradorSearchInput = document.getElementById('colaboradorSearchInput');
    const colaboradorPuestoFilter = document.getElementById('colaboradorPuestoFilter');
    const colaboradorSuggestions = document.getElementById('colaboradorSuggestions');
    const userRol = document.getElementById('userRol');
    const userPuesto = document.getElementById('userPuesto');
    const usersSearchInput = document.getElementById('usersSearchInput');
    const usersPuestoFilter = document.getElementById('usersPuestoFilter');
    const colaboradoresSearchInput = document.getElementById('colaboradoresSearchInput');
    const colaboradoresPuestoFilter = document.getElementById('colaboradoresPuestoFilter');
    
    if (userPuesto) {
        userPuesto.disabled = true;
    }
    
    if (createUserBtn) {
        createUserBtn.addEventListener('click', () => {
            if (createUsuarioModal) {
                abrirModal(createUsuarioModal);
                resetearFormularioUsuario();
                cargarColaboradoresParaSelect();
            }
        });
    }
    
    if (closeCreateUsuarioModal) {
        closeCreateUsuarioModal.addEventListener('click', cerrarModalCrearUsuario);
    }
    
    if (cancelCreateUsuarioBtn) {
        cancelCreateUsuarioBtn.addEventListener('click', cerrarModalCrearUsuario);
    }
    
    if (createUsuarioModal) {
        createUsuarioModal.addEventListener('click', (e) => {
            if (e.target === createUsuarioModal) {
                cerrarModalCrearUsuario();
            }
        });
    }
    
    if (saveCreateUsuarioBtn) {
        saveCreateUsuarioBtn.addEventListener('click', async () => {
            await crearUsuario();
        });
    }
    
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await crearUsuario();
        });
    }
    
    // Autocompletar al seleccionar colaborador
    if (colaboradorSelect) {
        colaboradorSelect.addEventListener('change', async (e) => {
            const colaboradorId = e.target.value;
            if (colaboradorId) {
                await cargarColaboradorParaAutocompletar(colaboradorId);
            } else {
                resetearAutocompletadoUsuario();
            }
            ocultarColaboradorSuggestions();
        });
    }

    if (colaboradorSearchInput) {
        colaboradorSearchInput.addEventListener('input', (e) => {
            colaboradorFilterTerm = e.target.value;
            actualizarSelectColaboradores();
            renderColaboradorSuggestions();
        });
        colaboradorSearchInput.addEventListener('focus', () => {
            if (colaboradorFilterTerm) {
                renderColaboradorSuggestions();
            }
        });
    }

    if (colaboradorPuestoFilter) {
        colaboradorPuestoFilter.addEventListener('change', (e) => {
            colaboradorFilterPuesto = e.target.value;
            actualizarSelectColaboradores();
            renderColaboradorSuggestions();
        });
    }

    if (colaboradorSuggestions) {
        document.addEventListener('click', (event) => {
            if (!colaboradorSuggestions.contains(event.target) && event.target !== colaboradorSearchInput) {
                ocultarColaboradorSuggestions();
            }
        });
    }

    if (usersSearchInput) {
        usersSearchInput.addEventListener('input', (e) => {
            usuariosFilterTerm = e.target.value;
            mostrarUsuarios(usuariosList);
        });
    }

    if (usersPuestoFilter) {
        usersPuestoFilter.addEventListener('change', (e) => {
            usuariosFilterPuesto = e.target.value;
            mostrarUsuarios(usuariosList);
        });
    }

    if (colaboradoresSearchInput) {
        colaboradoresSearchInput.addEventListener('input', (e) => {
            colaboradoresGestionFilterTerm = e.target.value;
            mostrarColaboradores(colaboradoresList);
        });
    }

    if (colaboradoresPuestoFilter) {
        colaboradoresPuestoFilter.addEventListener('change', (e) => {
            colaboradoresGestionFilterPuesto = e.target.value;
            mostrarColaboradores(colaboradoresList);
        });
    }
    
    // Mostrar/ocultar campo puesto según rol
    if (userRol) {
        userRol.addEventListener('change', (e) => {
            const userPuestoGroup = document.getElementById('userPuestoGroup');
            const userPuesto = document.getElementById('userPuesto');
            
            // Si hay un colaborador seleccionado, siempre mostrar el campo puesto
            const tieneColaborador = colaboradorSeleccionado && colaboradorSeleccionado.puesto_id;
            
            if (e.target.value === 'personal') {
                if (userPuestoGroup) userPuestoGroup.style.display = 'block';
                if (userPuesto) {
                    userPuesto.required = true;
                    // Si hay un colaborador seleccionado con puesto, autocompletarlo
                    if (tieneColaborador) {
                        userPuesto.value = colaboradorSeleccionado.puesto_id;
                    }
                }
            } else {
                // Para admin, mostrar puesto solo si hay colaborador seleccionado
                if (userPuestoGroup) {
                    if (tieneColaborador) {
                        userPuestoGroup.style.display = 'block';
                    } else {
                        userPuestoGroup.style.display = 'none';
                    }
                }
                if (userPuesto) {
                    userPuesto.required = false;
                    // Si hay un colaborador seleccionado con puesto, autocompletarlo
                    if (tieneColaborador) {
                        userPuesto.value = colaboradorSeleccionado.puesto_id;
                    } else {
                        userPuesto.value = '';
                    }
                }
            }
        });
    }
    
    // Formulario de Colaborador
    const createColaboradorBtn = document.getElementById('createColaboradorBtn');
    const colaboradorForm = document.getElementById('colaboradorForm');
    const cancelCreateColaboradorBtn = document.getElementById('cancelCreateColaboradorBtn');
    const saveCreateColaboradorBtn = document.getElementById('saveCreateColaboradorBtn');
    const closeCreateColaboradorModal = document.getElementById('closeCreateColaboradorModal');
    const createColaboradorModal = document.getElementById('createColaboradorModal');
    
    if (createColaboradorBtn) {
        createColaboradorBtn.addEventListener('click', () => {
            if (createColaboradorModal) {
                abrirModal(createColaboradorModal);
                resetearFormularioColaborador();
                cargarPuestosParaSelect('colaboradorPuesto');
            }
        });
    }
    
    if (closeCreateColaboradorModal) {
        closeCreateColaboradorModal.addEventListener('click', cerrarModalCrearColaborador);
    }
    
    if (cancelCreateColaboradorBtn) {
        cancelCreateColaboradorBtn.addEventListener('click', cerrarModalCrearColaborador);
    }
    
    if (createColaboradorModal) {
        createColaboradorModal.addEventListener('click', (e) => {
            if (e.target === createColaboradorModal) {
                cerrarModalCrearColaborador();
            }
        });
    }
    
    if (saveCreateColaboradorBtn) {
        saveCreateColaboradorBtn.addEventListener('click', async () => {
            await crearColaborador();
        });
    }
    
    if (colaboradorForm) {
        colaboradorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await crearColaborador();
        });
    }
    
    // Botones para crear puesto
    const createPuestoFromUserBtn = document.getElementById('createPuestoFromUserBtn');
    const createPuestoFromColaboradorBtn = document.getElementById('createPuestoFromColaboradorBtn');
    
    if (createPuestoFromUserBtn) {
        createPuestoFromUserBtn.addEventListener('click', () => abrirModalPuesto('user'));
    }
    
    if (createPuestoFromColaboradorBtn) {
        createPuestoFromColaboradorBtn.addEventListener('click', () => abrirModalPuesto('colaborador'));
    }
    
    // Modal de Puesto
    inicializarModalPuesto();
    
    // Modales de eliminación
    inicializarModalesEliminacion();
    
    // Modales de edición
    inicializarModalesEdicion();
}

function inicializarModalesEliminacion() {
    // Modal de eliminación de usuario
    const closeDeleteUsuarioModal = document.getElementById('closeDeleteUsuarioModal');
    const cancelDeleteUsuarioBtn = document.getElementById('cancelDeleteUsuarioBtn');
    const executeDeleteUsuarioBtn = document.getElementById('executeDeleteUsuarioBtn');
    
    if (closeDeleteUsuarioModal) {
        closeDeleteUsuarioModal.addEventListener('click', cerrarModalEliminarUsuario);
    }
    
    if (cancelDeleteUsuarioBtn) {
        cancelDeleteUsuarioBtn.addEventListener('click', cerrarModalEliminarUsuario);
    }

    if (executeDeleteUsuarioBtn && !executeDeleteUsuarioBtn.dataset.listenerAdded) {
        if (!deleteUsuarioBtnDefaultHTML) {
            deleteUsuarioBtnDefaultHTML = executeDeleteUsuarioBtn.innerHTML;
        }
        executeDeleteUsuarioBtn.addEventListener('click', () => eliminarUsuario());
        executeDeleteUsuarioBtn.dataset.listenerAdded = 'true';
    }
    
    // Cerrar modal al hacer clic fuera
    const deleteUsuarioModal = document.getElementById('deleteUsuarioModal');
    if (deleteUsuarioModal) {
        deleteUsuarioModal.addEventListener('click', (e) => {
            if (e.target === deleteUsuarioModal) {
                cerrarModalEliminarUsuario();
            }
        });
    }
    
    // Modal de eliminación de colaborador
    const closeDeleteColaboradorModal = document.getElementById('closeDeleteColaboradorModal');
    const cancelDeleteColaboradorBtn = document.getElementById('cancelDeleteColaboradorBtn');
    const executeDeleteColaboradorBtn = document.getElementById('executeDeleteColaboradorBtn');
    
    if (closeDeleteColaboradorModal) {
        closeDeleteColaboradorModal.addEventListener('click', cerrarModalEliminarColaborador);
    }
    
    if (cancelDeleteColaboradorBtn) {
        cancelDeleteColaboradorBtn.addEventListener('click', cerrarModalEliminarColaborador);
    }

    if (executeDeleteColaboradorBtn && !executeDeleteColaboradorBtn.dataset.listenerAdded) {
        if (!deleteColaboradorBtnDefaultHTML) {
            deleteColaboradorBtnDefaultHTML = executeDeleteColaboradorBtn.innerHTML;
        }
        executeDeleteColaboradorBtn.addEventListener('click', () => eliminarColaborador());
        executeDeleteColaboradorBtn.dataset.listenerAdded = 'true';
    }
    
    // Cerrar modal al hacer clic fuera
    const deleteColaboradorModal = document.getElementById('deleteColaboradorModal');
    if (deleteColaboradorModal) {
        deleteColaboradorModal.addEventListener('click', (e) => {
            if (e.target === deleteColaboradorModal) {
                cerrarModalEliminarColaborador();
            }
        });
    }
}

function inicializarModalesEdicion() {
    // Modal de edición de usuario
    const closeEditUsuarioModal = document.getElementById('closeEditUsuarioModal');
    const cancelEditUsuarioBtn = document.getElementById('cancelEditUsuarioBtn');
    const saveEditUsuarioBtn = document.getElementById('saveEditUsuarioBtn');
    const editUserRol = document.getElementById('editUserRol');
    
    if (closeEditUsuarioModal) {
        closeEditUsuarioModal.addEventListener('click', cerrarModalEditarUsuario);
    }
    
    if (cancelEditUsuarioBtn) {
        cancelEditUsuarioBtn.addEventListener('click', cerrarModalEditarUsuario);
    }
    
    if (saveEditUsuarioBtn) {
        saveEditUsuarioBtn.addEventListener('click', async () => {
            if (usuarioEditandoId) {
                await actualizarUsuario(usuarioEditandoId);
            }
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const editUsuarioModal = document.getElementById('editUsuarioModal');
    if (editUsuarioModal) {
        editUsuarioModal.addEventListener('click', (e) => {
            if (e.target === editUsuarioModal) {
                cerrarModalEditarUsuario();
            }
        });
    }
    
    // Mostrar/ocultar puesto según rol
    if (editUserRol) {
        editUserRol.addEventListener('change', () => {
            const editUserPuestoGroup = document.getElementById('editUserPuestoGroup');
            const editUserPuesto = document.getElementById('editUserPuesto');
            const editColaboradorSelect = document.getElementById('editColaboradorSelect');
            
            // Verificar si hay colaborador vinculado
            const tieneColaborador = editColaboradorSelect && editColaboradorSelect.value;
            
            if (editUserRol.value === 'personal') {
                if (editUserPuestoGroup) editUserPuestoGroup.style.display = 'block';
                if (editUserPuesto) editUserPuesto.required = true;
            } else {
                // Para admin, mostrar puesto solo si hay colaborador vinculado
                if (editUserPuestoGroup) {
                    if (tieneColaborador) {
                        editUserPuestoGroup.style.display = 'block';
                    } else {
                        editUserPuestoGroup.style.display = 'none';
                    }
                }
                if (editUserPuesto) {
                    editUserPuesto.required = false;
                    if (!tieneColaborador) {
                        editUserPuesto.value = '';
                    }
                }
            }
        });
    }
    
    // Modal de edición de colaborador
    const closeEditColaboradorModal = document.getElementById('closeEditColaboradorModal');
    const cancelEditColaboradorBtn = document.getElementById('cancelEditColaboradorBtn');
    const saveEditColaboradorBtn = document.getElementById('saveEditColaboradorBtn');
    
    if (closeEditColaboradorModal) {
        closeEditColaboradorModal.addEventListener('click', cerrarModalEditarColaborador);
    }
    
    if (cancelEditColaboradorBtn) {
        cancelEditColaboradorBtn.addEventListener('click', cerrarModalEditarColaborador);
    }
    
    if (saveEditColaboradorBtn) {
        saveEditColaboradorBtn.addEventListener('click', async () => {
            if (colaboradorEditandoId) {
                await actualizarColaborador(colaboradorEditandoId);
            }
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const editColaboradorModal = document.getElementById('editColaboradorModal');
    if (editColaboradorModal) {
        editColaboradorModal.addEventListener('click', (e) => {
            if (e.target === editColaboradorModal) {
                cerrarModalEditarColaborador();
            }
        });
    }
}

// =====================================================
// FUNCIONES DE USUARIOS
// =====================================================

async function cargarUsuarios() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    try {
        usersList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);"><div class="spinner" style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #007bff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div><p>Cargando usuarios...</p></div>';
        
        const response = await fetch(API_URLS.usuarios);
        const data = await response.json();
        
        if (data.success) {
            usuariosList = data.usuarios;
            actualizarOpcionesFiltroUsuarios();
            mostrarUsuarios(usuariosList);
        } else {
            usersList.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger-color);">Error al cargar usuarios: ${data.error}</div>`;
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        usersList.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger-color);">Error al cargar usuarios: ${error.message}</div>`;
    }
}

function filtrarUsuarioGestion(usuario) {
    const termino = normalizarTexto(usuariosFilterTerm);
    if (termino) {
        const campos = [
            usuario.username,
            usuario.nombre,
            usuario.email,
            usuario.telefono,
            usuario.rol_display,
            usuario.colaborador_nombre,
            usuario.puesto_nombre,
        ];
        const coincide = campos.some(campo => normalizarTexto(campo).includes(termino));
        if (!coincide) {
            return false;
        }
    }

    if (usuariosFilterPuesto) {
        if (usuariosFilterPuesto === '__sin_puesto') {
            if (usuario.puesto_id) {
                return false;
            }
        } else if (usuario.puesto_id !== usuariosFilterPuesto) {
            return false;
        }
    }

    return true;
}

function mostrarUsuarios(usuarios) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    const filtrados = usuarios.filter(filtrarUsuarioGestion);
    
    if (filtrados.length === 0) {
        usersList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">No hay usuarios registrados</div>';
        return;
    }
    
    const html = filtrados.map(usuario => {
        const colaboradorInfo = usuario.tiene_colaborador 
            ? `<div style="margin-top: 8px; padding: 8px; background: rgba(0, 123, 255, 0.1); border-radius: 6px; font-size: 0.9rem; color: #007bff;">
                👤 Vinculado con: <strong>${usuario.colaborador_nombre || 'Colaborador'}</strong>
               </div>`
            : '';
        
        return `
            <div class="user-card" data-usuario-id="${usuario.id}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 8px 0; color: var(--text-primary); font-size: 1.1rem;">${usuario.username}</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${usuario.nombre || 'Sin nombre'}</p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="padding: 4px 12px; background: ${usuario.rol === 'admin' ? 'rgba(220, 53, 69, 0.2)' : 'rgba(0, 123, 255, 0.2)'}; color: ${usuario.rol === 'admin' ? '#dc3545' : '#007bff'}; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                            ${usuario.rol_display}
                        </span>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 16px; font-size: 0.9rem; color: var(--text-secondary);">
                    <div><strong>Email:</strong> ${usuario.email}</div>
                    <div><strong>Teléfono:</strong> ${usuario.telefono || 'No registrado'}</div>
                    <div><strong>Puesto:</strong> ${usuario.puesto_nombre || 'No asignado'}</div>
                    <div><strong>Estado:</strong> ${usuario.activo ? '✅ Activo' : '❌ Inactivo'}</div>
                </div>
                ${colaboradorInfo}
                <div style="display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <button type="button" class="btn-edit-user" data-usuario-id="${usuario.id}" style="flex: 1; padding: 8px 16px; background: rgba(0, 123, 255, 0.1); color: #007bff; border: 1px solid rgba(0, 123, 255, 0.3); border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                    </button>
                    <button type="button" class="btn-delete-user" data-usuario-id="${usuario.id}" data-usuario-username="${usuario.username}" style="flex: 1; padding: 8px 16px; background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    usersList.innerHTML = html;
    
    // Agregar event listeners a los botones
    usersList.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const usuarioId = e.currentTarget.getAttribute('data-usuario-id');
            editarUsuario(usuarioId);
        });
    });
    
    usersList.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const usuarioId = e.currentTarget.getAttribute('data-usuario-id');
            const usuarioUsername = e.currentTarget.getAttribute('data-usuario-username');
            confirmarEliminarUsuario(usuarioId, usuarioUsername);
        });
    });
}

async function cargarColaboradorParaAutocompletar(colaboradorId) {
    try {
        const response = await fetch(API_URLS.obtenerColaborador(colaboradorId));
        const data = await response.json();
        
        if (data.success) {
            const colaborador = data.colaborador;
            colaboradorSeleccionado = colaborador;
            
            const userNombre = document.getElementById('userNombre');
            const userEmail = document.getElementById('userEmail');
            const userTelefono = document.getElementById('userTelefono');
            const userPuesto = document.getElementById('userPuesto');
            const userPuestoGroup = document.getElementById('userPuestoGroup');
            const userRol = document.getElementById('userRol');
            const colaboradorVinculadoMsg = document.getElementById('colaboradorVinculadoMsg');
            
            const bloquearCampoSiTieneValor = (input, valor) => {
                if (!input) return;
                const valorNormalizado = valor ? String(valor).trim() : '';
                if (valorNormalizado) {
                    input.value = valorNormalizado;
                    input.readOnly = true;
                    input.dataset.autocompletado = 'true';
                    input.classList.add('input-bloqueado');
                } else {
                    input.value = '';
                    input.readOnly = false;
                    input.classList.remove('input-bloqueado');
                    delete input.dataset.autocompletado;
                }
            };

            // Mostrar aviso si el colaborador ya tiene usuario
            if (colaboradorVinculadoMsg) {
                colaboradorVinculadoMsg.style.display = colaborador.tiene_usuario ? 'block' : 'none';
            }

            bloquearCampoSiTieneValor(userNombre, colaborador.nombre);
            bloquearCampoSiTieneValor(userEmail, colaborador.correo);
            bloquearCampoSiTieneValor(userTelefono, colaborador.telefono);

            if (userPuesto) {
                if (colaborador.puesto_id) {
                    userPuesto.value = colaborador.puesto_id;
                    if (userPuestoGroup) userPuestoGroup.style.display = 'block';
                } else {
                    userPuesto.value = '';
                    if (userPuestoGroup) userPuestoGroup.style.display = 'none';
                }
                userPuesto.disabled = true;
            }
            if (userRol && userPuesto) {
                userPuesto.required = userRol.value === 'personal';
            }
        }
    } catch (error) {
        console.error('Error al cargar colaborador:', error);
        mostrarMensaje('Error al cargar información del colaborador', 'error');
    }
}

function resetearAutocompletadoUsuario() {
    colaboradorSeleccionado = null;
    
    const userNombre = document.getElementById('userNombre');
    const userEmail = document.getElementById('userEmail');
    const userTelefono = document.getElementById('userTelefono');
    const userPuesto = document.getElementById('userPuesto');
    const userRol = document.getElementById('userRol');
    const userPuestoGroup = document.getElementById('userPuestoGroup');
    const colaboradorVinculadoMsg = document.getElementById('colaboradorVinculadoMsg');
    
    if (userNombre) {
        userNombre.value = '';
        userNombre.readOnly = false;
        userNombre.classList.remove('input-bloqueado');
    }
    if (userEmail) {
        userEmail.value = '';
        userEmail.readOnly = false;
        userEmail.classList.remove('input-bloqueado');
    }
    if (userTelefono) {
        userTelefono.value = '';
        userTelefono.readOnly = false;
        userTelefono.classList.remove('input-bloqueado');
    }
    if (userPuesto) {
        userPuesto.value = '';
        userPuesto.disabled = true;
        if (userPuestoGroup) userPuestoGroup.style.display = 'none';
    }
    if (colaboradorVinculadoMsg) {
        colaboradorVinculadoMsg.style.display = 'none';
    }
    ocultarColaboradorSuggestions();
}

function resetearFormularioUsuario() {
    usuarioEditandoId = null;
    const userForm = document.getElementById('userForm');
    if (userForm) userForm.reset();
    
    resetearAutocompletadoUsuario();
    
    const colaboradorSelect = document.getElementById('colaboradorSelect');
    const colaboradorSearchInput = document.getElementById('colaboradorSearchInput');
    const colaboradorPuestoFilter = document.getElementById('colaboradorPuestoFilter');
    if (colaboradorSelect) {
        colaboradorSelect.value = '';
        colaboradorSelect.disabled = false;
    }
    if (colaboradorSearchInput) {
        colaboradorSearchInput.value = '';
    }
    if (colaboradorPuestoFilter) {
        colaboradorPuestoFilter.value = '';
    }
    colaboradorFilterTerm = '';
    colaboradorFilterPuesto = '';
    actualizarSelectColaboradores();
    
    const userPuestoGroup = document.getElementById('userPuestoGroup');
    if (userPuestoGroup) userPuestoGroup.style.display = 'none';
    
    const userRol = document.getElementById('userRol');
    if (userRol) userRol.value = '';
    
    const userUsername = document.getElementById('userUsername');
    if (userUsername) userUsername.disabled = false;
    
    const userPassword = document.getElementById('userPassword');
    const userPasswordConfirm = document.getElementById('userPasswordConfirm');
    if (userPassword) {
        userPassword.required = true;
        userPassword.placeholder = 'Mínimo 8 caracteres';
    }
    if (userPasswordConfirm) {
        userPasswordConfirm.required = true;
        userPasswordConfirm.placeholder = 'Repita la contraseña';
    }
}

async function crearUsuario() {
    const userForm = document.getElementById('userForm');
    if (!userForm) return;
    
    // Validar formulario antes de enviar
    if (!userForm.checkValidity()) {
        userForm.reportValidity();
        return;
    }
    
    const formData = new FormData(userForm);
    const colaboradorSelect = document.getElementById('colaboradorSelect');
    const password = formData.get('password');
    const passwordConfirm = formData.get('password_confirm');
    
    // Validar contraseña
    if (password.length < 8) {
        mostrarMensaje('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }
    
    if (!/\d/.test(password)) {
        mostrarMensaje('La contraseña debe contener al menos un número', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        mostrarMensaje('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (colaboradorSelect && colaboradorSelect.value) {
        const seleccionado = colaboradorSeleccionado
            ? colaboradorSeleccionado
            : colaboradoresList.find(colab => colab.id === colaboradorSelect.value);
        if (seleccionado) {
            if (!seleccionado.activo) {
                mostrarMensaje('No es posible vincular un colaborador inactivo.', 'error');
                return;
            }
            if (seleccionado.tiene_usuario) {
                mostrarMensaje('El colaborador seleccionado ya tiene un usuario asignado.', 'error');
                return;
            }
        }
    }
    
    const userPuesto = document.getElementById('userPuesto');
    const data = {
        username: formData.get('username'),
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        password: formData.get('password'),
        password_confirm: formData.get('password_confirm'),
        rol: formData.get('rol'),
        puesto_id: userPuesto ? userPuesto.value || null : (formData.get('puesto_id') || null),
        colaborador_id: colaboradorSelect ? colaboradorSelect.value : null,
    };
    
    try {
        const response = await fetch(API_URLS.crearUsuario, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje('Usuario creado exitosamente', 'success');
            userForm.reset();
            cerrarModalCrearUsuario();
            await cargarUsuarios();
            await cargarColaboradoresParaSelect(); // Actualizar lista de colaboradores
        } else {
            mostrarMensaje(result.error || 'Error al crear usuario', 'error');
        }
    } catch (error) {
        console.error('Error al crear usuario:', error);
        mostrarMensaje('Error al crear usuario: ' + error.message, 'error');
    }
}

// =====================================================
// FUNCIONES DE COLABORADORES
// =====================================================

async function cargarColaboradores() {
    const colaboradoresListEl = document.getElementById('colaboradoresList');
    if (!colaboradoresListEl) return;
    
    try {
        colaboradoresListEl.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);"><div class="spinner" style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #007bff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div><p>Cargando colaboradores...</p></div>';
        
        const response = await fetch(API_URLS.colaboradores);
        const data = await response.json();
        
        if (data.success) {
            colaboradoresList = data.colaboradores;
            actualizarOpcionesFiltroColaboradores();
            actualizarOpcionesFiltroColaboradoresGestion();
            mostrarColaboradores(colaboradoresList);
        } else {
            colaboradoresListEl.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger-color);">Error al cargar colaboradores: ${data.error}</div>`;
        }
    } catch (error) {
        console.error('Error al cargar colaboradores:', error);
        colaboradoresListEl.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--danger-color);">Error al cargar colaboradores: ${error.message}</div>`;
    }
}

function filtrarColaboradorGestion(colab) {
    const termino = normalizarTexto(colaboradoresGestionFilterTerm);
    if (termino) {
        const campos = [
            colab.nombre,
            colab.descripcion,
            colab.telefono,
            colab.correo,
            colab.dpi,
            colab.puesto_nombre,
        ];
        const coincide = campos.some(campo => normalizarTexto(campo).includes(termino));
        if (!coincide) {
            return false;
        }
    }

    if (colaboradoresGestionFilterPuesto) {
        if (colaboradoresGestionFilterPuesto === '__sin_puesto') {
            if (colab.puesto_id) {
                return false;
            }
        } else if (colab.puesto_id !== colaboradoresGestionFilterPuesto) {
            return false;
        }
    }

    return true;
}

function mostrarColaboradores(colaboradores) {
    const colaboradoresList = document.getElementById('colaboradoresList');
    if (!colaboradoresList) return;
    
    const filtrados = colaboradores.filter(filtrarColaboradorGestion);
    
    if (filtrados.length === 0) {
        colaboradoresList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">No hay colaboradores registrados</div>';
        return;
    }
    
    const html = filtrados.map(colab => {
        const usuarioInfo = colab.tiene_usuario 
            ? `<div style="margin-top: 8px; padding: 8px; background: rgba(40, 167, 69, 0.1); border-radius: 6px; font-size: 0.9rem; color: #28a745;">
                🔗 Usuario: <strong>${colab.usuario_username || 'Usuario asignado'}</strong>
               </div>`
            : '';
        
        const tipoColab = colab.es_personal_fijo ? 'Personal Fijo' : 'Colaborador Externo';
        
        return `
            <div class="colaborador-card" data-colaborador-id="${colab.id}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 8px 0; color: var(--text-primary); font-size: 1.1rem;">${colab.nombre}</h4>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${tipoColab}</p>
                    </div>
                    <span style="padding: 4px 12px; background: ${colab.activo ? 'rgba(40, 167, 69, 0.2)' : 'rgba(108, 117, 125, 0.2)'}; color: ${colab.activo ? '#28a745' : '#6c757d'}; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                        ${colab.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 16px; font-size: 0.9rem; color: var(--text-secondary);">
                    <div><strong>Puesto:</strong> ${colab.puesto_nombre || 'No asignado'}</div>
                    <div><strong>Correo:</strong> ${colab.correo || 'No registrado'}</div>
                    <div><strong>Teléfono:</strong> ${colab.telefono || 'No registrado'}</div>
                    <div><strong>DPI:</strong> ${colab.dpi || 'No registrado'}</div>
                </div>
                ${usuarioInfo}
                <div style="display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <button type="button" class="btn-edit-colaborador" data-colaborador-id="${colab.id}" style="flex: 1; padding: 8px 16px; background: rgba(0, 123, 255, 0.1); color: #007bff; border: 1px solid rgba(0, 123, 255, 0.3); border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                    </button>
                    <button type="button" class="btn-delete-colaborador" data-colaborador-id="${colab.id}" data-colaborador-nombre="${colab.nombre}" style="flex: 1; padding: 8px 16px; background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    colaboradoresList.innerHTML = html;
    
    // Agregar event listeners a los botones
    colaboradoresList.querySelectorAll('.btn-edit-colaborador').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const colaboradorId = e.currentTarget.getAttribute('data-colaborador-id');
            editarColaborador(colaboradorId);
        });
    });
    
    colaboradoresList.querySelectorAll('.btn-delete-colaborador').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const colaboradorId = e.currentTarget.getAttribute('data-colaborador-id');
            const colaboradorNombre = e.currentTarget.getAttribute('data-colaborador-nombre');
            confirmarEliminarColaborador(colaboradorId, colaboradorNombre);
        });
    });
}

function resetearFormularioColaborador() {
    colaboradorEditandoId = null;
    const colaboradorForm = document.getElementById('colaboradorForm');
    if (colaboradorForm) colaboradorForm.reset();
    
    const colaboradorActivo = document.getElementById('colaboradorActivo');
    if (colaboradorActivo) colaboradorActivo.checked = true;
    
    const colaboradorEsPersonalFijo = document.getElementById('colaboradorEsPersonalFijo');
    if (colaboradorEsPersonalFijo) {
        colaboradorEsPersonalFijo.checked = false;
        colaboradorEsPersonalFijo.disabled = true;
    }
}

async function crearColaborador() {
    const colaboradorForm = document.getElementById('colaboradorForm');
    if (!colaboradorForm) return;
    
    // Validar formulario antes de enviar
    if (!colaboradorForm.checkValidity()) {
        colaboradorForm.reportValidity();
        return;
    }
    
    const formData = new FormData(colaboradorForm);
    const colaboradorEsPersonalFijo = document.getElementById('colaboradorEsPersonalFijo');
    const colaboradorActivo = document.getElementById('colaboradorActivo');
    
    const data = {
        nombre: formData.get('nombre'),
        puesto_id: formData.get('puesto_id') || null,
        descripcion: formData.get('descripcion'),
        telefono: formData.get('telefono'),
        correo: formData.get('correo'),
        dpi: formData.get('dpi'),
        es_personal_fijo: false,
        activo: colaboradorActivo ? colaboradorActivo.checked : true,
    };
    
    try {
        const response = await fetch(API_URLS.crearColaborador, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje('Colaborador creado exitosamente', 'success');
            colaboradorForm.reset();
            cerrarModalCrearColaborador();
            await cargarColaboradores();
            await cargarColaboradoresParaSelect(); // Actualizar lista de colaboradores
        } else {
            mostrarMensaje(result.error || 'Error al crear colaborador', 'error');
        }
    } catch (error) {
        console.error('Error al crear colaborador:', error);
        mostrarMensaje('Error al crear colaborador: ' + error.message, 'error');
    }
}

// =====================================================
// MODAL DE PUESTO
// =====================================================

let origenModalPuesto = null; // 'user' o 'colaborador'

function inicializarModalPuesto() {
    const modal = document.getElementById('createPuestoModal');
    const closePuestoModal = document.getElementById('closePuestoModal');
    const cancelPuestoBtn = document.getElementById('cancelPuestoBtn');
    const savePuestoBtn = document.getElementById('savePuestoBtn');
    
    if (closePuestoModal) {
        closePuestoModal.addEventListener('click', cerrarModalPuesto);
    }
    
    if (cancelPuestoBtn) {
        cancelPuestoBtn.addEventListener('click', cerrarModalPuesto);
    }
    
    if (savePuestoBtn) {
        savePuestoBtn.addEventListener('click', crearPuesto);
    }
    
    // Cerrar modal al hacer clic fuera
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarModalPuesto();
            }
        });
    }
}

function abrirModalPuesto(origen) {
    origenModalPuesto = origen;
    const modal = document.getElementById('createPuestoModal');
    const puestoForm = document.getElementById('puestoForm');
    
    if (modal) {
        // Asegurar que el modal de puesto aparezca encima de otros modales
        modal.style.zIndex = '5600';
        abrirModal(modal);
        // Hacer el backdrop más oscuro cuando está encima de otro modal
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    }
    if (puestoForm) puestoForm.reset();
}

function cerrarModalPuesto() {
    const modal = document.getElementById('createPuestoModal');
    if (modal) {
        cerrarModal(modal);
        // Restaurar el backdrop original
        modal.style.backgroundColor = '';
    }
    origenModalPuesto = null;
}

async function crearPuesto() {
    const puestoForm = document.getElementById('puestoForm');
    if (!puestoForm) return;
    
    const formData = new FormData(puestoForm);
    
    const data = {
        codigo: formData.get('codigo'),
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
    };
    
    try {
        const response = await fetch(API_URLS.crearPuesto, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje('Puesto creado exitosamente', 'success');
            puestoForm.reset();
            cerrarModalPuesto();
            
            // Recargar lista de puestos y actualizar selects
            await cargarPuestos();
            
            // Si el modal se abrió desde un formulario, seleccionar el nuevo puesto
            if (result.puesto && origenModalPuesto) {
                const selectId = origenModalPuesto === 'user' ? 'userPuesto' : 'colaboradorPuesto';
                const select = document.getElementById(selectId);
                if (select) {
                    select.value = result.puesto.id;
                }
            }
        } else {
            mostrarMensaje(result.error || 'Error al crear puesto', 'error');
        }
    } catch (error) {
        console.error('Error al crear puesto:', error);
        mostrarMensaje('Error al crear puesto: ' + error.message, 'error');
    }
}

// =====================================================
// UTILIDADES
// =====================================================

function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return '';
}

function mostrarMensaje(mensaje, tipo) {
    // Crear elemento de mensaje
    const mensajeDiv = document.createElement('div');
    mensajeDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${tipo === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    mensajeDiv.textContent = mensaje;
    
    document.body.appendChild(mensajeDiv);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        mensajeDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(mensajeDiv);
        }, 300);
    }, 3000);
}

// Agregar estilos de animación
if (!document.getElementById('mensajeStyles')) {
    const style = document.createElement('style');
    style.id = 'mensajeStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// =====================================================
// FUNCIONES DE EDICIÓN Y ELIMINACIÓN DE USUARIOS
// =====================================================

let usuarioEditandoId = null;

async function editarUsuario(usuarioId) {
    try {
        usuarioEditandoId = usuarioId;
        
        // Obtener datos del usuario
        const response = await fetch(API_URLS.obtenerUsuario(usuarioId));
        const data = await response.json();
        
        if (!data.success) {
            mostrarMensaje('Error al cargar usuario: ' + (data.error || 'Error desconocido'), 'error');
            return;
        }
        
        const usuario = data.usuario;
        
        // Mostrar modal de edición
        const editUsuarioModal = document.getElementById('editUsuarioModal');
        if (editUsuarioModal) {
            abrirModal(editUsuarioModal);
        }
        
        // Cargar puestos en el select
        await cargarPuestosParaSelect('editUserPuesto');
        
        // Cargar colaboradores para el select
        await cargarColaboradoresParaSelect('editColaboradorSelect');
        
        // Llenar formulario con datos
        const editUserUsername = document.getElementById('editUserUsername');
        const editUserNombre = document.getElementById('editUserNombre');
        const editUserEmail = document.getElementById('editUserEmail');
        const editUserTelefono = document.getElementById('editUserTelefono');
        const editUserPassword = document.getElementById('editUserPassword');
        const editUserPasswordConfirm = document.getElementById('editUserPasswordConfirm');
        const editUserRol = document.getElementById('editUserRol');
        const editUserPuesto = document.getElementById('editUserPuesto');
        const editUserPuestoGroup = document.getElementById('editUserPuestoGroup');
        const editColaboradorSelect = document.getElementById('editColaboradorSelect');
        const editUserActivo = document.getElementById('editUserActivo');
        const editUserInactiveAlert = document.getElementById('editUserInactiveAlert');
        
        if (editUserUsername) {
            editUserUsername.value = usuario.username;
        }
        if (editUserNombre) editUserNombre.value = usuario.nombre || '';
        if (editUserEmail) editUserEmail.value = usuario.email;
        if (editUserTelefono) editUserTelefono.value = usuario.telefono || '';
        if (editUserPassword) {
            editUserPassword.value = '';
        }
        if (editUserPasswordConfirm) {
            editUserPasswordConfirm.value = '';
        }
        if (editUserRol) {
            editUserRol.value = usuario.rol;
        }
        
        // Determinar el puesto a mostrar: primero del usuario, luego del colaborador
        const puestoId = usuario.puesto_id || usuario.colaborador_puesto_id;
        
        // Si hay colaborador vinculado o puesto asignado, mostrar el campo puesto
        if (usuario.tiene_colaborador || puestoId) {
            if (editUserPuestoGroup) editUserPuestoGroup.style.display = 'block';
            if (editUserPuesto && puestoId) {
                editUserPuesto.value = puestoId;
            }
        } else {
            // Si no hay colaborador ni puesto, mostrar según el rol
            if (editUserRol && editUserRol.value === 'personal') {
                if (editUserPuestoGroup) editUserPuestoGroup.style.display = 'block';
            } else {
                if (editUserPuestoGroup) editUserPuestoGroup.style.display = 'none';
            }
        }
        
        // Cargar colaborador vinculado si existe
        if (usuario.tiene_colaborador && editColaboradorSelect) {
            editColaboradorSelect.value = usuario.colaborador_id;
        } else if (editColaboradorSelect) {
            editColaboradorSelect.value = '';
        }
        
        if (editUserActivo) {
            editUserActivo.checked = !!usuario.activo;
            editUserActivo.onchange = () => {
                if (editUserInactiveAlert) {
                    editUserInactiveAlert.style.display = editUserActivo.checked ? 'none' : 'block';
                }
            };
        }
        if (editUserInactiveAlert) {
            editUserInactiveAlert.style.display = usuario.activo ? 'none' : 'block';
        }
        
    } catch (error) {
        console.error('Error al editar usuario:', error);
        mostrarMensaje('Error al cargar usuario: ' + error.message, 'error');
    }
}

async function actualizarUsuario(usuarioId) {
    const editUserForm = document.getElementById('editUserForm');
    if (!editUserForm) return;
    
    // Validar formulario antes de enviar
    if (!editUserForm.checkValidity()) {
        editUserForm.reportValidity();
        return;
    }
    
    const formData = new FormData(editUserForm);
    const editUserPassword = document.getElementById('editUserPassword');
    const editUserPasswordConfirm = document.getElementById('editUserPasswordConfirm');
    const editUserActivo = document.getElementById('editUserActivo');
    
    const data = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        rol: formData.get('rol'),
        puesto_id: formData.get('puesto_id') || null,
        activo: editUserActivo ? editUserActivo.checked : true,
    };
    
    // Solo incluir contraseña si se proporcionó
    if (editUserPassword && editUserPassword.value.trim()) {
        if (editUserPassword.value !== editUserPasswordConfirm.value) {
            mostrarMensaje('Las contraseñas no coinciden', 'error');
            return;
        }
        if (editUserPassword.value.length < 8) {
            mostrarMensaje('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        if (!/\d/.test(editUserPassword.value)) {
            mostrarMensaje('La contraseña debe contener al menos un número', 'error');
            return;
        }
        data.password = editUserPassword.value;
        data.password_confirm = editUserPasswordConfirm.value;
    }
    
    try {
        const response = await fetch(API_URLS.actualizarUsuario(usuarioId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje('Usuario actualizado exitosamente', 'success');
            cerrarModalEditarUsuario();
            await cargarUsuarios();
            // También recargar colaboradores para reflejar cambios en el puesto
            await cargarColaboradores();
        } else {
            mostrarMensaje(result.error || 'Error al actualizar usuario', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        mostrarMensaje('Error al actualizar usuario: ' + error.message, 'error');
    }
}

function cancelarEdicionUsuario() {
    cerrarModalEditarUsuario();
}

function cerrarModalEditarUsuario() {
    usuarioEditandoId = null;
    
    const editUsuarioModal = document.getElementById('editUsuarioModal');
    if (editUsuarioModal) {
        cerrarModal(editUsuarioModal);
    }
    
    // Limpiar formulario
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) editUserForm.reset();
    
    const editUserPuestoGroup = document.getElementById('editUserPuestoGroup');
    if (editUserPuestoGroup) editUserPuestoGroup.style.display = 'none';
    
    const editUserInactiveAlert = document.getElementById('editUserInactiveAlert');
    if (editUserInactiveAlert) {
        editUserInactiveAlert.style.display = 'none';
    }
}

function restoreDeleteUsuarioButton() {
    const executeDeleteUsuarioBtn = document.getElementById('executeDeleteUsuarioBtn');
    if (!executeDeleteUsuarioBtn) return;
    executeDeleteUsuarioBtn.disabled = false;
    if (deleteUsuarioBtnDefaultHTML) {
        executeDeleteUsuarioBtn.innerHTML = deleteUsuarioBtnDefaultHTML;
    } else {
        executeDeleteUsuarioBtn.textContent = 'Eliminar Usuario';
    }
}

function resetDeleteUsuarioModalState({ clearInputs = true } = {}) {
    const errorMessage = document.getElementById('deleteUsuarioErrorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    if (clearInputs) {
        const usernameInput = document.getElementById('delete_usuario_username');
        const passwordInput = document.getElementById('delete_usuario_password');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }

    restoreDeleteUsuarioButton();
}

function confirmarEliminarUsuario(usuarioId, usuarioUsername) {
    const modal = document.getElementById('deleteUsuarioModal');
    const deleteUsuarioName = document.getElementById('deleteUsuarioName');
    
    if (!modal) {
        mostrarMensaje('Modal de confirmación no encontrado', 'error');
        return;
    }

    usuarioIdParaEliminar = usuarioId;
    
    if (deleteUsuarioName) {
        deleteUsuarioName.textContent = usuarioUsername || '';
    }
    
    resetDeleteUsuarioModalState();
    abrirModal(modal);
}

async function eliminarUsuario(usuarioId = null) {
    const targetUsuarioId = usuarioId ?? usuarioIdParaEliminar;
    if (!targetUsuarioId) {
        mostrarMensaje('No se ha seleccionado un usuario para eliminar.', 'error');
        return;
    }

    const deleteUsuarioUsername = document.getElementById('delete_usuario_username');
    const deleteUsuarioPassword = document.getElementById('delete_usuario_password');
    const deleteUsuarioErrorMessage = document.getElementById('deleteUsuarioErrorMessage');
    const executeDeleteUsuarioBtn = document.getElementById('executeDeleteUsuarioBtn');
    
    if (!deleteUsuarioUsername || !deleteUsuarioPassword) {
        mostrarMensaje('Error: Campos de confirmación no encontrados', 'error');
        return;
    }
    
    const username = deleteUsuarioUsername.value.trim();
    const password = deleteUsuarioPassword.value;
    
    if (!username || !password) {
        if (deleteUsuarioErrorMessage) {
            deleteUsuarioErrorMessage.textContent = 'Usuario y contraseña son requeridos';
            deleteUsuarioErrorMessage.style.display = 'block';
        }
        return;
    }
    
    if (executeDeleteUsuarioBtn) {
        executeDeleteUsuarioBtn.disabled = true;
        executeDeleteUsuarioBtn.textContent = 'Verificando...';
    }

    // Verificar credenciales de administrador
    try {
        const verifyResponse = await fetch('/api/verificar-admin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({ username, password }),
        });
        
        const verifyResult = await verifyResponse.json();
        
        if (!verifyResult.success) {
            if (deleteUsuarioErrorMessage) {
                deleteUsuarioErrorMessage.textContent = verifyResult.error || 'Credenciales incorrectas';
                deleteUsuarioErrorMessage.style.display = 'block';
            }
            restoreDeleteUsuarioButton();
            return;
        }

        if (executeDeleteUsuarioBtn) {
            executeDeleteUsuarioBtn.textContent = 'Eliminando...';
        }

        // Si las credenciales son correctas, proceder con la eliminación
        const response = await fetch(API_URLS.eliminarUsuario(targetUsuarioId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje('Usuario eliminado exitosamente', 'success');
            cerrarModalEliminarUsuario();
            await cargarUsuarios();
            await cargarColaboradoresParaSelect(); // Actualizar lista de colaboradores
        } else {
            if (deleteUsuarioErrorMessage) {
                deleteUsuarioErrorMessage.textContent = result.error || 'Error al eliminar usuario';
                deleteUsuarioErrorMessage.style.display = 'block';
            }
            restoreDeleteUsuarioButton();
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (deleteUsuarioErrorMessage) {
            deleteUsuarioErrorMessage.textContent = 'Error al eliminar usuario: ' + error.message;
            deleteUsuarioErrorMessage.style.display = 'block';
        } else {
            mostrarMensaje('Error al eliminar usuario: ' + error.message, 'error');
        }
        restoreDeleteUsuarioButton();
    }
}

function cerrarModalEliminarUsuario({ clearInputs = true } = {}) {
    const modal = document.getElementById('deleteUsuarioModal');
    if (modal) cerrarModal(modal);
    resetDeleteUsuarioModalState({ clearInputs });
    usuarioIdParaEliminar = null;
}

// =====================================================
// FUNCIONES DE EDICIÓN Y ELIMINACIÓN DE COLABORADORES
// =====================================================

let colaboradorEditandoId = null;

async function editarColaborador(colaboradorId) {
    try {
        colaboradorEditandoId = colaboradorId;
        colaboradorEditandoDatos = null;
        
        // Obtener datos del colaborador
        const response = await fetch(API_URLS.obtenerColaborador(colaboradorId));
        const data = await response.json();
        
        if (!data.success) {
            mostrarMensaje('Error al cargar colaborador: ' + (data.error || 'Error desconocido'), 'error');
            return;
        }
        
        const colaborador = data.colaborador;
        colaboradorEditandoDatos = colaborador;
        
        // Mostrar modal de edición
        const editColaboradorModal = document.getElementById('editColaboradorModal');
        if (editColaboradorModal) {
            abrirModal(editColaboradorModal);
        }
        
        // Cargar puestos en el select
        await cargarPuestosParaSelect('editColaboradorPuesto');
        
        // Llenar formulario con datos
        const editColaboradorNombre = document.getElementById('editColaboradorNombre');
        const editColaboradorPuesto = document.getElementById('editColaboradorPuesto');
        const editColaboradorDescripcion = document.getElementById('editColaboradorDescripcion');
        const editColaboradorTelefono = document.getElementById('editColaboradorTelefono');
        const editColaboradorCorreo = document.getElementById('editColaboradorCorreo');
        const editColaboradorDpi = document.getElementById('editColaboradorDpi');
        const editColaboradorPersonalFijoStatus = document.getElementById('editColaboradorPersonalFijoStatus');
        const editColaboradorActivo = document.getElementById('editColaboradorActivo');
        
        if (editColaboradorNombre) editColaboradorNombre.value = colaborador.nombre;
        if (editColaboradorPuesto && colaborador.puesto_id) editColaboradorPuesto.value = colaborador.puesto_id;
        if (editColaboradorDescripcion) editColaboradorDescripcion.value = colaborador.descripcion || '';
        if (editColaboradorTelefono) editColaboradorTelefono.value = colaborador.telefono || '';
        if (editColaboradorCorreo) editColaboradorCorreo.value = colaborador.correo || '';
        if (editColaboradorDpi) editColaboradorDpi.value = colaborador.dpi || '';
        if (editColaboradorPersonalFijoStatus) {
            if (colaborador.es_personal_fijo) {
                editColaboradorPersonalFijoStatus.textContent = 'Personal fijo (con usuario)';
                editColaboradorPersonalFijoStatus.style.background = 'rgba(13, 110, 253, 0.15)';
                editColaboradorPersonalFijoStatus.style.color = '#0d6efd';
            } else {
                editColaboradorPersonalFijoStatus.textContent = 'Sin usuario asignado';
                editColaboradorPersonalFijoStatus.style.background = 'rgba(108, 117, 125, 0.15)';
                editColaboradorPersonalFijoStatus.style.color = '#6c757d';
            }
        }
        if (editColaboradorActivo) editColaboradorActivo.checked = colaborador.activo;
        
    } catch (error) {
        console.error('Error al editar colaborador:', error);
        mostrarMensaje('Error al cargar colaborador: ' + error.message, 'error');
    }
}

async function actualizarColaborador(colaboradorId) {
    const editColaboradorForm = document.getElementById('editColaboradorForm');
    if (!editColaboradorForm) return;
    
    // Validar formulario antes de enviar
    if (!editColaboradorForm.checkValidity()) {
        editColaboradorForm.reportValidity();
        return;
    }
    
    const formData = new FormData(editColaboradorForm);
    const editColaboradorActivo = document.getElementById('editColaboradorActivo');
    
    const data = {
        nombre: formData.get('nombre'),
        puesto_id: formData.get('puesto_id') || null,
        descripcion: formData.get('descripcion'),
        telefono: formData.get('telefono'),
        correo: formData.get('correo'),
        dpi: formData.get('dpi'),
        es_personal_fijo: colaboradorEditandoDatos ? colaboradorEditandoDatos.es_personal_fijo : false,
        activo: editColaboradorActivo ? editColaboradorActivo.checked : true,
    };
    
    try {
        const response = await fetch(API_URLS.actualizarColaborador(colaboradorId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje('Colaborador actualizado exitosamente', 'success');
            cerrarModalEditarColaborador();
            await cargarColaboradores();
            // También recargar usuarios para reflejar cambios en campos comunes
            await cargarUsuarios();
            await cargarColaboradoresParaSelect(); // Actualizar lista de colaboradores
        } else {
            mostrarMensaje(result.error || 'Error al actualizar colaborador', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar colaborador:', error);
        mostrarMensaje('Error al actualizar colaborador: ' + error.message, 'error');
    }
}

function cancelarEdicionColaborador() {
    cerrarModalEditarColaborador();
}

function cerrarModalEditarColaborador() {
    colaboradorEditandoId = null;
    colaboradorEditandoDatos = null;
    
    const editColaboradorModal = document.getElementById('editColaboradorModal');
    if (editColaboradorModal) {
        cerrarModal(editColaboradorModal);
    }
    
    // Limpiar formulario
    const editColaboradorForm = document.getElementById('editColaboradorForm');
    if (editColaboradorForm) editColaboradorForm.reset();
    
    const editColaboradorActivo = document.getElementById('editColaboradorActivo');
    if (editColaboradorActivo) editColaboradorActivo.checked = true;

    const editColaboradorPersonalFijoStatus = document.getElementById('editColaboradorPersonalFijoStatus');
    if (editColaboradorPersonalFijoStatus) {
        editColaboradorPersonalFijoStatus.textContent = 'Sin usuario asignado';
        editColaboradorPersonalFijoStatus.style.background = 'rgba(108, 117, 125, 0.15)';
        editColaboradorPersonalFijoStatus.style.color = '#6c757d';
    }
}

function restoreDeleteColaboradorButton() {
    const executeDeleteColaboradorBtn = document.getElementById('executeDeleteColaboradorBtn');
    if (!executeDeleteColaboradorBtn) return;
    executeDeleteColaboradorBtn.disabled = false;
    if (deleteColaboradorBtnDefaultHTML) {
        executeDeleteColaboradorBtn.innerHTML = deleteColaboradorBtnDefaultHTML;
    } else {
        executeDeleteColaboradorBtn.textContent = 'Eliminar Colaborador';
    }
}

function resetDeleteColaboradorModalState({ clearInputs = true } = {}) {
    const errorMessage = document.getElementById('deleteColaboradorErrorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    if (clearInputs) {
        const usernameInput = document.getElementById('delete_colaborador_username');
        const passwordInput = document.getElementById('delete_colaborador_password');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }

    restoreDeleteColaboradorButton();
}

function confirmarEliminarColaborador(colaboradorId, colaboradorNombre) {
    const modal = document.getElementById('deleteColaboradorModal');
    const deleteColaboradorName = document.getElementById('deleteColaboradorName');
    
    if (!modal) {
        mostrarMensaje('Modal de confirmación no encontrado', 'error');
        return;
    }

    colaboradorIdParaEliminar = colaboradorId;
    
    if (deleteColaboradorName) {
        deleteColaboradorName.textContent = colaboradorNombre || '';
    }
    
    resetDeleteColaboradorModalState();
    abrirModal(modal);
}

async function eliminarColaborador(colaboradorId = null) {
    const targetColaboradorId = colaboradorId ?? colaboradorIdParaEliminar;
    if (!targetColaboradorId) {
        mostrarMensaje('No se ha seleccionado un colaborador para eliminar.', 'error');
        return;
    }

    const deleteColaboradorUsername = document.getElementById('delete_colaborador_username');
    const deleteColaboradorPassword = document.getElementById('delete_colaborador_password');
    const deleteColaboradorErrorMessage = document.getElementById('deleteColaboradorErrorMessage');
    const executeDeleteColaboradorBtn = document.getElementById('executeDeleteColaboradorBtn');
    
    if (!deleteColaboradorUsername || !deleteColaboradorPassword) {
        mostrarMensaje('Error: Campos de confirmación no encontrados', 'error');
        return;
    }
    
    const username = deleteColaboradorUsername.value.trim();
    const password = deleteColaboradorPassword.value;
    
    if (!username || !password) {
        if (deleteColaboradorErrorMessage) {
            deleteColaboradorErrorMessage.textContent = 'Usuario y contraseña son requeridos';
            deleteColaboradorErrorMessage.style.display = 'block';
        }
        return;
    }
    
    if (executeDeleteColaboradorBtn) {
        executeDeleteColaboradorBtn.disabled = true;
        executeDeleteColaboradorBtn.textContent = 'Verificando...';
    }

    // Verificar credenciales de administrador
    try {
        const verifyResponse = await fetch('/api/verificar-admin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({ username, password }),
        });
        
        const verifyResult = await verifyResponse.json();
        
        if (!verifyResult.success) {
            if (deleteColaboradorErrorMessage) {
                deleteColaboradorErrorMessage.textContent = verifyResult.error || 'Credenciales incorrectas';
                deleteColaboradorErrorMessage.style.display = 'block';
            }
            restoreDeleteColaboradorButton();
            return;
        }

        if (executeDeleteColaboradorBtn) {
            executeDeleteColaboradorBtn.textContent = 'Eliminando...';
        }
        
        // Si las credenciales son correctas, proceder con la eliminación
        const response = await fetch(API_URLS.eliminarColaborador(targetColaboradorId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarMensaje('Colaborador eliminado exitosamente', 'success');
            cerrarModalEliminarColaborador();
            await cargarColaboradores();
            await cargarColaboradoresParaSelect(); // Actualizar lista de colaboradores
        } else {
            if (deleteColaboradorErrorMessage) {
                deleteColaboradorErrorMessage.textContent = result.error || 'Error al eliminar colaborador';
                deleteColaboradorErrorMessage.style.display = 'block';
            }
            restoreDeleteColaboradorButton();
        }
    } catch (error) {
        console.error('Error al eliminar colaborador:', error);
        if (deleteColaboradorErrorMessage) {
            deleteColaboradorErrorMessage.textContent = 'Error al eliminar colaborador: ' + error.message;
            deleteColaboradorErrorMessage.style.display = 'block';
        } else {
            mostrarMensaje('Error al eliminar colaborador: ' + error.message, 'error');
        }
        restoreDeleteColaboradorButton();
    }
}

function cerrarModalEliminarColaborador({ clearInputs = true } = {}) {
    const modal = document.getElementById('deleteColaboradorModal');
    if (modal) cerrarModal(modal);
    resetDeleteColaboradorModalState({ clearInputs });
    colaboradorIdParaEliminar = null;
}

// =====================================================
// VALIDACIONES Y CONTROLES DE ENTRADA
// =====================================================

function inicializarValidaciones() {
    // Validación de entrada solo números para teléfono
    const telefonos = ['userTelefono', 'editUserTelefono', 'colaboradorTelefono', 'editColaboradorTelefono'];
    telefonos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
            input.addEventListener('keypress', (e) => {
                if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                }
            });
        }
    });

    // Validación de entrada solo números para DPI
    const dpiInputs = ['colaboradorDpi', 'editColaboradorDpi'];
    dpiInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
            input.addEventListener('keypress', (e) => {
                if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                }
            });
        }
    });

    // Validación de entrada solo letras para nombre
    const nombres = ['userNombre', 'editUserNombre', 'colaboradorNombre', 'editColaboradorNombre'];
    nombres.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                // Permitir letras, espacios y caracteres especiales de español
                e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
            });
        }
    });

    // Validación de email personalizada
    const emails = ['userEmail', 'editUserEmail', 'colaboradorCorreo', 'editColaboradorCorreo'];
    emails.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                // No permitir que empiece con @
                if (value.startsWith('@')) {
                    e.target.value = value.substring(1);
                }
            });
            
            input.addEventListener('blur', (e) => {
                validarEmail(e.target);
            });
        }
    });

    // Validación de contraseña en tiempo real
    const passwordInputs = ['userPassword', 'editUserPassword'];
    passwordInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                validarPasswordStrength(id, e.target.value);
                // También validar coincidencia cuando cambia la contraseña principal
                const confirmId = id === 'userPassword' ? 'userPasswordConfirm' : 'editUserPasswordConfirm';
                validarPasswordMatch(confirmId);
            });
        }
    });

    // Validación de coincidencia de contraseñas
    const passwordConfirmInputs = ['userPasswordConfirm', 'editUserPasswordConfirm'];
    passwordConfirmInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                validarPasswordMatch(id);
            });
        }
    });

    // Validar contraseña también cuando se edita
    const editPasswordInput = document.getElementById('editUserPassword');
    if (editPasswordInput) {
        editPasswordInput.addEventListener('input', (e) => {
            if (e.target.value) {
                validarPasswordStrength('editUserPassword', e.target.value);
                document.getElementById('editUserPasswordStrength').style.display = 'block';
            } else {
                document.getElementById('editUserPasswordStrength').style.display = 'none';
            }
        });
    }
}

function validarEmail(input) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (input.value && !emailPattern.test(input.value)) {
        input.setCustomValidity('Ingrese un correo electrónico válido');
        input.reportValidity();
    } else {
        input.setCustomValidity('');
    }
}

function validarPasswordStrength(inputId, password) {
    const lengthEl = document.getElementById(inputId === 'userPassword' ? 'passwordLength' : 'editPasswordLength');
    const numberEl = document.getElementById(inputId === 'userPassword' ? 'passwordNumber' : 'editPasswordNumber');
    const uppercaseEl = document.getElementById(inputId === 'userPassword' ? 'passwordUppercase' : 'editPasswordUppercase');

    if (!lengthEl || !numberEl || !uppercaseEl) return;

    // Validar longitud
    if (password.length >= 8) {
        lengthEl.style.color = '#4caf50';
        lengthEl.textContent = '✓ Mínimo 8 caracteres';
    } else {
        lengthEl.style.color = 'var(--text-muted)';
        lengthEl.textContent = '✗ Mínimo 8 caracteres';
    }

    // Validar número
    if (/\d/.test(password)) {
        numberEl.style.color = '#4caf50';
        numberEl.textContent = '✓ Al menos un número';
    } else {
        numberEl.style.color = 'var(--text-muted)';
        numberEl.textContent = '✗ Al menos un número';
    }

    // Validar mayúscula (recomendado)
    if (/[A-Z]/.test(password)) {
        uppercaseEl.style.color = '#4caf50';
        uppercaseEl.textContent = '✓ Recomendado: una mayúscula';
    } else {
        uppercaseEl.style.color = 'var(--text-muted)';
        uppercaseEl.textContent = '💡 Recomendado: una mayúscula';
    }
}

function validarPasswordMatch(confirmInputId) {
    const isEdit = confirmInputId === 'editUserPasswordConfirm';
    const passwordInput = document.getElementById(isEdit ? 'editUserPassword' : 'userPassword');
    const confirmInput = document.getElementById(confirmInputId);
    const matchEl = document.getElementById(isEdit ? 'editUserPasswordMatch' : 'userPasswordMatch');

    if (!passwordInput || !confirmInput || !matchEl) return;

    if (confirmInput.value) {
        if (passwordInput.value === confirmInput.value) {
            matchEl.textContent = '✓ Las contraseñas coinciden';
            matchEl.style.color = '#4caf50';
            confirmInput.setCustomValidity('');
        } else {
            matchEl.textContent = '✗ Las contraseñas no coinciden';
            matchEl.style.color = '#f44336';
            confirmInput.setCustomValidity('Las contraseñas no coinciden');
        }
    } else {
        matchEl.textContent = '';
        confirmInput.setCustomValidity('');
    }
}

function inicializarPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle-btn');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            if (!passwordInput) return;

            const eyeIcon = button.querySelector('.eye-icon');
            const eyeOffIcon = button.querySelector('.eye-off-icon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                if (eyeIcon) eyeIcon.style.display = 'none';
                if (eyeOffIcon) eyeOffIcon.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                if (eyeIcon) eyeIcon.style.display = 'block';
                if (eyeOffIcon) eyeOffIcon.style.display = 'none';
            }
        });
    });
}

// =====================================================
// FUNCIONES DE MODALES DE CREACIÓN
// =====================================================

function cerrarModalCrearUsuario() {
    const createUsuarioModal = document.getElementById('createUsuarioModal');
    if (createUsuarioModal) {
        cerrarModal(createUsuarioModal);
    }
    
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.reset();
        resetearFormularioUsuario();
    }
}

function cerrarModalCrearColaborador() {
    const createColaboradorModal = document.getElementById('createColaboradorModal');
    if (createColaboradorModal) {
        cerrarModal(createColaboradorModal);
    }
    
    const colaboradorForm = document.getElementById('colaboradorForm');
    if (colaboradorForm) {
        colaboradorForm.reset();
        resetearFormularioColaborador();
    }
}
