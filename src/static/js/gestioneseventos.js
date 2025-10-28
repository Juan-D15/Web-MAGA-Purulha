// ======================================
// GESTIÓN DE EVENTOS - MAGA PURULHÁ
// ======================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Inicializando Gestión de Eventos...');
    
    // ===== VARIABLES GLOBALES =====
    let comunidadesList = [];
    let personalList = [];
    let beneficiariosList = [];
    let selectedCommunitiesList = [];
    let selectedPersonnelList = [];
    let selectedBeneficiariosList = [];
    let accumulatedFiles = []; // Archivos acumulados
    let beneficiariosNuevos = []; // Beneficiarios a crear
    
    // ===== ELEMENTOS DEL DOM =====
    const mainView = document.getElementById('mainView');
    const createEventView = document.getElementById('createEventView');
    const manageEventView = document.getElementById('manageEventView');
    
    // Botones de navegación
    const openCreateEventBtn = document.getElementById('openCreateEventBtn');
    const openManageEventBtn = document.getElementById('openManageEventBtn');
    const backFromCreateBtn = document.getElementById('backFromCreateBtn');
    const backFromManageBtn = document.getElementById('backFromManageBtn');
    
    // Formulario
    const eventForm = document.getElementById('eventForm');
    const fileInput = document.getElementById('evidences');
    const filePreview = document.getElementById('filePreview');
    
    // ===== FUNCIONES DE NAVEGACIÓN =====
    function showMainView() {
        mainView.style.display = 'block';
        createEventView.style.display = 'none';
        manageEventView.style.display = 'none';
    }
    
    function showCreateEventView() {
        mainView.style.display = 'none';
        createEventView.style.display = 'block';
        manageEventView.style.display = 'none';
    }
    
    function showManageEventView() {
        mainView.style.display = 'none';
        createEventView.style.display = 'none';
        manageEventView.style.display = 'block';
    }
    
    // Event listeners de navegación
    if (openCreateEventBtn) {
        openCreateEventBtn.addEventListener('click', showCreateEventView);
    }
    
    if (openManageEventBtn) {
        openManageEventBtn.addEventListener('click', showManageEventView);
    }
    
    if (backFromCreateBtn) {
        backFromCreateBtn.addEventListener('click', showMainView);
    }
    
    if (backFromManageBtn) {
        backFromManageBtn.addEventListener('click', showMainView);
    }
    
    // ===== CARGAR DATOS DESDE LA API =====
    async function cargarDatos() {
        try {
            // Cargar comunidades
            const responseComunidades = await fetch('/api/comunidades/');
            if (responseComunidades.ok) {
                const dataComunidades = await responseComunidades.json();
                comunidadesList = dataComunidades;
                console.log('✅ Comunidades cargadas:', comunidadesList.length);
            }
            
            // Cargar personal
            const responsePersonal = await fetch('/api/personal/');
            if (responsePersonal.ok) {
                const dataPersonal = await responsePersonal.json();
                personalList = dataPersonal;
                console.log('✅ Personal cargado:', personalList.length);
                renderPersonalList();
            }
            
            // Ya no cargamos beneficiarios de la API (se crean en el formulario)
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        }
    }
    
    // Cargar datos al iniciar
    cargarDatos();
    
    // Cargar cambios recientes
    cargarCambiosRecientes();
    
    // ===== RENDERIZAR LISTA DE PERSONAL =====
    function renderPersonalList() {
        const personnelList = document.getElementById('personnelList');
        if (!personnelList) return;
        
        personnelList.innerHTML = '';
        
        console.log('🔄 Renderizando personal. IDs preseleccionados:', selectedPersonnelList);
        
        personalList.forEach(persona => {
            const item = document.createElement('div');
            item.className = 'personnel-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `personal-${persona.id}`;
            checkbox.value = persona.id;
            
            // Verificar si el ID está en la lista preseleccionada
            // selectedPersonnelList puede contener objetos {id, username, rol} o solo IDs (strings)
            const isSelected = selectedPersonnelList.some(p => {
                if (typeof p === 'object') {
                    return p.id === persona.id;
                } else {
                    return p === persona.id;
                }
            });
            
            checkbox.checked = isSelected;
            
            if (isSelected) {
                console.log(`✓ Personal marcado: ${persona.username} (${persona.id})`);
            }
            
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // Agregar como objeto
                    if (!selectedPersonnelList.some(p => (typeof p === 'object' ? p.id : p) === persona.id)) {
                        selectedPersonnelList.push({
                            id: persona.id,
                            username: persona.username,
                            nombre: persona.nombre,  // Incluir nombre completo
                            rol: persona.rol_display
                        });
                        const displayName = persona.nombre || persona.username;
                        console.log(`➕ Personal agregado: ${displayName}`);
                    }
                } else {
                    // Filtrar el personal removido
                    selectedPersonnelList = selectedPersonnelList.filter(p => {
                        const pId = typeof p === 'object' ? p.id : p;
                        return pId !== persona.id;
                    });
                    const displayName = persona.nombre || persona.username;
                    console.log(`➖ Personal removido: ${displayName}`);
                }
                updateSelectedPersonnelDisplay();
            });
            
            const label = document.createElement('label');
            label.htmlFor = `personal-${persona.id}`;
            
            // Crear estructura mejorada para mostrar nombre, puesto y rol
            const nombreDisplay = persona.nombre || persona.username;  // Usar nombre completo o username
            const puestoInfo = persona.puesto || 'Sin puesto asignado';
            const rolInfo = persona.rol_display || persona.rol || 'Personal';
            
            label.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-weight: 600; color: #f8f9fa; font-size: 0.95rem;">${nombreDisplay}</span>
                    <span style="font-size: 0.85rem; color: #007bff; font-weight: 500;">${puestoInfo}</span>
                    <span style="font-size: 0.8rem; color: #b8c5d1; text-transform: capitalize;">${rolInfo}</span>
                </div>
            `;
            
            item.appendChild(checkbox);
            item.appendChild(label);
            personnelList.appendChild(item);
        });
        
        console.log(`✅ ${personalList.length} personal renderizados, ${selectedPersonnelList.length} seleccionados`);
    }
    
    function updateSelectedPersonnelDisplay() {
        const selectedPersonnel = document.getElementById('selectedPersonnel');
        if (!selectedPersonnel) return;
        
        const count = selectedPersonnelList.length;
        const icon = count > 0 ? '✓' : '';
        const text = count === 1 ? '1 persona seleccionada' : `${count} personas seleccionadas`;
        
        selectedPersonnel.innerHTML = `
            <span class="selected-count" style="display: flex; align-items: center; gap: 6px;">
                ${count > 0 ? `<span style="color: #28a745; font-size: 16px;">${icon}</span>` : ''}
                ${text}
            </span>
        `;
    }
    
    // ===== GESTIÓN DE BENEFICIARIOS =====
    const addBeneficiaryBtn = document.getElementById('addBeneficiaryBtn');
    const addBeneficiaryModal = document.getElementById('addBeneficiaryModal');
    const closeBeneficiaryModalBtn = document.getElementById('closeBeneficiaryModal');
    const cancelBeneficiaryBtn = document.getElementById('cancelBeneficiaryBtn');
    const saveBeneficiaryBtn = document.getElementById('saveBeneficiaryBtn');
    const beneficiaryForm = document.getElementById('beneficiaryForm');
    const benefTipoSelect = document.getElementById('benef_tipo');
    const beneficiariesContainer = document.getElementById('beneficiariesContainer');
    
    let beneficiariosExistentes = []; // Beneficiarios ya asociados al evento (en modo edición)
    let beneficiariosEliminados = []; // IDs de beneficiarios a eliminar
    let beneficiariosModificados = []; // Beneficiarios existentes que fueron modificados
    let evidenciasExistentes = []; // Evidencias ya asociadas al evento
    let evidenciasEliminadas = []; // IDs de evidencias a eliminar
    let beneficiarioEnEdicion = null; // Beneficiario que se está editando (puede ser nuevo o existente)
    
    // Ocultar modal al inicio
    if (addBeneficiaryModal) {
        addBeneficiaryModal.classList.remove('show');
        addBeneficiaryModal.style.display = 'none';
    }
    
    // Abrir modal
    if (addBeneficiaryBtn) {
        addBeneficiaryBtn.addEventListener('click', function() {
            console.log('🔘 Abriendo modal de beneficiarios...');
            beneficiarioEnEdicion = null; // Resetear edición
            addBeneficiaryModal.style.display = 'flex';
            setTimeout(() => {
                addBeneficiaryModal.classList.add('show');
            }, 10);
            beneficiaryForm.reset();
            hideAllBeneficiaryFields();
            
            // Cambiar título del modal
            const modalTitle = document.querySelector('#addBeneficiaryModal .modal-title');
            if (modalTitle) modalTitle.textContent = 'Agregar Beneficiario';
            
            // Cambiar texto del botón
            if (saveBeneficiaryBtn) saveBeneficiaryBtn.textContent = 'Agregar Beneficiario';
        });
    }
    
    // Cerrar modal
    function closeBeneficiaryModal() {
        addBeneficiaryModal.classList.remove('show');
        setTimeout(() => {
            addBeneficiaryModal.style.display = 'none';
        }, 300);
        beneficiaryForm.reset();
        hideAllBeneficiaryFields();
    }
    
    if (closeBeneficiaryModalBtn) {
        closeBeneficiaryModalBtn.addEventListener('click', closeBeneficiaryModal);
    }
    
    if (cancelBeneficiaryBtn) {
        cancelBeneficiaryBtn.addEventListener('click', closeBeneficiaryModal);
    }
    
    // Cerrar modal al hacer click fuera
    if (addBeneficiaryModal) {
        addBeneficiaryModal.addEventListener('click', function(e) {
            if (e.target === addBeneficiaryModal) {
                closeBeneficiaryModal();
            }
        });
    }
    
    // Cambiar campos según tipo
    if (benefTipoSelect) {
        benefTipoSelect.addEventListener('change', function() {
            hideAllBeneficiaryFields();
            const tipo = this.value;
            console.log('🔄 Tipo seleccionado:', tipo);
        if (tipo === 'individual') {
            document.getElementById('campos_individual').style.display = 'block';
        } else if (tipo === 'familia') {
            document.getElementById('campos_familia').style.display = 'block';
        } else if (tipo === 'institución') {
            document.getElementById('campos_institucion').style.display = 'block';
        } else if (tipo === 'otro') {
            document.getElementById('campos_otro').style.display = 'block';
        }
        });
    }
    
    function hideAllBeneficiaryFields() {
        document.getElementById('campos_individual').style.display = 'none';
        document.getElementById('campos_familia').style.display = 'none';
        document.getElementById('campos_institucion').style.display = 'none';
        document.getElementById('campos_otro').style.display = 'none';
    }
    
    // Guardar beneficiario
    if (saveBeneficiaryBtn) {
        saveBeneficiaryBtn.addEventListener('click', function() {
            const tipo = benefTipoSelect.value;
            
            if (!tipo) {
                alert('Por favor, selecciona un tipo de beneficiario');
                return;
            }
            
            let beneficiario = {
                tipo: tipo,
                temporal_id: Date.now() // ID temporal para identificarlo en el frontend
            };
            
            // Recopilar datos según tipo
            if (tipo === 'individual') {
                const nombre = document.getElementById('benef_ind_nombre').value;
                const apellido = document.getElementById('benef_ind_apellido').value;
                
                if (!nombre || !apellido) {
                    alert('Por favor, completa los campos obligatorios (Nombre y Apellido)');
                    return;
                }
                
                beneficiario.nombre = nombre;
                beneficiario.apellido = apellido;
                beneficiario.dpi = document.getElementById('benef_ind_dpi').value || null;
                beneficiario.fecha_nacimiento = document.getElementById('benef_ind_fecha_nac').value || null;
                beneficiario.genero = document.getElementById('benef_ind_genero').value || null;
                beneficiario.telefono = document.getElementById('benef_ind_telefono').value || null;
                beneficiario.display_name = `${nombre} ${apellido}`;
                
            } else if (tipo === 'familia') {
                const nombreFamilia = document.getElementById('benef_fam_nombre').value;
                const jefeFamilia = document.getElementById('benef_fam_jefe').value;
                
                if (!nombreFamilia || !jefeFamilia) {
                    alert('Por favor, completa los campos obligatorios (Nombre de Familia y Jefe de Familia)');
                    return;
                }
                
                beneficiario.nombre_familia = nombreFamilia;
                beneficiario.jefe_familia = jefeFamilia;
                beneficiario.dpi_jefe_familia = document.getElementById('benef_fam_dpi').value || null;
                beneficiario.telefono = document.getElementById('benef_fam_telefono').value || null;
                beneficiario.numero_miembros = document.getElementById('benef_fam_miembros').value || null;
                beneficiario.display_name = `${nombreFamilia} (${jefeFamilia})`;
                
            } else if (tipo === 'institución') {
                const nombreInst = document.getElementById('benef_inst_nombre').value;
                const tipoInst = document.getElementById('benef_inst_tipo').value;
                
                if (!nombreInst || !tipoInst) {
                    alert('Por favor, completa los campos obligatorios (Nombre y Tipo de Institución)');
                    return;
                }
                
                beneficiario.nombre_institucion = nombreInst;
                beneficiario.tipo_institucion = tipoInst;
                beneficiario.representante_legal = document.getElementById('benef_inst_representante').value || null;
                beneficiario.dpi_representante = document.getElementById('benef_inst_dpi_rep').value || null;
                beneficiario.telefono = document.getElementById('benef_inst_telefono').value || null;
                beneficiario.email = document.getElementById('benef_inst_email').value || null;
                beneficiario.numero_beneficiarios_directos = document.getElementById('benef_inst_num_beneficiarios').value || null;
                beneficiario.display_name = `${nombreInst} (${tipoInst})`;
                
            } else if (tipo === 'otro') {
                const nombre = document.getElementById('benef_otro_nombre').value;
                
                if (!nombre) {
                    alert('Por favor, completa el campo obligatorio (Nombre/Descripción)');
                    return;
                }
                
                beneficiario.nombre = nombre;
                beneficiario.tipo_descripcion = document.getElementById('benef_otro_tipo_desc').value || null;
                beneficiario.contacto = document.getElementById('benef_otro_contacto').value || null;
                beneficiario.telefono = document.getElementById('benef_otro_telefono').value || null;
                beneficiario.descripcion = document.getElementById('benef_otro_descripcion').value || null;
                beneficiario.display_name = `${nombre}${beneficiario.tipo_descripcion ? ' - ' + beneficiario.tipo_descripcion : ''}`;
            }
            
            // Agregar o actualizar según el modo
            if (beneficiarioEnEdicion) {
                if (beneficiarioEnEdicion.esExistente) {
                    // Actualizar beneficiario existente (de la DB)
                    beneficiariosExistentes[beneficiarioEnEdicion.index] = {
                        ...beneficiariosExistentes[beneficiarioEnEdicion.index],
                        detalles: {
                            ...beneficiario
                        },
                        modificado: true // Marcar como modificado
                    };
                    
                    // Agregar a la lista de modificados (para enviar al backend)
                    if (!beneficiariosModificados.find(b => b.id === beneficiariosExistentes[beneficiarioEnEdicion.index].id)) {
                        beneficiariosModificados.push({
                            id: beneficiariosExistentes[beneficiarioEnEdicion.index].id,
                            tipo: beneficiario.tipo,
                            ...beneficiario
                        });
                    }
                    
                    console.log('✏️ Beneficiario existente actualizado:', beneficiariosExistentes[beneficiarioEnEdicion.index]);
                } else {
                    // Actualizar beneficiario nuevo (aún no en DB)
                    beneficiariosNuevos[beneficiarioEnEdicion.index] = beneficiario;
                    console.log('✏️ Beneficiario nuevo actualizado:', beneficiario);
                }
            } else {
                // Agregar nuevo beneficiario
                beneficiariosNuevos.push(beneficiario);
                console.log('➕ Beneficiario agregado:', beneficiario);
            }
            
            // Actualizar vista (usar función apropiada según el modo)
            if (eventoEnEdicion) {
                renderBeneficiariosExistentes();
            } else {
                renderBeneficiarios();
            }
            
            // Cerrar modal
            closeBeneficiaryModal();
        });
    }
    
    // Renderizar beneficiarios existentes (en modo edición)
    function renderBeneficiariosExistentes() {
        const container = document.getElementById('beneficiariesContainer');
        const beneficiariesSection = document.getElementById('beneficiariesSection');
        const beneficiaryCount = document.getElementById('beneficiaryCount');
        
        if (!container) return;
        
        // Si no hay beneficiarios existentes ni nuevos, ocultar sección
        if (beneficiariosExistentes.length === 0 && beneficiariosNuevos.length === 0) {
            if (beneficiariesSection) {
                beneficiariesSection.style.display = 'none';
            }
            return;
        }
        
        // Mostrar sección
        if (beneficiariesSection) {
            beneficiariesSection.style.display = 'block';
        }
        
        // Actualizar contador
        if (beneficiaryCount) {
            const total = beneficiariosExistentes.length + beneficiariosNuevos.length;
            const text = total === 1 ? '1 beneficiario' : `${total} beneficiarios`;
            beneficiaryCount.textContent = text;
        }
        
        container.innerHTML = '';
        
        if (beneficiariosExistentes.length > 0) {
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = 'padding: 12px; background: rgba(33, 150, 243, 0.1); border-radius: 8px; border: 1px solid rgba(33, 150, 243, 0.3); margin-bottom: 12px;';
            headerDiv.innerHTML = '<p style="margin: 0; color: #2196F3; font-size: 0.9rem; font-weight: 600;">✓ ' + beneficiariosExistentes.length + ' beneficiarios asociados</p><p style="margin: 8px 0 0 0; color: #b8c5d1; font-size: 0.85rem;">Puedes editar, eliminar o agregar nuevos</p>';
            container.appendChild(headerDiv);
            
            beneficiariosExistentes.forEach((benef, index) => {
                const item = document.createElement('div');
                
                // Resaltar si fue modificado
                const borderColor = benef.modificado ? 'rgba(255, 193, 7, 0.5)' : 'rgba(255, 255, 255, 0.1)';
                const bgColor = benef.modificado ? 'rgba(255, 193, 7, 0.05)' : 'rgba(255, 255, 255, 0.05)';
                
                item.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: ${bgColor}; border-radius: 8px; border: 1px solid ${borderColor};`;
                
                let tipoIcon = benef.tipo === 'individual' ? '👤' : (benef.tipo === 'familia' ? '👨‍👩‍👧‍👦' : (benef.tipo === 'institución' ? '🏢' : '📋'));
                
                // Mostrar nombre del beneficiario (desde detalles si está modificado)
                const nombreDisplay = benef.detalles?.display_name || benef.nombre;
                const modificadoTag = benef.modificado ? ' • <span style="color: #FFC107;">Modificado</span>' : '';
                
                item.innerHTML = '<div style="display: flex; gap: 12px; align-items: center; flex: 1;"><span style="font-size: 1.3rem;">' + tipoIcon + '</span><div><div style="font-weight: 600; color: #b8c5d1; margin-bottom: 2px;">' + nombreDisplay + '</div><div style="font-size: 0.85rem; color: #6c757d; text-transform: capitalize;">' + benef.tipo + modificadoTag + '</div></div></div><div style="display: flex; gap: 6px;"><button type="button" class="btn-edit-beneficiary-existente" data-benef-index="' + index + '" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">✏️ Editar</button><button type="button" class="btn-remove-beneficiary-existente" data-benef-id="' + benef.id + '" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">× Eliminar</button></div>';
                
                container.appendChild(item);
                
                const editBtn = item.querySelector('.btn-edit-beneficiary-existente');
                const removeBtn = item.querySelector('.btn-remove-beneficiary-existente');
                
                editBtn.addEventListener('click', function() {
                    editarBeneficiarioExistente(parseInt(this.getAttribute('data-benef-index')));
                });
                
                removeBtn.addEventListener('click', function() {
                    eliminarBeneficiarioExistente(this.getAttribute('data-benef-id'));
                });
            });
        }
        
        if (beneficiariosNuevos.length > 0) {
            const newHeaderDiv = document.createElement('div');
            newHeaderDiv.style.cssText = 'padding: 12px; background: rgba(76, 175, 80, 0.1); border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.3); margin: 12px 0;';
            newHeaderDiv.innerHTML = '<p style="margin: 0; color: #4CAF50; font-size: 0.9rem; font-weight: 600;">➕ ' + beneficiariosNuevos.length + ' nuevos (se agregarán al guardar)</p>';
            container.appendChild(newHeaderDiv);
            
            beneficiariosNuevos.forEach((benef, index) => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.3);';
                
                let tipoIcon = benef.tipo === 'individual' ? '👤' : (benef.tipo === 'familia' ? '👨‍👩‍👧‍👦' : (benef.tipo === 'institución' ? '🏢' : '📋'));
                
                item.innerHTML = '<div style="display: flex; gap: 12px; align-items: center; flex: 1;"><span style="font-size: 1.3rem;">' + tipoIcon + '</span><div><div style="font-weight: 600; color: #b8c5d1; margin-bottom: 2px;">' + benef.display_name + '</div><div style="font-size: 0.85rem; color: #6c757d; text-transform: capitalize;">' + benef.tipo + ' • <span style="color: #4CAF50;">Nuevo</span></div></div></div><div style="display: flex; gap: 6px;"><button type="button" class="btn-edit-benef-nuevo" data-index="' + index + '" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">✏️ Editar</button><button type="button" class="btn-remove-benef-nuevo" data-index="' + index + '" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">× Quitar</button></div>';
                
                container.appendChild(item);
                
                const editBtn = item.querySelector('.btn-edit-benef-nuevo');
                const removeBtn = item.querySelector('.btn-remove-benef-nuevo');
                
                editBtn.addEventListener('click', function() {
                    editarBeneficiarioNuevo(parseInt(this.getAttribute('data-index')));
                });
                
                removeBtn.addEventListener('click', function() {
                    beneficiariosNuevos.splice(parseInt(this.getAttribute('data-index')), 1);
                    eventoEnEdicion ? renderBeneficiariosExistentes() : renderBeneficiarios();
                });
            });
        }
        
        // Si realmente no hay nada después de renderizar, ocultar sección
        if (beneficiariosExistentes.length === 0 && beneficiariosNuevos.length === 0) {
            if (beneficiariesSection) {
                beneficiariesSection.style.display = 'none';
            }
        }
    }
    
    function editarBeneficiarioExistente(index) {
        const benef = beneficiariosExistentes[index];
        console.log('✏️ Editando beneficiario existente:', benef);
        
        // Marcar que estamos editando un beneficiario existente
        beneficiarioEnEdicion = { 
            index: index, 
            data: benef,
            esExistente: true // Flag para saber que es de la DB
        };
        
        // Abrir modal
        addBeneficiaryModal.style.display = 'flex';
        setTimeout(() => {
            addBeneficiaryModal.classList.add('show');
        }, 10);
        
        // Cambiar título y botón
        const modalTitle = document.querySelector('#addBeneficiaryModal .modal-title');
        if (modalTitle) modalTitle.textContent = 'Editar Beneficiario';
        if (saveBeneficiaryBtn) saveBeneficiaryBtn.textContent = 'Actualizar Beneficiario';
        
        // Pre-llenar formulario según el tipo
        benefTipoSelect.value = benef.tipo;
        hideAllBeneficiaryFields();
        
        // Cargar datos según el tipo
        console.log('📋 Cargando datos de beneficiario:', benef);
        console.log('📋 Tipo:', benef.tipo);
        console.log('📋 Detalles:', benef.detalles);
        
        if (benef.tipo === 'individual') {
            const campos = document.getElementById('campos_individual');
            campos.style.display = 'block';
            
            document.getElementById('benef_ind_nombre').value = benef.detalles?.nombre || '';
            document.getElementById('benef_ind_apellido').value = benef.detalles?.apellido || '';
            document.getElementById('benef_ind_dpi').value = benef.detalles?.dpi || '';
            document.getElementById('benef_ind_fecha_nac').value = benef.detalles?.fecha_nacimiento || '';
            document.getElementById('benef_ind_genero').value = benef.detalles?.genero || '';
            document.getElementById('benef_ind_telefono').value = benef.detalles?.telefono || '';
            
            console.log('✅ Campos individuales cargados');
        } else if (benef.tipo === 'familia') {
            const campos = document.getElementById('campos_familia');
            campos.style.display = 'block';
            
            document.getElementById('benef_fam_nombre').value = benef.detalles?.nombre_familia || '';
            document.getElementById('benef_fam_jefe').value = benef.detalles?.jefe_familia || '';
            document.getElementById('benef_fam_dpi').value = benef.detalles?.dpi_jefe_familia || '';
            document.getElementById('benef_fam_telefono').value = benef.detalles?.telefono || '';
            document.getElementById('benef_fam_miembros').value = benef.detalles?.numero_miembros || '';
            
            console.log('✅ Campos familia cargados');
        } else if (benef.tipo === 'institución') {
            const campos = document.getElementById('campos_institucion');
            campos.style.display = 'block';
            
            document.getElementById('benef_inst_nombre').value = benef.detalles?.nombre_institucion || '';
            document.getElementById('benef_inst_tipo').value = benef.detalles?.tipo_institucion || '';
            document.getElementById('benef_inst_representante').value = benef.detalles?.representante_legal || '';
            document.getElementById('benef_inst_dpi_rep').value = benef.detalles?.dpi_representante || '';
            document.getElementById('benef_inst_telefono').value = benef.detalles?.telefono || '';
            document.getElementById('benef_inst_email').value = benef.detalles?.email || '';
            document.getElementById('benef_inst_num_beneficiarios').value = benef.detalles?.numero_beneficiarios_directos || '';
            
            console.log('✅ Campos institución cargados');
        } else {
            console.warn('⚠️ Tipo de beneficiario no reconocido:', benef.tipo);
        }
    }
    
    function editarBeneficiarioNuevo(index) {
        const benef = beneficiariosNuevos[index];
        console.log('✏️ Editando beneficiario nuevo:', benef);
        
        beneficiarioEnEdicion = { index: index, data: benef };
        
        // Abrir modal
        addBeneficiaryModal.style.display = 'flex';
        setTimeout(() => {
            addBeneficiaryModal.classList.add('show');
        }, 10);
        
        // Cambiar título y botón
        const modalTitle = document.querySelector('#addBeneficiaryModal .modal-title');
        if (modalTitle) modalTitle.textContent = 'Editar Beneficiario';
        if (saveBeneficiaryBtn) saveBeneficiaryBtn.textContent = 'Actualizar Beneficiario';
        
        // Pre-llenar formulario
        benefTipoSelect.value = benef.tipo;
        hideAllBeneficiaryFields();
        
        if (benef.tipo === 'individual') {
            document.getElementById('campos_individual').style.display = 'block';
            document.getElementById('benef_ind_nombre').value = benef.nombre || '';
            document.getElementById('benef_ind_apellido').value = benef.apellido || '';
            document.getElementById('benef_ind_dpi').value = benef.dpi || '';
            document.getElementById('benef_ind_fecha_nac').value = benef.fecha_nacimiento || '';
            document.getElementById('benef_ind_genero').value = benef.genero || '';
            document.getElementById('benef_ind_telefono').value = benef.telefono || '';
        } else if (benef.tipo === 'familia') {
            document.getElementById('campos_familia').style.display = 'block';
            document.getElementById('benef_fam_nombre').value = benef.nombre_familia || '';
            document.getElementById('benef_fam_jefe').value = benef.jefe_familia || '';
            document.getElementById('benef_fam_dpi').value = benef.dpi_jefe_familia || '';
            document.getElementById('benef_fam_telefono').value = benef.telefono || '';
            document.getElementById('benef_fam_miembros').value = benef.numero_miembros || '';
        } else if (benef.tipo === 'institución') {
            document.getElementById('campos_institucion').style.display = 'block';
            document.getElementById('benef_inst_nombre').value = benef.nombre_institucion || '';
            document.getElementById('benef_inst_tipo').value = benef.tipo_institucion || '';
            document.getElementById('benef_inst_representante').value = benef.representante_legal || '';
            document.getElementById('benef_inst_dpi_rep').value = benef.dpi_representante || '';
            document.getElementById('benef_inst_telefono').value = benef.telefono || '';
            document.getElementById('benef_inst_email').value = benef.email || '';
            document.getElementById('benef_inst_num_beneficiarios').value = benef.numero_beneficiarios_directos || '';
        } else if (benef.tipo === 'otro') {
            document.getElementById('campos_otro').style.display = 'block';
            document.getElementById('benef_otro_nombre').value = benef.nombre || '';
            document.getElementById('benef_otro_tipo_desc').value = benef.tipo_descripcion || '';
            document.getElementById('benef_otro_contacto').value = benef.contacto || '';
            document.getElementById('benef_otro_telefono').value = benef.telefono || '';
            document.getElementById('benef_otro_descripcion').value = benef.descripcion || '';
        }
    }
    
    function eliminarBeneficiarioExistente(benefId) {
        if (confirm('¿Estás seguro de que deseas eliminar este beneficiario del evento?')) {
            const index = beneficiariosExistentes.findIndex(b => b.id === benefId);
            if (index !== -1) {
                beneficiariosExistentes.splice(index, 1);
                beneficiariosEliminados.push(benefId);
                renderBeneficiariosExistentes();
                console.log('🗑️ Beneficiario marcado para eliminar:', benefId);
            }
        }
    }
    
    function renderBeneficiarios() {
        const beneficiariesSection = document.getElementById('beneficiariesSection');
        const beneficiaryCount = document.getElementById('beneficiaryCount');
        
        // Si no hay beneficiarios, ocultar sección
        if (beneficiariosNuevos.length === 0) {
            if (beneficiariesSection) {
                beneficiariesSection.style.display = 'none';
            }
            return;
        }
        
        // Mostrar sección y actualizar contador
        if (beneficiariesSection) {
            beneficiariesSection.style.display = 'block';
        }
        
        if (beneficiaryCount) {
            const text = beneficiariosNuevos.length === 1 ? '1 beneficiario' : `${beneficiariosNuevos.length} beneficiarios`;
            beneficiaryCount.textContent = text;
        }
        
        beneficiariesContainer.innerHTML = '';
        
        beneficiariosNuevos.forEach((benef, index) => {
            const item = document.createElement('div');
            item.className = 'beneficiary-item-display';
            
            let tipoIcon = '👤';
            if (benef.tipo === 'individual') tipoIcon = '👤';
            else if (benef.tipo === 'familia') tipoIcon = '👨‍👩‍👧‍👦';
            else if (benef.tipo === 'institución') tipoIcon = '🏢';
            else if (benef.tipo === 'otro') tipoIcon = '📋';
            
            item.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                </svg>
                <div style="flex: 1;">
                    <div style="color: #ffffff; font-weight: 600; margin-bottom: 2px;">${benef.display_name}</div>
                    <div style="color: #b8c5d1; font-size: 0.85rem; text-transform: capitalize;">${benef.tipo}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-edit-beneficiary" data-index="${index}" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.3s;" title="Editar beneficiario">
                        ✏️ Editar
                    </button>
                    <button type="button" class="btn-remove-beneficiary" data-index="${index}" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.3s;" title="Eliminar beneficiario">
                        ✖ Quitar
                    </button>
                </div>
            `;
            
            beneficiariesContainer.appendChild(item);
            
            // Agregar evento de editar
            const editBtn = item.querySelector('.btn-edit-beneficiary');
            editBtn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                editarBeneficiarioNuevo(idx);
            });
            
            // Hover effect para editar
            editBtn.addEventListener('mouseenter', function() {
                this.style.background = '#0056b3';
            });
            editBtn.addEventListener('mouseleave', function() {
                this.style.background = '#007bff';
            });
            
            // Agregar evento de eliminar
            const removeBtn = item.querySelector('.btn-remove-beneficiary');
            removeBtn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                beneficiariosNuevos.splice(idx, 1);
                console.log('➖ Beneficiario eliminado');
                renderBeneficiarios();
            });
            
            // Hover effect para eliminar
            removeBtn.addEventListener('mouseenter', function() {
                this.style.background = '#c82333';
            });
            removeBtn.addEventListener('mouseleave', function() {
                this.style.background = '#dc3545';
            });
        });
        
        console.log(`📋 Total de beneficiarios: ${beneficiariosNuevos.length}`);
    }
    
    // ===== PREVIEW DE ARCHIVOS (CON ACUMULACIÓN) =====
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const filesArray = Array.from(this.files);
            
            if (filesArray.length > 0) {
                // ACUMULAR archivos en lugar de reemplazar
                filesArray.forEach(file => {
                    // Verificar que no exista un archivo con el mismo nombre
                    const exists = accumulatedFiles.some(f => f.name === file.name && f.size === file.size);
                    if (!exists) {
                        accumulatedFiles.push(file);
                        console.log(`➕ Archivo agregado: ${file.name}`);
                    } else {
                        console.log(`⚠️ Archivo duplicado (ignorado): ${file.name}`);
                    }
                });
                
                // Actualizar preview (si estamos en modo edición, usar función especial)
                if (eventoEnEdicion) {
                    renderEvidenciasExistentes();
                } else {
                    updateFilePreview();
                }
                
                // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
                this.value = '';
            }
        });
    }
    
    // Prevenir que clicks en el preview disparen el label del input
    const filesSection = document.getElementById('filesSection');
    
    if (filePreview) {
        filePreview.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    if (filesSection) {
        filesSection.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Función para actualizar el preview de archivos
    function updateFilePreview() {
        const fileCountDiv = document.getElementById('fileCount');
        const filesSection = document.getElementById('filesSection');
        filePreview.innerHTML = '';
        
        const totalFiles = accumulatedFiles.length;
        
        console.log(`📁 Total de archivos acumulados: ${totalFiles}`);
        
        if (totalFiles > 0) {
            // Mostrar la sección de archivos
            if (filesSection) {
                filesSection.style.display = 'block';
            }
            
            // Mostrar contador
            if (fileCountDiv) {
                fileCountDiv.innerHTML = `${totalFiles} archivo${totalFiles > 1 ? 's' : ''}`;
            }
            
            // Mostrar preview de cada archivo con botón de eliminar
            accumulatedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';
                fileItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.05); padding: 8px 12px; border-radius: 8px; margin-bottom: 8px;';
                
                const isImage = file.type.startsWith('image/');
                const icon = isImage ? '🖼️' : '📄';
                
                fileItem.innerHTML = `
                    <span style="font-weight: 500; color: #b8c5d1; min-width: 30px;">#${index + 1}</span>
                    <span style="color: #007bff;">${icon}</span>
                    <span style="flex: 1; color: #b8c5d1;">${file.name}</span>
                    <span style="color: #6c757d; font-size: 0.85rem;">(${(file.size / 1024).toFixed(2)} KB)</span>
                    <button type="button" class="btn-remove-file" data-index="${index}" style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 1.2rem; font-weight: bold; padding: 0 8px; line-height: 1; transition: color 0.2s;" title="Eliminar archivo">
                        ×
                    </button>
                `;
                
                filePreview.appendChild(fileItem);
                
                // Agregar evento para eliminar archivo
                const removeBtn = fileItem.querySelector('.btn-remove-file');
                removeBtn.addEventListener('click', function(e) {
                    e.preventDefault(); // Prevenir comportamiento por defecto
                    e.stopPropagation(); // Evitar que el evento se propague
                    removeFile(index);
                });
                
                // Agregar efecto hover al botón
                removeBtn.addEventListener('mouseenter', function() {
                    this.style.color = '#ff0000';
                    this.style.transform = 'scale(1.2)';
                });
                removeBtn.addEventListener('mouseleave', function() {
                    this.style.color = '#dc3545';
                    this.style.transform = 'scale(1)';
                });
            });
        } else {
            // Ocultar la sección si no hay archivos
            if (filesSection) {
                filesSection.style.display = 'none';
            }
            if (fileCountDiv) {
                fileCountDiv.innerHTML = '';
            }
        }
    }
    
    // Función para eliminar un archivo de la lista
    function removeFile(index) {
        const removedFile = accumulatedFiles[index];
        accumulatedFiles.splice(index, 1);
        console.log(`➖ Archivo eliminado: ${removedFile.name}`);
        
        // Si estamos en modo edición, usar función especial
        if (eventoEnEdicion) {
            renderEvidenciasExistentes();
        } else {
            updateFilePreview();
        }
    }
    
    // ===== ENVÍO DEL FORMULARIO =====
    let eventoEnEdicion = null; // Variable para detectar modo edición
    
    if (eventForm) {
        eventForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Detectar si estamos en modo edición
            if (eventoEnEdicion) {
                console.log('🔄 Modo edición - Actualizando evento...');
                await actualizarEvento(eventoEnEdicion.id);
                return;
            }
            
            // Modo creación normal
            console.log('📤 Modo creación - Enviando formulario...');
            
            // Crear FormData
            const formData = new FormData(this);
            
            // ⚠️ IMPORTANTE: Eliminar el campo 'evidences' del FormData automático
            // porque solo captura un archivo, y agregarlo manualmente con todos los archivos
            formData.delete('evidences');
            
            // Agregar TODOS los archivos acumulados manualmente
            if (accumulatedFiles.length > 0) {
                const totalFiles = accumulatedFiles.length;
                console.log(`\n📎 Agregando ${totalFiles} archivo${totalFiles > 1 ? 's' : ''} acumulado${totalFiles > 1 ? 's' : ''} al formulario:`);
                
                accumulatedFiles.forEach((file, index) => {
                    formData.append('evidences', file);
                    console.log(`   ${index + 1}. ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.type})`);
                });
                
                console.log(`✅ Total de archivos agregados a FormData: ${totalFiles}\n`);
            } else {
                console.log('⚠️ No hay archivos seleccionados\n');
            }
            
            // Agregar datos adicionales
            // Personal (extraer IDs si son objetos)
            const personal_ids = selectedPersonnelList.map(p => typeof p === 'object' ? p.id : p);
            formData.append('personal_ids', JSON.stringify(personal_ids));
            formData.append('beneficiarios_nuevos', JSON.stringify(beneficiariosNuevos));
            
            // Obtener CSRF token
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            try {
                // Enviar datos a la API
                const response = await fetch('/api/evento/crear/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': csrftoken
                    }
                });
                
                const data = await response.json();
                
                console.log('📥 Respuesta del servidor:', data);
                
                if (response.ok && data.success) {
                    console.log('✅ Evento creado exitosamente');
                    console.log(`   📊 Total de archivos guardados: ${data.total_archivos || 0}`);
                    
                    // Mostrar mensaje de éxito con información de archivos
                    let mensaje = data.message || 'Evento creado exitosamente';
                    if (data.total_archivos > 0) {
                        mensaje += ` (${data.total_archivos} archivo${data.total_archivos > 1 ? 's' : ''} guardado${data.total_archivos > 1 ? 's' : ''})`;
                    }
                    mostrarMensaje('success', mensaje);
                    
                    // Limpiar formulario
                    eventForm.reset();
                    selectedPersonnelList = [];
                    beneficiariosNuevos = []; // Limpiar beneficiarios
                    accumulatedFiles = []; // Limpiar archivos acumulados
                    updateFilePreview(); // Actualizar preview vacío
                    renderBeneficiarios(); // Actualizar vista de beneficiarios
                    
                    // Volver a la vista principal
                    setTimeout(() => {
                        showMainView();
                    }, 2000);
                    
                } else {
                    console.error('❌ Error al crear evento:', data.error);
                    mostrarMensaje('error', data.error || 'Error al crear el evento');
                }
                
            } catch (error) {
                console.error('❌ Error en la solicitud:', error);
                mostrarMensaje('error', 'Error de conexión. Por favor, intenta de nuevo.');
            }
        });
    }
    
    // ===== FUNCIÓN PARA MOSTRAR MENSAJES =====
    function mostrarMensaje(tipo, mensaje) {
        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-alert message-${tipo}`;
        messageDiv.textContent = mensaje;
        
        let backgroundColor;
        switch(tipo) {
            case 'success':
                backgroundColor = '#4CAF50';
                break;
            case 'error':
                backgroundColor = '#f44336';
                break;
            case 'info':
                backgroundColor = '#2196F3';
                break;
            default:
                backgroundColor = '#6c757d';
        }
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background-color: ${backgroundColor};
            color: white;
            font-weight: 600;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(messageDiv);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 5000);
    }
    
    // ===== GESTIÓN DE EVENTOS EXISTENTES =====
    let eventosData = [];
    
    // Cargar eventos cuando se abre la vista de gestión
    if (openManageEventBtn) {
        openManageEventBtn.addEventListener('click', function() {
            showManageEventView();
            cargarEventos();
        });
    }
    
    async function cargarEventos() {
        try {
            console.log('📥 Cargando eventos...');
            const response = await fetch('/api/eventos/');
            
            if (!response.ok) {
                throw new Error('Error al cargar eventos');
            }
            
            const data = await response.json();
            
            if (data.success) {
                eventosData = data.eventos;
                console.log(`✅ ${data.total} eventos cargados`);
                renderEventos();
            } else {
                console.error('❌ Error:', data.error);
                mostrarMensaje('error', 'Error al cargar eventos');
            }
            
        } catch (error) {
            console.error('❌ Error al cargar eventos:', error);
            mostrarMensaje('error', 'Error al cargar eventos');
        }
    }
    
    function renderEventos() {
        const eventsList = document.getElementById('eventsList');
        
        if (!eventsList) return;
        
        if (eventosData.length === 0) {
            eventsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.5;">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                    <p style="font-size: 1.1rem; margin: 0;">No hay eventos creados aún</p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Crea tu primer evento desde la opción "Crear Evento"</p>
                </div>
            `;
            return;
        }
        
        eventsList.innerHTML = '';
        
        eventosData.forEach(evento => {
            const estadoColor = {
                'planificado': '#ffc107',
                'en_progreso': '#17a2b8',
                'completado': '#28a745',
                'cancelado': '#dc3545'
            }[evento.estado] || '#6c757d';
            
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-bottom: 16px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);';
            
            eventItem.innerHTML = `
                <div class="event-info" style="flex: 1;">
                    <h3 class="event-name" style="margin: 0 0 8px 0; font-size: 1.2rem; color: #b8c5d1;">${evento.nombre}</h3>
                    <p class="event-type" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Tipo:</strong> ${evento.tipo}
                    </p>
                    <p class="event-communities" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Comunidad:</strong> ${evento.comunidad}
                    </p>
                    <p class="event-personnel" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Personal:</strong> ${evento.personal_nombres} (${evento.personal_count})
                    </p>
                    <p class="event-beneficiaries" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Beneficiarios:</strong> ${evento.beneficiarios_count}
                    </p>
                    <p class="event-date" style="margin: 4px 0; color: #6c757d; font-size: 0.9rem;">
                        <strong>Fecha:</strong> ${evento.fecha} | <strong>Estado:</strong> <span style="color: ${estadoColor}; font-weight: 600;">${evento.estado}</span>
                    </p>
                    <p class="event-created" style="margin: 4px 0; color: #6c757d; font-size: 0.85rem;">
                        Creado: ${evento.creado_en}
                    </p>
                </div>
                <div class="event-actions" style="display: flex; gap: 8px; flex-direction: column; min-width: 120px;">
                    <button type="button" class="btn-edit-event" data-event-id="${evento.id}" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                    </button>
                    <button type="button" class="btn-delete-event-item" data-event-id="${evento.id}" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar
                    </button>
                </div>
            `;
            
            eventsList.appendChild(eventItem);
            
            // Agregar eventos de click
            const editBtn = eventItem.querySelector('.btn-edit-event');
            const deleteBtn = eventItem.querySelector('.btn-delete-event-item');
            
            editBtn.addEventListener('click', function() {
                const eventoId = this.getAttribute('data-event-id');
                cargarEventoParaEditar(eventoId);
            });
            
            deleteBtn.addEventListener('click', function() {
                const eventoId = this.getAttribute('data-event-id');
                confirmarEliminarEvento(eventoId);
            });
        });
    }
    
    // Variable global para guardar el ID del evento a eliminar
    let eventoIdParaEliminar = null;
    
    function confirmarEliminarEvento(eventoId) {
        const evento = eventosData.find(e => e.id === eventoId);
        
        if (!evento) {
            mostrarMensaje('error', 'Evento no encontrado');
            return;
        }
        
        // Guardar el ID del evento
        eventoIdParaEliminar = eventoId;
        
        // Mostrar el nombre del evento en el modal
        document.getElementById('deleteEventName').textContent = evento.nombre;
        
        // Limpiar el formulario
        document.getElementById('delete_username').value = '';
        document.getElementById('delete_password').value = '';
        document.getElementById('deleteErrorMessage').style.display = 'none';
        
        // Mostrar el modal
        const modal = document.getElementById('confirmDeleteModal');
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
    
    async function eliminarEvento(eventoId) {
        try {
            console.log('🗑️ Eliminando evento:', eventoId);
            
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            const response = await fetch(`/api/evento/${eventoId}/eliminar/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrftoken
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ Evento eliminado exitosamente');
                mostrarMensaje('success', 'Evento eliminado exitosamente');
                
                // Recargar la lista de eventos y cambios recientes
                cargarEventos();
                cargarCambiosRecientes();
            } else {
                console.error('❌ Error:', data.error);
                mostrarMensaje('error', data.error || 'Error al eliminar el evento');
            }
            
        } catch (error) {
            console.error('❌ Error al eliminar evento:', error);
            mostrarMensaje('error', 'Error al eliminar el evento');
        }
    }
    
    // ===== EDICIÓN DE EVENTOS =====
    async function cargarEventoParaEditar(eventoId) {
        try {
            console.log('📝 Cargando evento para editar:', eventoId);
            
            const response = await fetch(`/api/evento/${eventoId}/`);
            
            if (!response.ok) {
                throw new Error('Error al cargar evento');
            }
            
            const data = await response.json();
            
            if (data.success) {
                eventoEnEdicion = data.evento;
                prellenarFormularioConEvento(data.evento);
                showCreateEventView();
                mostrarMensaje('info', 'Editando evento: ' + data.evento.nombre);
            } else {
                console.error('❌ Error:', data.error);
                mostrarMensaje('error', 'Error al cargar evento');
            }
            
        } catch (error) {
            console.error('❌ Error al cargar evento:', error);
            mostrarMensaje('error', 'Error al cargar evento');
        }
    }
    
    function prellenarFormularioConEvento(evento) {
        console.log('📋 Prellenando formulario con:', evento);
        
        // Cambiar título del formulario
        const formTitle = document.querySelector('.view-title');
        if (formTitle) {
            formTitle.textContent = 'Editar Evento';
        }
        
        // Cambiar texto del botón submit
        const submitBtn = document.querySelector('.btn-create-event');
        if (submitBtn) {
            submitBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Actualizar Evento
            `;
        }
        
        // Campos básicos - CORREGIDO: usar IDs correctos del HTML
        const eventNameField = document.getElementById('eventName');
        const eventTypeField = document.getElementById('eventType');
        const comunidadField = document.getElementById('comunidad');
        const fechaField = document.getElementById('fecha');
        const estadoField = document.getElementById('estado');
        const eventDescField = document.getElementById('eventDescription');
        const latitudField = document.getElementById('latitud');
        const longitudField = document.getElementById('longitud');
        
        if (eventNameField) eventNameField.value = evento.nombre || '';
        if (eventTypeField) eventTypeField.value = evento.tipo_id || '';
        if (comunidadField) comunidadField.value = evento.comunidad_id || '';
        if (fechaField) fechaField.value = evento.fecha || '';
        if (estadoField) estadoField.value = evento.estado || 'planificado';
        if (eventDescField) eventDescField.value = evento.descripcion || '';
        if (latitudField) latitudField.value = evento.latitud || '';
        if (longitudField) longitudField.value = evento.longitud || '';
        
        // Pre-seleccionar personal (convertir a IDs simples para comparación)
        selectedPersonnelList = evento.personal.map(p => ({
            id: p.id,
            username: p.username,
            rol: p.rol
        }));
        console.log('👥 Personal pre-seleccionado:', selectedPersonnelList);
        
        // Re-renderizar personal con checkboxes marcados
        if (personalList.length > 0) {
            console.log('🔄 Re-renderizando personal con selecciones...');
            renderPersonalList();
        } else {
            // Si aún no se ha cargado el personal, cargar datos
            console.log('📥 Cargando datos de personal...');
            setTimeout(async () => {
                await cargarDatos();
                renderPersonalList();
            }, 100);
        }
        
        // Cargar beneficiarios existentes (editables)
        beneficiariosExistentes = evento.beneficiarios || [];
        beneficiariosEliminados = []; // Array para rastrear beneficiarios a eliminar
        
        if (beneficiariosExistentes.length > 0) {
            renderBeneficiariosExistentes();
        } else {
            const benefContainer = document.getElementById('beneficiariesContainer');
            if (benefContainer) {
                benefContainer.innerHTML = `
                    <p style="color: #6c757d; font-style: italic; text-align: center; padding: 20px 0;">
                        No hay beneficiarios asociados. Usa el botón "Agregar Beneficiario" para registrar uno.
                    </p>
                `;
            }
        }
        
        // Mostrar evidencias existentes (almacenarlas en variable para mantener referencia)
        evidenciasExistentes = evento.evidencias || [];
        evidenciasEliminadas = [];
        renderEvidenciasExistentes();
        
        // Limpiar archivo seleccionado
        const fileInput = document.getElementById('evidences');
        if (fileInput) {
            fileInput.value = '';
        }
        accumulatedFiles = [];
        
        console.log('✅ Formulario prellenado exitosamente');
    }
    
    // Renderizar evidencias existentes en modo edición
    function renderEvidenciasExistentes() {
        const filesSection = document.getElementById('filesSection');
        const filePreview = document.getElementById('filePreview');
        const fileCount = document.getElementById('fileCount');
        
        if (!filesSection || !filePreview || !fileCount) return;
        
        filesSection.style.display = 'block';
        filePreview.innerHTML = '';
        
        let totalArchivos = 0;
        
        // Mostrar evidencias existentes
        if (evidenciasExistentes.length > 0) {
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = 'padding: 8px 12px; background: rgba(33, 150, 243, 0.1); border-radius: 6px; border: 1px solid rgba(33, 150, 243, 0.3); margin-bottom: 12px;';
            headerDiv.innerHTML = '<p style="margin: 0; color: #2196F3; font-size: 0.9rem; font-weight: 600;">📎 ' + evidenciasExistentes.length + ' evidencias actuales</p>';
            filePreview.appendChild(headerDiv);
            
            evidenciasExistentes.forEach(evidencia => {
                const fileItem = document.createElement('div');
                fileItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);';
                
                const icon = evidencia.es_imagen ? '🖼️' : '📄';
                
                fileItem.innerHTML = '<div style="display: flex; gap: 12px; align-items: center; flex: 1;"><span style="font-size: 1.5rem;">' + icon + '</span><div style="flex: 1; min-width: 0;"><div style="font-weight: 600; color: #b8c5d1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + evidencia.nombre + '</div><div style="font-size: 0.8rem; color: #6c757d; margin-top: 2px;">' + evidencia.tipo + '</div></div></div><div style="display: flex; gap: 8px;"><a href="' + evidencia.url + '" target="_blank" style="color: #007bff; text-decoration: none; padding: 6px 12px; background: rgba(0, 123, 255, 0.1); border-radius: 4px; font-size: 0.85rem; font-weight: 600;">Ver</a><button type="button" class="btn-remove-evidencia-existente" data-evidencia-id="' + evidencia.id + '" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">× Eliminar</button></div>';
                
                filePreview.appendChild(fileItem);
                
                const removeBtn = fileItem.querySelector('.btn-remove-evidencia-existente');
                removeBtn.addEventListener('click', function() {
                    eliminarEvidenciaExistente(this.getAttribute('data-evidencia-id'));
                });
            });
            
            totalArchivos += evidenciasExistentes.length;
        }
        
        // Mostrar evidencias nuevas (acumuladas)
        if (accumulatedFiles.length > 0) {
            const newHeaderDiv = document.createElement('div');
            newHeaderDiv.style.cssText = 'padding: 8px 12px; background: rgba(76, 175, 80, 0.1); border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.3); margin: 12px 0;';
            newHeaderDiv.innerHTML = '<p style="margin: 0; color: #4CAF50; font-size: 0.9rem; font-weight: 600;">➕ ' + accumulatedFiles.length + ' nuevas evidencias (se subirán al guardar)</p>';
            filePreview.appendChild(newHeaderDiv);
            
            accumulatedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border: 1px solid rgba(76, 175, 80, 0.3);';
                
                const icon = file.type.startsWith('image/') ? '🖼️' : '📄';
                
                fileItem.innerHTML = '<div style="display: flex; gap: 12px; align-items: center; flex: 1;"><span style="font-size: 1.5rem;">' + icon + '</span><div style="flex: 1; min-width: 0;"><div style="font-weight: 600; color: #b8c5d1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + file.name + '</div><div style="font-size: 0.8rem; color: #6c757d; margin-top: 2px;">' + file.type + ' • <span style="color: #4CAF50;">Nueva</span></div></div></div><button type="button" class="btn-remove-file-nuevo" data-index="' + index + '" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">× Quitar</button>';
                
                filePreview.appendChild(fileItem);
                
                const removeBtn = fileItem.querySelector('.btn-remove-file-nuevo');
                removeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const idx = parseInt(this.getAttribute('data-index'));
                    removeFile(idx);
                });
            });
            
            totalArchivos += accumulatedFiles.length;
        }
        
        // Actualizar contador
        fileCount.textContent = totalArchivos + ' archivo' + (totalArchivos !== 1 ? 's' : '');
        
        // Si no hay archivos, ocultar sección
        if (totalArchivos === 0) {
            filesSection.style.display = 'none';
        }
    }
    
    function eliminarEvidenciaExistente(evidenciaId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta evidencia?')) {
            const index = evidenciasExistentes.findIndex(e => e.id === evidenciaId);
            if (index !== -1) {
                evidenciasExistentes.splice(index, 1);
                evidenciasEliminadas.push(evidenciaId);
                renderEvidenciasExistentes();
                console.log('🗑️ Evidencia marcada para eliminar:', evidenciaId);
            }
        }
    }
    
    async function actualizarEvento(eventoId) {
        try {
            console.log('🔄 Actualizando evento:', eventoId);
            
            const formData = new FormData();
            
            // Campos básicos - CORREGIDO: usar IDs correctos del HTML
            formData.append('nombre', document.getElementById('eventName').value);
            formData.append('tipo_actividad_id', document.getElementById('eventType').value);
            formData.append('comunidad_id', document.getElementById('comunidad').value);
            formData.append('fecha', document.getElementById('fecha').value);
            formData.append('estado', document.getElementById('estado').value);
            formData.append('descripcion', document.getElementById('eventDescription').value);
            
            const latitud = document.getElementById('latitud').value;
            const longitud = document.getElementById('longitud').value;
            if (latitud) formData.append('latitud', latitud);
            if (longitud) formData.append('longitud', longitud);
            
            // Personal (JSON) - extraer IDs si son objetos
            if (selectedPersonnelList.length > 0) {
                const personal_ids = selectedPersonnelList.map(p => typeof p === 'object' ? p.id : p);
                formData.append('personal_ids', JSON.stringify(personal_ids));
            }
            
            // Beneficiarios nuevos (si hay)
            if (beneficiariosNuevos.length > 0) {
                formData.append('beneficiarios_nuevos', JSON.stringify(beneficiariosNuevos));
            }
            
            // Beneficiarios a eliminar (si hay)
            if (beneficiariosEliminados.length > 0) {
                formData.append('beneficiarios_eliminados', JSON.stringify(beneficiariosEliminados));
            }
            
            // Beneficiarios modificados (si hay)
            if (beneficiariosModificados.length > 0) {
                formData.append('beneficiarios_modificados', JSON.stringify(beneficiariosModificados));
            }
            
            // Evidencias a eliminar (si hay)
            if (evidenciasEliminadas.length > 0) {
                formData.append('evidencias_eliminadas', JSON.stringify(evidenciasEliminadas));
            }
            
            // Evidencias nuevas
            if (accumulatedFiles.length > 0) {
                accumulatedFiles.forEach(file => {
                    formData.append('evidencias_nuevas', file);
                });
            }
            
            // CSRF token
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            const response = await fetch(`/api/evento/${eventoId}/actualizar/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ Evento actualizado:', data);
                mostrarMensaje('success', data.message || 'Evento actualizado exitosamente');
                
                // Resetear modo edición
                eventoEnEdicion = null;
                beneficiariosExistentes = [];
                beneficiariosEliminados = [];
                beneficiariosModificados = [];
                evidenciasExistentes = [];
                evidenciasEliminadas = [];
                
                // Resetear formulario
                eventForm.reset();
                selectedPersonnelList = [];
                beneficiariosNuevos = [];
                accumulatedFiles = [];
                renderBeneficiarios();
                updateFilePreview();
                
                // Restaurar título y botón
                const formTitle = document.querySelector('.view-title');
                if (formTitle) {
                    formTitle.textContent = 'Crear Nuevo Evento';
                }
                
                const submitBtn = document.querySelector('.btn-create-event');
                if (submitBtn) {
                    submitBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Crear Evento
                    `;
                }
                
                // Volver a la lista de eventos
                setTimeout(() => {
                    showManageEventView();
                    cargarEventos();
                    cargarCambiosRecientes();
                }, 1500);
                
            } else {
                console.error('❌ Error:', data.error);
                mostrarMensaje('error', data.error || 'Error al actualizar el evento');
            }
            
        } catch (error) {
            console.error('❌ Error al actualizar evento:', error);
            mostrarMensaje('error', 'Error al actualizar el evento');
        }
    }
    
    // Cancelar edición al volver
    if (backFromCreateBtn) {
        const originalBackHandler = backFromCreateBtn.onclick;
        backFromCreateBtn.addEventListener('click', function(e) {
            if (eventoEnEdicion) {
                eventoEnEdicion = null;
                beneficiariosExistentes = [];
                beneficiariosEliminados = [];
                beneficiariosModificados = [];
                evidenciasExistentes = [];
                evidenciasEliminadas = [];
                
                // Resetear formulario
                eventForm.reset();
                selectedPersonnelList = [];
                beneficiariosNuevos = [];
                accumulatedFiles = [];
                
                // Restaurar título y botón
                const formTitle = document.querySelector('.view-title');
                if (formTitle) {
                    formTitle.textContent = 'Crear Nuevo Evento';
                }
                
                const submitBtn = document.querySelector('.btn-create-event');
                if (submitBtn) {
                    submitBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Crear Evento
                    `;
                }
            }
        });
    }
    
    console.log('✅ Gestión de Eventos inicializada correctamente');
    
    // ===== CARGAR CAMBIOS RECIENTES =====
    async function cargarCambiosRecientes() {
        try {
            console.log('📝 Cargando cambios recientes...');
            
            const response = await fetch('/api/cambios-recientes/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Cambios recientes cargados:', data.cambios.length);
                renderCambiosRecientes(data.cambios);
            } else {
                console.error('❌ Error en respuesta:', data.error);
                mostrarErrorCambios('No se pudieron cargar los cambios recientes');
            }
            
        } catch (error) {
            console.error('❌ Error al cargar cambios recientes:', error);
            mostrarErrorCambios('Error de conexión al cargar cambios');
        }
    }
    
    function renderCambiosRecientes(cambios) {
        const changesLog = document.getElementById('changesLog');
        if (!changesLog) return;
        
        changesLog.innerHTML = '';
        
        if (cambios.length === 0) {
            changesLog.innerHTML = `
                <div class="change-item" style="text-align: center; color: #6c757d; padding: 30px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 10px; opacity: 0.5;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <p>No hay cambios recientes</p>
                </div>
            `;
            return;
        }
        
        cambios.forEach(cambio => {
            const changeItem = document.createElement('div');
            changeItem.className = 'change-item';
            
            // Si el evento está eliminado, agregar clase especial
            if (cambio.evento_eliminado) {
                changeItem.classList.add('evento-eliminado');
            }
            
            // Crear header con fecha y etiqueta (si está eliminado)
            const changeHeader = document.createElement('div');
            changeHeader.className = 'change-header';
            changeHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';
            
            // Crear elemento de tiempo con icono
            const changeTime = document.createElement('div');
            changeTime.className = 'change-time';
            changeTime.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 6px; vertical-align: middle;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${cambio.fecha}
            `;
            
            changeHeader.appendChild(changeTime);
            
            // Si está eliminado, agregar etiqueta
            if (cambio.evento_eliminado) {
                const labelEliminado = document.createElement('span');
                labelEliminado.className = 'label-eliminado';
                labelEliminado.textContent = 'Eliminado';
                labelEliminado.style.cssText = 'padding: 2px 8px; background: rgba(244, 67, 54, 0.2); color: #f44336; border-radius: 12px; font-size: 0.75rem; font-weight: 600;';
                changeHeader.appendChild(labelEliminado);
            }
            
            const changeDesc = document.createElement('div');
            changeDesc.className = 'change-description';
            changeDesc.textContent = cambio.descripcion;
            
            changeItem.appendChild(changeHeader);
            changeItem.appendChild(changeDesc);
            
            changesLog.appendChild(changeItem);
        });
    }
    
    function mostrarErrorCambios(mensaje) {
        const changesLog = document.getElementById('changesLog');
        if (!changesLog) return;
        
        changesLog.innerHTML = `
            <div class="change-item" style="text-align: center; color: #dc3545; padding: 20px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 10px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p>${mensaje}</p>
            </div>
        `;
    }
    
    // Llamar a cargar cambios recientes
    cargarCambiosRecientes();
    
    // ===== MANEJO DEL MODAL DE CONFIRMACIÓN DE ELIMINACIÓN =====
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');
    const closeConfirmDeleteBtn = document.getElementById('closeConfirmDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const executeDeleteBtn = document.getElementById('executeDeleteBtn');
    const deleteErrorMessage = document.getElementById('deleteErrorMessage');
    
    // Cerrar modal
    function cerrarModalEliminar() {
        confirmDeleteModal.classList.remove('show');
        setTimeout(() => {
            confirmDeleteModal.style.display = 'none';
        }, 300);
        eventoIdParaEliminar = null;
    }
    
    closeConfirmDeleteBtn.addEventListener('click', cerrarModalEliminar);
    cancelDeleteBtn.addEventListener('click', cerrarModalEliminar);
    
    // Click fuera del modal para cerrar
    confirmDeleteModal.addEventListener('click', (e) => {
        if (e.target === confirmDeleteModal) {
            cerrarModalEliminar();
        }
    });
    
    // Ejecutar eliminación con verificación de credenciales
    executeDeleteBtn.addEventListener('click', async () => {
        const username = document.getElementById('delete_username').value.trim();
        const password = document.getElementById('delete_password').value;
        
        if (!username || !password) {
            deleteErrorMessage.textContent = 'Por favor, ingresa tu usuario y contraseña.';
            deleteErrorMessage.style.display = 'block';
            return;
        }
        
        // Deshabilitar botón mientras se procesa
        executeDeleteBtn.disabled = true;
        executeDeleteBtn.textContent = 'Verificando...';
        
        try {
            // Primero verificar las credenciales
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            
            const verifyResponse = await fetch('/api/verificar-admin/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const verifyData = await verifyResponse.json();
            
            if (!verifyResponse.ok || !verifyData.success) {
                deleteErrorMessage.textContent = verifyData.error || 'Credenciales inválidas o no eres administrador.';
                deleteErrorMessage.style.display = 'block';
                executeDeleteBtn.disabled = false;
                executeDeleteBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Eliminar Evento
                `;
                return;
            }
            
            // Si las credenciales son válidas, proceder con la eliminación
            console.log('✅ Credenciales verificadas, procediendo a eliminar...');
            
            // Guardar el ID antes de cerrar el modal (ya que cerrarModalEliminar lo pone en null)
            const eventoId = eventoIdParaEliminar;
            cerrarModalEliminar();
            await eliminarEvento(eventoId);
            
        } catch (error) {
            console.error('❌ Error al verificar credenciales:', error);
            deleteErrorMessage.textContent = 'Error de conexión. Por favor, intenta de nuevo.';
            deleteErrorMessage.style.display = 'block';
            executeDeleteBtn.disabled = false;
            executeDeleteBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Eliminar Evento
            `;
        }
    });
});
