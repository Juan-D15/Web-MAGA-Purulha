/**
 * ========================================
 * CARGA DE ÚLTIMOS EVENTOS EN EL INICIO
 * ========================================
 */

const DEBUG_LOGS = (() => {
    try {
        return Boolean(window && window.localStorage && window.localStorage.getItem('WEBMAGA_DEBUG'));
    } catch (err) {
        return false;
    }
})();
const debugLog = (...args) => { if (DEBUG_LOGS) console.log(...args); };
const debugWarn = (...args) => { if (DEBUG_LOGS) console.warn(...args); };

// Función para cargar los últimos eventos desde la API
async function cargarUltimosEventos() {
    try {
        const response = await fetch('/api/ultimos-eventos-inicio/');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        if (data.success && data.eventos && data.eventos.length > 0) {
            renderizarEventos(data.eventos);
            debugLog(`✅ ${data.eventos.length} eventos cargados exitosamente`);
        } else {
            debugWarn('⚠️ No hay eventos para mostrar');
            mostrarMensajeSinEventos();
        }
    } catch (error) {
        console.error('❌ Error al cargar eventos:', error);
        mostrarMensajeSinEventos();
    }
}

// Función para renderizar los eventos en el carrusel
function renderizarEventos(eventos) {
    const carousel = document.getElementById('eventsCarousel');
    const indicatorsContainer = document.querySelector('.events__indicators');
    
    if (!carousel || !indicatorsContainer) {
        console.error('❌ No se encontró el contenedor del carrusel o indicadores');
        return;
    }
    
    // Limpiar el carrusel e indicadores
    carousel.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    // Crear las tarjetas de eventos
    eventos.forEach((evento, index) => {
        const placeholderSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'><rect width='100%' height='100%' fill='%231d2531'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23b8c5d1' font-family='Arial' font-size='16'>Sin imagen</text></svg>";
        const invalidSrc = !evento.imagen_url || evento.imagen_url === 'null' || evento.imagen_url === 'undefined' || /default-event\.jpg$/i.test(String(evento.imagen_url));
        const safeImgSrc = invalidSrc ? placeholderSvg : evento.imagen_url;
        // Crear tarjeta de evento
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        if (index === 0) {
            eventCard.classList.add('active');
        }
        
        eventCard.innerHTML = `
            <div class="event-card__date">
                <div class="date__month">${evento.fecha_mes || 'N/D'}</div>
                <div class="date__day">${evento.fecha_dia || '00'}</div>
                <div class="date__year">${evento.fecha_anio || '0000'}</div>
            </div>
            <div class="event-card__image">
                <img src="${safeImgSrc}" alt="${evento.nombre}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${placeholderSvg}'">
                <button class="event-card__btn" data-evento-id="${evento.id}">Ver más ></button>
            </div>
            <div class="event-card__content">
                <h3 class="event-card__title">${evento.nombre}</h3>
                <p class="event-card__description">${evento.descripcion}</p>
            </div>
        `;
        
        carousel.appendChild(eventCard);
        
        // Crear indicador
        const indicator = document.createElement('button');
        indicator.className = 'indicator';
        if (index === 0) {
            indicator.classList.add('active');
        }
        indicator.setAttribute('data-slide', index);
        indicator.setAttribute('aria-label', `Ver evento ${index + 1}`);
        
        indicatorsContainer.appendChild(indicator);
    });
    
    // Reinicializar el carrusel
    inicializarCarrusel();
    
    // Agregar event listeners a los botones "Ver más"
    agregarEventListenersVerMas();
}

// Función para mostrar mensaje cuando no hay eventos
function mostrarMensajeSinEventos() {
    const carousel = document.getElementById('eventsCarousel');
    if (carousel) {
        carousel.innerHTML = `
            <div class="event-card active" style="display: flex; align-items: center; justify-content: center; min-height: 300px;">
                <div style="text-align: center; padding: 2rem; color: #b8c5d1;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 style="color: #ffffff; margin-bottom: 0.5rem;">No hay eventos disponibles</h3>
                    <p style="color: #b8c5d1;">Los eventos aparecerán aquí cuando se creen.</p>
                </div>
            </div>
        `;
    }
}

// Función para inicializar el carrusel
function inicializarCarrusel() {
    const carousel = document.getElementById('eventsCarousel');
    const cards = carousel.querySelectorAll('.event-card');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let autoSlideInterval;
    let isMobile = window.innerWidth <= 900;
    
    const showSlide = (index) => {
        // Remover clase active de todas las tarjetas e indicadores
        cards.forEach(card => card.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        if (isMobile) {
            // En móvil: mostrar solo una tarjeta centrada
            cards[index].classList.add('active');
            indicators[index].classList.add('active');
        } else {
            // En escritorio: mostrar dos tarjetas en cadena centradas
            cards[index].classList.add('active');
            const nextIndex = (index + 1) % cards.length;
            cards[nextIndex].classList.add('active');
            
            // Activar indicador correspondiente
            indicators[index].classList.add('active');
        }
        
        currentSlide = index;
    };
    
    const nextSlide = () => {
        const nextIndex = (currentSlide + 1) % cards.length;
        showSlide(nextIndex);
    };
    
    const startAutoSlide = () => {
        stopAutoSlide(); // Limpiar cualquier intervalo previo
        autoSlideInterval = setInterval(nextSlide, 4000); // Cambia cada 4 segundos
    };
    
    const stopAutoSlide = () => {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
    };
    
    // Event listeners para indicadores
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
            stopAutoSlide();
            startAutoSlide(); // Reiniciar el auto-slide
        });
    });
    
    // Pausar auto-slide al hacer hover
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
    
    // Detectar cambios de tamaño de pantalla
    window.addEventListener('resize', () => {
        const wasMobile = isMobile;
        isMobile = window.innerWidth <= 900;
        
        // Si cambió el tipo de vista, reiniciar el carousel
        if (wasMobile !== isMobile) {
            stopAutoSlide();
            showSlide(currentSlide);
            startAutoSlide();
        }
    });
    
    // Iniciar auto-slide
    startAutoSlide();
}

// Función para agregar event listeners a los botones "Ver más"
function agregarEventListenersVerMas() {
    const botonesVerMas = document.querySelectorAll('.event-card__btn');
    
    botonesVerMas.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.preventDefault();
            const eventoId = this.getAttribute('data-evento-id');
            if (eventoId) {
                // Redirigir a la página de proyectos con el detalle del evento
                window.location.href = `/proyectos/#evento-${eventoId}`;
            }
        });
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    debugLog('🚀 Iniciando carga de últimos eventos...');
    cargarUltimosEventos();
});

