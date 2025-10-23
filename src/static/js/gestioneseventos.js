// gestioneseventos.js

document.addEventListener('DOMContentLoaded', function() {
    // ======= VARIABLES GLOBALES =======
    const COMMUNITIES_COUNT = 153;
    const ADMIN_CREDENTIALS = {
        username: 'admin',
        password: 'admin'
    };

    // ======= DATOS DE COMUNIDADES =======
    const communities = [];
    for (let i = 1; i <= COMMUNITIES_COUNT; i++) {
        communities.push({
            id: `comunidad-${i}`,
            name: `Comunidad ${i}`,
            region: Math.ceil(i / 9) // Distribuir en 17 regiones (153/9 ≈ 17)
        });
    }

    // ======= ELEMENTOS DEL DOM =======
    const communitySearch = document.getElementById('communitySearch');
    const communitiesList = document.getElementById('communitiesList');
    const selectedCommunities = document.getElementById('selectedCommunities');
    const beneficiariesContainer = document.getElementById('beneficiariesContainer');
    const addBeneficiaryBtn = document.getElementById('addBeneficiaryBtn');
    const eventForm = document.getElementById('eventForm');
    const viewNewEventBtn = document.getElementById('viewNewEventBtn');
    const deleteModal = document.getElementById('deleteModal');
    const closeModal = document.getElementById('closeModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const adminUsername = document.getElementById('adminUsername');
    const adminPassword = document.getElementById('adminPassword');
    const credentialError = document.getElementById('credentialError');
    const changesLog = document.getElementById('changesLog');

    // ======= ELEMENTOS DEL SELECTOR DE PERSONAL =======
    const personnelSearch = document.getElementById('personnelSearch');
    const personnelList = document.getElementById('personnelList');
    const selectedPersonnel = document.getElementById('selectedPersonnel');
    const editPersonnelSearch = document.getElementById('editPersonnelSearch');
    const editPersonnelList = document.getElementById('editPersonnelList');
    const editSelectedPersonnel = document.getElementById('editSelectedPersonnel');

    // ======= DATOS DEL PERSONAL =======
    const personnelData = [
        { id: 'juan-perez', name: 'Juan Pérez', role: 'Coordinador Regional' },
        { id: 'maria-gomez', name: 'María Gómez', role: 'Especialista en Desarrollo' },
        { id: 'carlos-rodriguez', name: 'Carlos Rodríguez', role: 'Técnico Agrícola' },
        { id: 'ana-martinez', name: 'Ana Martínez', role: 'Coordinadora de Proyectos' },
        { id: 'luis-hernandez', name: 'Luis Hernández', role: 'Especialista en Capacitación' },
        { id: 'patricia-lopez', name: 'Patricia López', role: 'Administradora de Campo' }
    ];

    // ======= FUNCIONALIDAD DE COMUNIDADES =======
    let selectedCommunitiesList = [];
    let filteredCommunities = [...communities];

    // ======= FUNCIONALIDAD DE PERSONAL =======
    let selectedPersonnelList = [];
    let filteredPersonnel = [...personnelData];
    let editSelectedPersonnelList = [];
    let editFilteredPersonnel = [...personnelData];

    function renderCommunities() {
        communitiesList.innerHTML = '';
        
        filteredCommunities.forEach(community => {
            const isSelected = selectedCommunitiesList.some(selected => selected.id === community.id);
            
            const communityItem = document.createElement('div');
            communityItem.className = 'community-item';
            communityItem.innerHTML = `
                <input type="checkbox" id="${community.id}" value="${community.id}" ${isSelected ? 'checked' : ''}>
                <label for="${community.id}">${community.name} (Región ${community.region})</label>
            `;
            
            const checkbox = communityItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    addCommunity(community);
                } else {
                    removeCommunity(community.id);
                }
            });
            
            communitiesList.appendChild(communityItem);
        });
    }

    function addCommunity(community) {
        if (!selectedCommunitiesList.some(selected => selected.id === community.id)) {
            selectedCommunitiesList.push(community);
            updateSelectedCommunitiesDisplay();
        }
    }

    function removeCommunity(communityId) {
        selectedCommunitiesList = selectedCommunitiesList.filter(community => community.id !== communityId);
        updateSelectedCommunitiesDisplay();
    }

    function updateSelectedCommunitiesDisplay() {
        const count = selectedCommunitiesList.length;
        selectedCommunities.innerHTML = `
            <span class="selected-count">${count} ${count === 1 ? 'comunidad' : 'comunidades'} seleccionada${count === 1 ? '' : 's'}</span>
        `;
        
        if (count > 0) {
            selectedCommunitiesList.forEach(community => {
                const tag = document.createElement('span');
                tag.className = 'selected-community-tag';
                tag.innerHTML = `
                    ${community.name}
                    <span class="remove-tag" data-id="${community.id}">&times;</span>
                `;
                
                const removeBtn = tag.querySelector('.remove-tag');
                removeBtn.addEventListener('click', function() {
                    removeCommunity(community.id);
                    // Desmarcar checkbox
                    const checkbox = document.getElementById(community.id);
                    if (checkbox) checkbox.checked = false;
                });
                
                selectedCommunities.appendChild(tag);
            });
        }
    }

    // Búsqueda de comunidades
    communitySearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filteredCommunities = communities.filter(community => 
            community.name.toLowerCase().includes(searchTerm) ||
            community.region.toString().includes(searchTerm)
        );
        renderCommunities();
    });

    // ======= FUNCIONALIDAD DE PERSONAL =======
    function renderPersonnel() {
        personnelList.innerHTML = '';
        
        filteredPersonnel.forEach(person => {
            const isSelected = selectedPersonnelList.some(selected => selected.id === person.id);
            
            const personnelItem = document.createElement('div');
            personnelItem.className = `personnel-item ${isSelected ? 'selected' : ''}`;
            personnelItem.innerHTML = `
                <input type="checkbox" class="personnel-checkbox" id="${person.id}" ${isSelected ? 'checked' : ''}>
                <div class="personnel-info">
                    <div class="personnel-name">${person.name}</div>
                    <div class="personnel-role">${person.role}</div>
                </div>
            `;
            
            personnelItem.addEventListener('click', function(e) {
                if (e.target.type !== 'checkbox') {
                    const checkbox = personnelItem.querySelector('.personnel-checkbox');
                    checkbox.checked = !checkbox.checked;
                    togglePersonnel(person.id, person.name, person.role);
                }
            });
            
            const checkbox = personnelItem.querySelector('.personnel-checkbox');
            checkbox.addEventListener('change', function() {
                togglePersonnel(person.id, person.name, person.role);
            });
            
            personnelList.appendChild(personnelItem);
        });
    }

    function togglePersonnel(personId, personName, personRole) {
        const existingIndex = selectedPersonnelList.findIndex(person => person.id === personId);
        
        if (existingIndex > -1) {
            selectedPersonnelList.splice(existingIndex, 1);
        } else {
            selectedPersonnelList.push({ id: personId, name: personName, role: personRole });
        }
        
        updateSelectedPersonnelDisplay();
    }

    function updateSelectedPersonnelDisplay() {
        const count = selectedPersonnelList.length;
        selectedPersonnel.innerHTML = `
            <span class="selected-count">${count} personal seleccionado</span>
        `;
        
        if (count > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'personnel-tags';
            
            selectedPersonnelList.forEach(person => {
                const tag = document.createElement('span');
                tag.className = 'personnel-tag';
                tag.innerHTML = `
                    ${person.name}
                    <span class="personnel-tag-remove" data-id="${person.id}">&times;</span>
                `;
                
                const removeBtn = tag.querySelector('.personnel-tag-remove');
                removeBtn.addEventListener('click', function() {
                    removePersonnel(person.id);
                    // Desmarcar checkbox
                    const checkbox = document.getElementById(person.id);
                    if (checkbox) checkbox.checked = false;
                });
                
                tagsContainer.appendChild(tag);
            });
            
            selectedPersonnel.appendChild(tagsContainer);
        }
    }

    function removePersonnel(personId) {
        selectedPersonnelList = selectedPersonnelList.filter(person => person.id !== personId);
        updateSelectedPersonnelDisplay();
    }

    // Búsqueda de personal
    if (personnelSearch) {
        personnelSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filteredPersonnel = personnelData.filter(person => 
                person.name.toLowerCase().includes(searchTerm) ||
                person.role.toLowerCase().includes(searchTerm)
            );
            renderPersonnel();
        });
    }

    // ======= FUNCIONALIDAD DE PERSONAL PARA EDICIÓN =======
    function renderEditPersonnel() {
        if (!editPersonnelList) return;
        
        editPersonnelList.innerHTML = '';
        
        editFilteredPersonnel.forEach(person => {
            const isSelected = editSelectedPersonnelList.some(selected => selected.id === person.id);
            
            const personnelItem = document.createElement('div');
            personnelItem.className = `personnel-item ${isSelected ? 'selected' : ''}`;
            personnelItem.innerHTML = `
                <input type="checkbox" class="personnel-checkbox" id="edit-${person.id}" ${isSelected ? 'checked' : ''}>
                <div class="personnel-info">
                    <div class="personnel-name">${person.name}</div>
                    <div class="personnel-role">${person.role}</div>
                </div>
            `;
            
            personnelItem.addEventListener('click', function(e) {
                if (e.target.type !== 'checkbox') {
                    const checkbox = personnelItem.querySelector('.personnel-checkbox');
                    checkbox.checked = !checkbox.checked;
                    toggleEditPersonnel(person.id, person.name, person.role);
                }
            });
            
            const checkbox = personnelItem.querySelector('.personnel-checkbox');
            checkbox.addEventListener('change', function() {
                toggleEditPersonnel(person.id, person.name, person.role);
            });
            
            editPersonnelList.appendChild(personnelItem);
        });
    }

    function toggleEditPersonnel(personId, personName, personRole) {
        const existingIndex = editSelectedPersonnelList.findIndex(person => person.id === personId);
        
        if (existingIndex > -1) {
            editSelectedPersonnelList.splice(existingIndex, 1);
        } else {
            editSelectedPersonnelList.push({ id: personId, name: personName, role: personRole });
        }
        
        updateEditSelectedPersonnelDisplay();
    }

    function updateEditSelectedPersonnelDisplay() {
        if (!editSelectedPersonnel) return;
        
        const count = editSelectedPersonnelList.length;
        editSelectedPersonnel.innerHTML = `
            <span class="selected-count">${count} personal seleccionado</span>
        `;
        
        if (count > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'personnel-tags';
            
            editSelectedPersonnelList.forEach(person => {
                const tag = document.createElement('span');
                tag.className = 'personnel-tag';
                tag.innerHTML = `
                    ${person.name}
                    <span class="personnel-tag-remove" data-id="${person.id}">&times;</span>
                `;
                
                const removeBtn = tag.querySelector('.personnel-tag-remove');
                removeBtn.addEventListener('click', function() {
                    removeEditPersonnel(person.id);
                    // Desmarcar checkbox
                    const checkbox = document.getElementById(`edit-${person.id}`);
                    if (checkbox) checkbox.checked = false;
                });
                
                tagsContainer.appendChild(tag);
            });
            
            editSelectedPersonnel.appendChild(tagsContainer);
        }
    }

    function removeEditPersonnel(personId) {
        editSelectedPersonnelList = editSelectedPersonnelList.filter(person => person.id !== personId);
        updateEditSelectedPersonnelDisplay();
    }

    // Búsqueda de personal en edición
    if (editPersonnelSearch) {
        editPersonnelSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            editFilteredPersonnel = personnelData.filter(person => 
                person.name.toLowerCase().includes(searchTerm) ||
                person.role.toLowerCase().includes(searchTerm)
            );
            renderEditPersonnel();
        });
    }

    // ======= FUNCIONALIDAD DE BENEFICIARIOS =======
    let beneficiaryCounter = 0;

    function createBeneficiaryItem() {
        beneficiaryCounter++;
        const beneficiaryItem = document.createElement('div');
        beneficiaryItem.className = 'beneficiary-item';
        beneficiaryItem.innerHTML = `
            <div class="beneficiary-header">
                <div class="beneficiary-type-select">
                    <select class="beneficiary-type" onchange="toggleBeneficiaryFields(this)">
                        <option value="">Seleccione tipo de beneficiario</option>
                        <option value="familia">Familia</option>
                        <option value="persona">Persona Individual</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
                <button type="button" class="remove-beneficiary-btn" onclick="removeBeneficiary(this)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
            <div class="beneficiary-fields" style="display: none;">
                <!-- Campos dinámicos según el tipo -->
            </div>
        `;
        
        return beneficiaryItem;
    }

    // Función global para toggle de campos de beneficiarios
    window.toggleBeneficiaryFields = function(selectElement) {
        const fieldsContainer = selectElement.closest('.beneficiary-item').querySelector('.beneficiary-fields');
        const type = selectElement.value;
        
        fieldsContainer.innerHTML = '';
        fieldsContainer.style.display = 'none';
        
        if (type === 'familia') {
            fieldsContainer.style.display = 'grid';
            fieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Número de Integrantes</label>
                    <input type="number" name="numIntegrantes" class="form-input" min="1" max="20" placeholder="Ej: 4">
                </div>
                <div class="form-group">
                    <label class="form-label">Cabeza de Familia</label>
                    <input type="text" name="cabezaFamilia" class="form-input" placeholder="Nombre completo">
                </div>
                <div class="form-group">
                    <label class="form-label">DPI Cabeza de Familia</label>
                    <input type="text" name="dpiCabezaFamilia" class="form-input" placeholder="1234567890123" maxlength="13">
                </div>
                <div class="form-group">
                    <label class="form-label">Teléfono de Contacto</label>
                    <input type="tel" name="telefonoFamilia" class="form-input" placeholder="1234-5678">
                </div>
            `;
        } else if (type === 'persona') {
            fieldsContainer.style.display = 'grid';
            fieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Nombre Completo</label>
                    <input type="text" name="nombrePersona" class="form-input" placeholder="Nombre completo">
                </div>
                <div class="form-group">
                    <label class="form-label">DPI</label>
                    <input type="text" name="dpiPersona" class="form-input" placeholder="1234567890123" maxlength="13">
                </div>
                <div class="form-group">
                    <label class="form-label">Edad</label>
                    <input type="number" name="edadPersona" class="form-input" min="1" max="120" placeholder="Ej: 35">
                </div>
                <div class="form-group">
                    <label class="form-label">Teléfono</label>
                    <input type="tel" name="telefonoPersona" class="form-input" placeholder="1234-5678">
                </div>
                <div class="form-group">
                    <label class="form-label">Residencia (Comunidad)</label>
                    <input type="text" name="residenciaPersona" class="form-input" placeholder="Comunidad donde reside">
                </div>
            `;
        } else if (type === 'otro') {
            fieldsContainer.style.display = 'grid';
            fieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Especificar Tipo</label>
                    <input type="text" name="otroTipoBeneficiario" class="form-input" placeholder="Ej: Asociación, Cooperativa, etc.">
                </div>
                <div class="form-group">
                    <label class="form-label">Nombre/Denominación</label>
                    <input type="text" name="nombreOtro" class="form-input" placeholder="Nombre de la organización">
                </div>
                <div class="form-group">
                    <label class="form-label">Número de Miembros</label>
                    <input type="number" name="numMiembros" class="form-input" min="1" placeholder="Ej: 15">
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea name="otroDescripcion" class="form-textarea" rows="3" placeholder="Descripción adicional"></textarea>
                </div>
            `;
        }
    };

    // Función global para remover beneficiarios
    window.removeBeneficiary = function(button) {
        const beneficiaryItem = button.closest('.beneficiary-item');
        beneficiaryItem.remove();
    };

    // Agregar beneficiario
    addBeneficiaryBtn.addEventListener('click', function() {
        beneficiariesContainer.appendChild(createBeneficiaryItem());
    });

    // Agregar un beneficiario inicial
    beneficiariesContainer.appendChild(createBeneficiaryItem());

    // ======= FUNCIONALIDAD DE ARCHIVOS =======
    const fileInput = document.getElementById('evidences');
    const filePreview = document.getElementById('filePreview');

    fileInput.addEventListener('change', function() {
        const files = Array.from(this.files);
        filePreview.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';
            
            const icon = file.type.startsWith('image/') ? 
                `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21,15 16,10 5,21"></polyline>
                </svg>` :
                `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                </svg>`;
            
            fileItem.innerHTML = `
                ${icon}
                <span>${file.name}</span>
                <span>(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            `;
            
            filePreview.appendChild(fileItem);
        });
    });

    // ======= FUNCIONALIDAD DEL FORMULARIO =======
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Recopilar datos del formulario
        const formData = new FormData(this);
        const eventData = {
            name: formData.get('eventName'),
            type: formData.get('eventType'),
            communities: selectedCommunitiesList,
            personnel: selectedPersonnelList,
            description: formData.get('eventDescription'),
            beneficiaries: collectBeneficiariesData(),
            evidences: Array.from(fileInput.files),
            createdAt: new Date().toISOString(),
            id: generateEventId()
        };

        // Validar datos
        if (!validateEventData(eventData)) {
            return;
        }

        // Simular creación del evento
        console.log('Evento creado:', eventData);
        
        // Mostrar mensaje de éxito
        showSuccessMessage('Evento creado exitosamente');
        
        // Mostrar botón "Ver Evento Nuevo"
        viewNewEventBtn.style.display = 'inline-flex';
        
        // Agregar a cambios recientes
        addToRecentChanges(`Evento "${eventData.name}" creado por ${getPersonnelName(eventData.personnel)}`);
        
        // Limpiar formulario
        this.reset();
        selectedCommunitiesList = [];
        updateSelectedCommunitiesDisplay();
        renderCommunities();
        beneficiariesContainer.innerHTML = '';
        beneficiariesContainer.appendChild(createBeneficiaryItem());
        filePreview.innerHTML = '';
    });

    function collectBeneficiariesData() {
        const beneficiaries = [];
        const beneficiaryItems = beneficiariesContainer.querySelectorAll('.beneficiary-item');
        
        beneficiaryItems.forEach(item => {
            const typeSelect = item.querySelector('.beneficiary-type');
            const type = typeSelect.value;
            
            if (type) {
                const fields = {};
                const inputs = item.querySelectorAll('input, textarea, select');
                
                inputs.forEach(input => {
                    if (input.name && input.value.trim()) {
                        fields[input.name] = input.value.trim();
                    }
                });
                
                beneficiaries.push({
                    type: type,
                    fields: fields
                });
            }
        });
        
        return beneficiaries;
    }

    function validateEventData(data) {
        if (!data.name.trim()) {
            showErrorMessage('El nombre del evento es requerido');
            return false;
        }
        
        if (!data.type) {
            showErrorMessage('Debe seleccionar un tipo de evento');
            return false;
        }
        
        if (data.communities.length === 0) {
            showErrorMessage('Debe seleccionar al menos una comunidad');
            return false;
        }
        
        if (data.personnel.length === 0) {
            showErrorMessage('Debe seleccionar al menos un miembro del personal a cargo');
            return false;
        }
        
        if (!data.description.trim()) {
            showErrorMessage('La descripción del evento es requerida');
            return false;
        }
        
        return true;
    }

    function generateEventId() {
        return 'event-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    function getPersonnelName(personnelArray) {
        if (Array.isArray(personnelArray)) {
            if (personnelArray.length === 0) return 'Sin personal asignado';
            if (personnelArray.length === 1) return personnelArray[0].name;
            return `${personnelArray[0].name} y ${personnelArray.length - 1} más`;
        }
        return 'Personal no identificado';
    }

    // ======= FUNCIONALIDAD DEL MODAL DE ELIMINACIÓN =======
    // Nota: Los botones de eliminar se manejan a través de la delegación de eventos
    // en la función principal de event listeners

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            hideModal();
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            hideModal();
        });
    }

    // Validar credenciales en tiempo real
    if (adminUsername && adminPassword) {
        [adminUsername, adminPassword].forEach(input => {
            input.addEventListener('input', function() {
                validateCredentials();
            });
        });
    }

    function validateCredentials() {
        if (!adminUsername || !adminPassword) return;
        
        const username = adminUsername.value.trim();
        const password = adminPassword.value.trim();
        
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            if (confirmDeleteBtn) confirmDeleteBtn.style.display = 'inline-flex';
            if (credentialError) credentialError.style.display = 'none';
        } else {
            if (confirmDeleteBtn) confirmDeleteBtn.style.display = 'none';
            if (username && password) {
                if (credentialError) credentialError.style.display = 'block';
            } else {
                if (credentialError) credentialError.style.display = 'none';
            }
        }
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            // Eliminar el evento real
            if (window.eventToDelete && existingEvents[window.eventToDelete]) {
                console.log('Eliminando evento:', window.eventToDelete);
                delete existingEvents[window.eventToDelete];
                updateEventsList();
                showSuccessMessage('Evento eliminado exitosamente');
                addToRecentChanges('Evento eliminado por administrador');
            }
            hideModal();
            
            // Limpiar campos y variables
            if (adminUsername) adminUsername.value = '';
            if (adminPassword) adminPassword.value = '';
            if (credentialError) credentialError.style.display = 'none';
            if (confirmDeleteBtn) confirmDeleteBtn.style.display = 'none';
            window.eventToDelete = null;
        });
    }

    // ======= FUNCIONALIDAD DEL BOTÓN "VER EVENTO NUEVO" =======
    if (viewNewEventBtn) {
        viewNewEventBtn.addEventListener('click', function() {
            // Redirigir a proyectos.html con parámetro para mostrar el evento
            window.location.href = 'proyectos.html?view=detail&eventId=nuevo';
        });
    }

    // ======= FUNCIONES AUXILIARES =======
    function showModal() {
        if (deleteModal) {
            deleteModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function hideModal() {
        if (deleteModal) {
            deleteModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    function showSuccessMessage(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;
        
        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    function showErrorMessage(message) {
        // Crear notificación de error
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>${message}</span>
        `;
        
        // Estilos para la notificación de error
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    function addToRecentChanges(description) {
        const now = new Date();
        const timeString = now.toLocaleString('es-GT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const changeItem = document.createElement('div');
        changeItem.className = 'change-item';
        changeItem.innerHTML = `
            <div class="change-time">${timeString}</div>
            <div class="change-description">${description}</div>
        `;
        
        changesLog.insertBefore(changeItem, changesLog.firstChild);
        
        // Limitar a 10 elementos
        const items = changesLog.querySelectorAll('.change-item');
        if (items.length > 10) {
            changesLog.removeChild(items[items.length - 1]);
        }
    }

    // ======= FUNCIONALIDAD DE EDICIÓN DE EVENTOS =======
    const editEventView = document.getElementById('editEventView');
    const editEventForm = document.getElementById('editEventForm');
    const applyChangesBtn = document.getElementById('applyChangesBtn');
    const backFromEditBtn = document.getElementById('backFromEditBtn');
    const backConfirmModal = document.getElementById('backConfirmModal');
    const applyConfirmModal = document.getElementById('applyConfirmModal');
    const closeBackModal = document.getElementById('closeBackModal');
    const closeApplyModal = document.getElementById('closeApplyModal');
    const cancelBackBtn = document.getElementById('cancelBackBtn');
    const confirmBackBtn = document.getElementById('confirmBackBtn');
    const cancelApplyBtn = document.getElementById('cancelApplyBtn');
    const confirmApplyBtn = document.getElementById('confirmApplyBtn');

    // Datos de eventos existentes (simulados)
    const existingEvents = {
        'event-1': {
            id: 'event-1',
            name: 'Capacitación Agrícola',
            type: 'capacitacion',
            communities: [
                { id: 'comunidad-1', name: 'Comunidad 1', region: 1 },
                { id: 'comunidad-5', name: 'Comunidad 5', region: 1 },
                { id: 'comunidad-12', name: 'Comunidad 12', region: 2 }
            ],
            personnel: 'juan-perez',
            description: 'Capacitación sobre técnicas modernas de cultivo y manejo de suelos para mejorar la productividad agrícola en las comunidades de la región.',
            beneficiaries: [
                {
                    type: 'familia',
                    fields: {
                        numIntegrantes: '4',
                        cabezaFamilia: 'María González',
                        dpiCabezaFamilia: '1234567890123',
                        telefonoFamilia: '1234-5678'
                    }
                },
                {
                    type: 'persona',
                    fields: {
                        nombrePersona: 'Carlos López',
                        dpiPersona: '9876543210987',
                        edadPersona: '35',
                        telefonoPersona: '8765-4321',
                        residenciaPersona: 'Comunidad 1'
                    }
                }
            ],
            evidences: [],
            createdAt: '2024-01-15T14:30:00.000Z',
            lastModified: '2024-01-15T14:30:00.000Z'
        },
        'event-2': {
            id: 'event-2',
            name: 'Entrega de Semillas',
            type: 'entrega',
            communities: [
                { id: 'comunidad-3', name: 'Comunidad 3', region: 1 },
                { id: 'comunidad-7', name: 'Comunidad 7', region: 1 },
                { id: 'comunidad-15', name: 'Comunidad 15', region: 2 },
                { id: 'comunidad-22', name: 'Comunidad 22', region: 3 },
                { id: 'comunidad-28', name: 'Comunidad 28', region: 4 }
            ],
            personnel: 'maria-gomez',
            description: 'Entrega de semillas de maíz y frijol de alta calidad para la temporada de siembra 2024.',
            beneficiaries: [
                {
                    type: 'familia',
                    fields: {
                        numIntegrantes: '6',
                        cabezaFamilia: 'José Martínez',
                        dpiCabezaFamilia: '1111111111111',
                        telefonoFamilia: '1111-1111'
                    }
                }
            ],
            evidences: [],
            createdAt: '2024-01-15T11:15:00.000Z',
            lastModified: '2024-01-15T11:15:00.000Z'
        },
        'event-3': {
            id: 'event-3',
            name: 'Proyecto de Riego',
            type: 'proyecto-ayuda',
            communities: [
                { id: 'comunidad-8', name: 'Comunidad 8', region: 1 },
                { id: 'comunidad-14', name: 'Comunidad 14', region: 2 }
            ],
            personnel: 'carlos-rodriguez',
            description: 'Implementación de sistema de riego por goteo para mejorar la eficiencia hídrica en cultivos de hortalizas.',
            beneficiaries: [
                {
                    type: 'otro',
                    fields: {
                        otroTipoBeneficiario: 'Asociación de Productores',
                        nombreOtro: 'Asociación Verde Purulhá',
                        numMiembros: '15',
                        otroDescripcion: 'Grupo de productores locales dedicados al cultivo de hortalizas'
                    }
                }
            ],
            evidences: [],
            createdAt: '2024-01-14T16:45:00.000Z',
            lastModified: '2024-01-14T16:45:00.000Z'
        }
    };

    let currentEditingEvent = null;
    let hasUnsavedChanges = false;

    // Event listeners para botones de editar y eliminar (delegación de eventos)
    document.addEventListener('click', function(e) {
        // Botón editar
        if (e.target.closest('.btn-edit-event')) {
            e.preventDefault();
            const button = e.target.closest('.btn-edit-event');
            const eventId = button.dataset.eventId;
            console.log('Editando evento:', eventId); // Debug
            openEditView(eventId);
        }
        
        // Botón eliminar
        if (e.target.closest('.btn-delete-event-item')) {
            e.preventDefault();
            const button = e.target.closest('.btn-delete-event-item');
            const eventId = button.dataset.eventId;
            console.log('Eliminando evento:', eventId); // Debug
            deleteEventFromList(eventId);
        }
    });

    function openEditView(eventId) {
        console.log('Abriendo vista de edición para:', eventId);
        currentEditingEvent = existingEvents[eventId];
        if (!currentEditingEvent) {
            console.error('Evento no encontrado:', eventId);
            return;
        }

        console.log('Evento encontrado:', currentEditingEvent);
        
        // Cargar datos del evento en el formulario de edición
        loadEventDataForEdit(currentEditingEvent);
        
        // Mostrar vista de edición
        editEventView.style.display = 'block';
        setTimeout(() => {
            editEventView.classList.add('show');
            document.body.style.overflow = 'hidden';
        }, 10);

        // Marcar que no hay cambios sin guardar
        hasUnsavedChanges = false;
    }

    function loadEventDataForEdit(eventData) {
        // Cargar datos básicos
        document.getElementById('editEventName').value = eventData.name;
        document.getElementById('editEventType').value = eventData.type;
        document.getElementById('editEventDescription').value = eventData.description;

        // Cargar personal seleccionado
        editSelectedPersonnelList = [...eventData.personnel];
        updateEditSelectedPersonnelDisplay();
        renderEditPersonnel();

        // Cargar comunidades seleccionadas
        selectedCommunitiesList = [...eventData.communities];
        updateEditSelectedCommunitiesDisplay();
        renderEditCommunities();

        // Cargar beneficiarios
        loadBeneficiariesForEdit(eventData.beneficiaries);

        // Actualizar título
        document.getElementById('editEventName').textContent = eventData.name;
    }

    function loadBeneficiariesForEdit(beneficiaries) {
        const container = document.getElementById('editBeneficiariesContainer');
        container.innerHTML = '';

        beneficiaries.forEach(beneficiary => {
            const beneficiaryItem = createEditBeneficiaryItem(beneficiary);
            container.appendChild(beneficiaryItem);
        });

        // Si no hay beneficiarios, agregar uno vacío
        if (beneficiaries.length === 0) {
            container.appendChild(createEditBeneficiaryItem());
        }
    }

    function createEditBeneficiaryItem(beneficiaryData = null) {
        const beneficiaryItem = document.createElement('div');
        beneficiaryItem.className = 'beneficiary-item';
        
        const type = beneficiaryData ? beneficiaryData.type : '';
        const fields = beneficiaryData ? beneficiaryData.fields : {};
        
        beneficiaryItem.innerHTML = `
            <div class="beneficiary-header">
                <div class="beneficiary-type-select">
                    <select class="beneficiary-type" onchange="toggleEditBeneficiaryFields(this)">
                        <option value="">Seleccione tipo de beneficiario</option>
                        <option value="familia" ${type === 'familia' ? 'selected' : ''}>Familia</option>
                        <option value="persona" ${type === 'persona' ? 'selected' : ''}>Persona Individual</option>
                        <option value="otro" ${type === 'otro' ? 'selected' : ''}>Otro</option>
                    </select>
                </div>
                <button type="button" class="remove-beneficiary-btn" onclick="removeEditBeneficiary(this)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
            <div class="beneficiary-fields" style="display: ${type ? 'grid' : 'none'};">
                ${generateBeneficiaryFieldsHTML(type, fields)}
            </div>
        `;
        
        return beneficiaryItem;
    }

    function generateBeneficiaryFieldsHTML(type, fields) {
        switch (type) {
            case 'familia':
                return `
                    <div class="form-group">
                        <label class="form-label">Número de Integrantes</label>
                        <input type="number" name="numIntegrantes" class="form-input" min="1" max="20" value="${fields.numIntegrantes || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cabeza de Familia</label>
                        <input type="text" name="cabezaFamilia" class="form-input" value="${fields.cabezaFamilia || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">DPI Cabeza de Familia</label>
                        <input type="text" name="dpiCabezaFamilia" class="form-input" maxlength="13" value="${fields.dpiCabezaFamilia || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Teléfono de Contacto</label>
                        <input type="tel" name="telefonoFamilia" class="form-input" value="${fields.telefonoFamilia || ''}">
                    </div>
                `;
            case 'persona':
                return `
                    <div class="form-group">
                        <label class="form-label">Nombre Completo</label>
                        <input type="text" name="nombrePersona" class="form-input" value="${fields.nombrePersona || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">DPI</label>
                        <input type="text" name="dpiPersona" class="form-input" maxlength="13" value="${fields.dpiPersona || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Edad</label>
                        <input type="number" name="edadPersona" class="form-input" min="1" max="120" value="${fields.edadPersona || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Teléfono</label>
                        <input type="tel" name="telefonoPersona" class="form-input" value="${fields.telefonoPersona || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Residencia (Comunidad)</label>
                        <input type="text" name="residenciaPersona" class="form-input" value="${fields.residenciaPersona || ''}">
                    </div>
                `;
            case 'otro':
                return `
                    <div class="form-group">
                        <label class="form-label">Especificar Tipo</label>
                        <input type="text" name="otroTipoBeneficiario" class="form-input" value="${fields.otroTipoBeneficiario || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nombre/Denominación</label>
                        <input type="text" name="nombreOtro" class="form-input" value="${fields.nombreOtro || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Número de Miembros</label>
                        <input type="number" name="numMiembros" class="form-input" min="1" value="${fields.numMiembros || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <textarea name="otroDescripcion" class="form-textarea" rows="3">${fields.otroDescripcion || ''}</textarea>
                    </div>
                `;
            default:
                return '';
        }
    }

    // Funciones globales para edición
    window.toggleEditBeneficiaryFields = function(selectElement) {
        const fieldsContainer = selectElement.closest('.beneficiary-item').querySelector('.beneficiary-fields');
        const type = selectElement.value;
        
        fieldsContainer.innerHTML = '';
        fieldsContainer.style.display = 'none';
        
        if (type) {
            fieldsContainer.style.display = 'grid';
            fieldsContainer.innerHTML = generateBeneficiaryFieldsHTML(type, {});
        }
        
        hasUnsavedChanges = true;
    };

    window.removeEditBeneficiary = function(button) {
        const beneficiaryItem = button.closest('.beneficiary-item');
        beneficiaryItem.remove();
        hasUnsavedChanges = true;
    };

    // Funcionalidad de comunidades en edición
    let editSelectedCommunitiesList = [];

    function renderEditCommunities() {
        const communitiesList = document.getElementById('editCommunitiesList');
        communitiesList.innerHTML = '';
        
        filteredCommunities.forEach(community => {
            const isSelected = editSelectedCommunitiesList.some(selected => selected.id === community.id);
            
            const communityItem = document.createElement('div');
            communityItem.className = 'community-item';
            communityItem.innerHTML = `
                <input type="checkbox" id="edit-${community.id}" value="${community.id}" ${isSelected ? 'checked' : ''}>
                <label for="edit-${community.id}">${community.name} (Región ${community.region})</label>
            `;
            
            const checkbox = communityItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    addEditCommunity(community);
                } else {
                    removeEditCommunity(community.id);
                }
            });
            
            communitiesList.appendChild(communityItem);
        });
    }

    function addEditCommunity(community) {
        if (!editSelectedCommunitiesList.some(selected => selected.id === community.id)) {
            editSelectedCommunitiesList.push(community);
            updateEditSelectedCommunitiesDisplay();
            hasUnsavedChanges = true;
        }
    }

    function removeEditCommunity(communityId) {
        editSelectedCommunitiesList = editSelectedCommunitiesList.filter(community => community.id !== communityId);
        updateEditSelectedCommunitiesDisplay();
        hasUnsavedChanges = true;
    }

    function updateEditSelectedCommunitiesDisplay() {
        const container = document.getElementById('editSelectedCommunities');
        const count = editSelectedCommunitiesList.length;
        container.innerHTML = `
            <span class="selected-count">${count} ${count === 1 ? 'comunidad' : 'comunidades'} seleccionada${count === 1 ? '' : 's'}</span>
        `;
        
        if (count > 0) {
            editSelectedCommunitiesList.forEach(community => {
                const tag = document.createElement('span');
                tag.className = 'selected-community-tag';
                tag.innerHTML = `
                    ${community.name}
                    <span class="remove-tag" data-id="${community.id}">&times;</span>
                `;
                
                const removeBtn = tag.querySelector('.remove-tag');
                removeBtn.addEventListener('click', function() {
                    removeEditCommunity(community.id);
                    const checkbox = document.getElementById(`edit-${community.id}`);
                    if (checkbox) checkbox.checked = false;
                });
                
                container.appendChild(tag);
            });
        }
    }

    // Búsqueda de comunidades en edición
    document.getElementById('editCommunitySearch').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filteredCommunities = communities.filter(community => 
            community.name.toLowerCase().includes(searchTerm) ||
            community.region.toString().includes(searchTerm)
        );
        renderEditCommunities();
    });

    // Agregar beneficiario en edición
    document.getElementById('editAddBeneficiaryBtn').addEventListener('click', function() {
        const container = document.getElementById('editBeneficiariesContainer');
        container.appendChild(createEditBeneficiaryItem());
        hasUnsavedChanges = true;
    });

    // Detectar cambios en el formulario de edición
    editEventForm.addEventListener('input', function() {
        hasUnsavedChanges = true;
    });

    editEventForm.addEventListener('change', function() {
        hasUnsavedChanges = true;
    });

    // Botón Aplicar Cambios
    applyChangesBtn.addEventListener('click', function() {
        showApplyConfirmModal();
    });

    // Botón Volver
    backFromEditBtn.addEventListener('click', function() {
        if (hasUnsavedChanges) {
            showBackConfirmModal();
        } else {
            closeEditView();
        }
    });

    // Modales de confirmación
    function showBackConfirmModal() {
        backConfirmModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function showApplyConfirmModal() {
        applyConfirmModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function hideBackConfirmModal() {
        backConfirmModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    function hideApplyConfirmModal() {
        applyConfirmModal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Event listeners para modales de confirmación
    closeBackModal.addEventListener('click', hideBackConfirmModal);
    closeApplyModal.addEventListener('click', hideApplyConfirmModal);
    cancelBackBtn.addEventListener('click', hideBackConfirmModal);
    cancelApplyBtn.addEventListener('click', hideApplyConfirmModal);

    confirmBackBtn.addEventListener('click', function() {
        hideBackConfirmModal();
        closeEditView();
    });

    confirmApplyBtn.addEventListener('click', function() {
        hideApplyConfirmModal();
        applyChanges();
    });

    function applyChanges() {
        // Recopilar datos del formulario de edición
        const formData = new FormData(editEventForm);
        const updatedEventData = {
            ...currentEditingEvent,
            name: formData.get('editEventName'),
            type: formData.get('editEventType'),
            communities: editSelectedCommunitiesList,
            personnel: editSelectedPersonnelList,
            description: formData.get('editEventDescription'),
            beneficiaries: collectEditBeneficiariesData(),
            lastModified: new Date().toISOString()
        };

        // Validar datos
        if (!validateEventData(updatedEventData)) {
            return;
        }

        // Actualizar evento en la lista
        existingEvents[currentEditingEvent.id] = updatedEventData;
        
        // Actualizar la lista de eventos en la vista principal
        updateEventsList();
        
        // Mostrar mensaje de éxito
        showSuccessMessage('Evento actualizado exitosamente');
        
        // Agregar a cambios recientes
        addToRecentChanges(`Evento "${updatedEventData.name}" actualizado por ${getPersonnelName(updatedEventData.personnel)}`);
        
        // Cerrar vista de edición
        closeEditView();
    }

    function collectEditBeneficiariesData() {
        const beneficiaries = [];
        const beneficiaryItems = document.getElementById('editBeneficiariesContainer').querySelectorAll('.beneficiary-item');
        
        beneficiaryItems.forEach(item => {
            const typeSelect = item.querySelector('.beneficiary-type');
            const type = typeSelect.value;
            
            if (type) {
                const fields = {};
                const inputs = item.querySelectorAll('input, textarea, select');
                
                inputs.forEach(input => {
                    if (input.name && input.value.trim()) {
                        fields[input.name] = input.value.trim();
                    }
                });
                
                beneficiaries.push({
                    type: type,
                    fields: fields
                });
            }
        });
        
        return beneficiaries;
    }

    function closeEditView() {
        editEventView.classList.remove('show');
        setTimeout(() => {
            editEventView.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
        
        currentEditingEvent = null;
        hasUnsavedChanges = false;
        editSelectedCommunitiesList = [];
    }

    function deleteEventFromList(eventId) {
        console.log('Mostrando modal de eliminación para evento:', eventId);
        // Almacenar el ID del evento a eliminar
        window.eventToDelete = eventId;
        showModal();
    }

    function updateEventsList() {
        const eventsList = document.getElementById('eventsList');
        eventsList.innerHTML = '';
        
        Object.values(existingEvents).forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.innerHTML = `
                <div class="event-info">
                    <h3 class="event-name">${event.name}</h3>
                    <p class="event-type">Tipo: ${getEventTypeName(event.type)}</p>
                    <p class="event-communities">Comunidades: ${event.communities.length} seleccionada${event.communities.length === 1 ? '' : 's'}</p>
                    <p class="event-personnel">Personal: ${getPersonnelName(event.personnel)}</p>
                    <p class="event-date">Creado: ${new Date(event.createdAt).toLocaleString('es-GT')}</p>
                </div>
                <div class="event-actions">
                    <button type="button" class="btn-edit-event" data-event-id="${event.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                    </button>
                    <button type="button" class="btn-delete-event-item" data-event-id="${event.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar
                    </button>
                </div>
            `;
            eventsList.appendChild(eventItem);
        });
        
        // Agregar event listeners a los botones recién creados
        eventsList.querySelectorAll('.btn-edit-event').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const eventId = this.dataset.eventId;
                console.log('Editando evento (dinámico):', eventId);
                openEditView(eventId);
            });
        });
        
        eventsList.querySelectorAll('.btn-delete-event-item').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const eventId = this.dataset.eventId;
                console.log('Eliminando evento (dinámico):', eventId);
                deleteEventFromList(eventId);
            });
        });
    }

    function getEventTypeName(type) {
        const typeNames = {
            'capacitacion': 'Capacitación',
            'entrega': 'Entrega',
            'proyecto-ayuda': 'Proyecto de Ayuda',
            'otro': 'Otro'
        };
        return typeNames[type] || type;
    }

    // ======= INICIALIZACIÓN =======
    console.log('Inicializando gestión de eventos...');
    
    // Verificar que los elementos críticos existan
    console.log('Verificando elementos del DOM:');
    console.log('- deleteModal:', !!deleteModal);
    console.log('- closeModal:', !!closeModal);
    console.log('- cancelDeleteBtn:', !!cancelDeleteBtn);
    console.log('- confirmDeleteBtn:', !!confirmDeleteBtn);
    console.log('- adminUsername:', !!adminUsername);
    console.log('- adminPassword:', !!adminPassword);
    console.log('- credentialError:', !!credentialError);
    console.log('- changesLog:', !!changesLog);
    
    renderCommunities();
    renderPersonnel();
    renderEditPersonnel();
    updateEventsList();
    
    // Función para inicializar event listeners
    function initializeEventListeners() {
        console.log('Inicializando event listeners...');
        
        // Event listeners para botones estáticos
        const editButtons = document.querySelectorAll('.btn-edit-event');
        const deleteButtons = document.querySelectorAll('.btn-delete-event-item');
        
        console.log('Botones de editar encontrados:', editButtons.length);
        console.log('Botones de eliminar encontrados:', deleteButtons.length);
        
        editButtons.forEach((button, index) => {
            console.log(`Agregando listener a botón editar ${index + 1}:`, button.dataset.eventId);
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const eventId = this.dataset.eventId;
                console.log('Editando evento (estático):', eventId);
                openEditView(eventId);
            });
        });
        
        deleteButtons.forEach((button, index) => {
            console.log(`Agregando listener a botón eliminar ${index + 1}:`, button.dataset.eventId);
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const eventId = this.dataset.eventId;
                console.log('Eliminando evento (estático):', eventId);
                deleteEventFromList(eventId);
            });
        });
    }
    
    // Inicializar event listeners después de un pequeño delay
    setTimeout(initializeEventListeners, 100);
    
    // Cerrar modal al hacer clic fuera
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            hideModal();
        }
    });
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (deleteModal.classList.contains('show')) {
                hideModal();
            } else if (backConfirmModal.classList.contains('show')) {
                hideBackConfirmModal();
            } else if (applyConfirmModal.classList.contains('show')) {
                hideApplyConfirmModal();
            } else if (editEventView.classList.contains('show')) {
                if (hasUnsavedChanges) {
                    showBackConfirmModal();
                } else {
                    closeEditView();
                }
            }
        }
    });

    // ======= NUEVA FUNCIONALIDAD PARA TARJETAS PRINCIPALES =======
    
    // Elementos de las tarjetas principales
    const mainView = document.getElementById('mainView');
    const createEventView = document.getElementById('createEventView');
    const manageEventView = document.getElementById('manageEventView');
    const openCreateEventBtn = document.getElementById('openCreateEventBtn');
    const openManageEventBtn = document.getElementById('openManageEventBtn');
    const backFromCreateBtn = document.getElementById('backFromCreateBtn');
    const backFromManageBtn = document.getElementById('backFromManageBtn');
    const generateReportBtn = document.getElementById('generateReportBtn');

    // Función para mostrar vista principal
    function showMainView() {
        mainView.style.display = 'block';
        createEventView.style.display = 'none';
        manageEventView.style.display = 'none';
        createEventView.classList.remove('active');
        manageEventView.classList.remove('active');
    }

    // Función para mostrar vista de crear evento
    function showCreateEventView() {
        mainView.style.display = 'none';
        createEventView.style.display = 'block';
        manageEventView.style.display = 'none';
        createEventView.classList.add('active');
        manageEventView.classList.remove('active');
    }

    // Función para mostrar vista de gestionar eventos
    function showManageEventView() {
        mainView.style.display = 'none';
        createEventView.style.display = 'none';
        manageEventView.style.display = 'block';
        createEventView.classList.remove('active');
        manageEventView.classList.add('active');
    }

    // Event listeners para las tarjetas principales
    if (openCreateEventBtn) {
        openCreateEventBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Abriendo vista de crear evento');
            showCreateEventView();
        });
    }

    if (openManageEventBtn) {
        openManageEventBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Abriendo vista de gestionar eventos');
            showManageEventView();
        });
    }

    // Event listeners para botones de volver
    if (backFromCreateBtn) {
        backFromCreateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Volviendo a vista principal desde crear evento');
            showMainView();
        });
    }

    if (backFromManageBtn) {
        backFromManageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Volviendo a vista principal desde gestionar eventos');
            showMainView();
        });
    }

    // Event listener para botón de generar reporte
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Generando reporte...');
            // Aquí se implementará la funcionalidad de generar reporte
            alert('Funcionalidad de generar reporte será implementada próximamente');
        });
    }

    // Inicializar con vista principal
    showMainView();
});
