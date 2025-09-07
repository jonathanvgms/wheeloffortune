console.log('Script cargado correctamente');

// Variable global para restricciones
let restricciones = new Map();

// Mostrar estado inicial al cargar
document.addEventListener('DOMContentLoaded', function() {
    mostrarEstadoInicial();
    
    // Configurar el manejo del archivo
    document.getElementById('archivoPersonas').addEventListener('change', function(e) {
        const archivo = e.target.files[0];
        if (archivo && archivo.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const contenido = e.target.result;
                const textarea = document.getElementById('personas');
                textarea.value = contenido.trim();
                
                // NO mostrar el mensaje verde de confirmación
                // document.getElementById('nombreArchivo').textContent = `Archivo cargado: ${archivo.name}`;
                // document.getElementById('archivoInfo').style.display = 'block';
                
                // NO limpiar el input file para mantener el nombre visible
                // document.getElementById('archivoPersonas').value = '';
            };
            reader.readAsText(archivo);
        } else if (archivo) {
            alert('Por favor selecciona un archivo de texto (.txt)');
            e.target.value = '';
        }
    });
    
    // Manejar cambio en el archivo de restricciones
    document.getElementById('archivoRestricciones').addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (!file) {
            document.getElementById('archivoRestriccionesInfo').style.display = 'none';
            return;
        }
        
        // Mostrar información del archivo
        document.getElementById('nombreArchivoRestricciones').textContent = `Archivo seleccionado: ${file.name}`;
        document.getElementById('archivoRestriccionesInfo').style.display = 'block';
        
        // Leer y procesar archivo
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                procesarArchivoRestricciones(event.target.result);
            } catch (error) {
                alert('Error al procesar el archivo: ' + error.message);
                console.error('Error:', error);
            }
        };
        reader.readAsText(file);
    });
    
    // Actualizar listas cuando cambie el textarea
    document.getElementById('personas').addEventListener('input', actualizarListasPersonas);
    
    // Mostrar modal de restricciones
    document.getElementById('restriccionesModal').addEventListener('show.bs.modal', function() {
        actualizarListasPersonas();
        mostrarRestricciones();
    });
    
    // Funcionalidad de teclas para mostrar/ocultar botón de restricciones
    let keysPressed = new Set();
    
    document.addEventListener('keydown', function(e) {
        keysPressed.add(e.key);
        
        // Verificar combinación Ctrl + Shift + R
        if (keysPressed.has('Control') && keysPressed.has('Shift') && keysPressed.has('R')) {
            e.preventDefault();
            toggleBotonRestricciones();
        }
    });
    
    document.addEventListener('keyup', function(e) {
        keysPressed.delete(e.key);
    });
    
    // Limpiar teclas presionadas cuando la ventana pierde el foco
    window.addEventListener('blur', function() {
        keysPressed.clear();
    });
});

document.getElementById('groupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const personasRaw = document.getElementById('personas').value.trim();
    let personas = personasRaw.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    const numGrupos = parseInt(document.getElementById('numGrupos').value, 10);
    const personasMinPorGrupo = parseInt(document.getElementById('personasPorGrupo').value, 10);

    if (personas.length === 0) {
        mostrarResultado('<div class="alert alert-danger text-center">Ingrese al menos una persona.</div>');
        mostrarBotonExportar(false);
        mostrarEstadoInicial();
        return;
    }
    if (numGrupos < 1 || personasMinPorGrupo < 1) {
        mostrarResultado('<div class="alert alert-danger text-center">Los valores deben ser mayores a cero.</div>');
        mostrarBotonExportar(false);
        mostrarEstadoInicial();
        return;
    }
    if (numGrupos * personasMinPorGrupo > personas.length) {
        mostrarResultado('<div class="alert alert-danger text-center">No hay suficientes personas para garantizar el mínimo por grupo.</div>');
        mostrarBotonExportar(false);
        mostrarEstadoInicial();
        return;
    }

    mostrarAnimacionIntriga(true);
    mostrarResultado('');
    mostrarBotonExportar(false);
    ocultarEstadoInicial();
    setTimeout(() => {
        try {
            const grupos = armarGruposConRestricciones(personas, numGrupos, personasMinPorGrupo, restricciones);
            
            // Mostrar grupos en la consola
            mostrarGruposEnConsola(grupos);
            
            mostrarAnimacionIntriga(false);
            mostrarResultado(renderizarGrupos(grupos, true));
            mostrarBotonExportar(true);
            ocultarEstadoInicial();
        } catch (error) {
            mostrarAnimacionIntriga(false);
            mostrarResultado(`<div class="alert alert-danger text-center">Error: ${error.message}</div>`);
            mostrarBotonExportar(false);
            ocultarEstadoInicial();
        }
    }, 1600 + Math.random() * 900);
});

function mezclarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function mostrarGruposEnConsola(grupos) {
    console.log('🎯 GRUPOS GENERADOS ALEATORIAMENTE');
    console.log('=====================================');
    
    grupos.forEach((grupo, idx) => {
        console.log(`📋 Grupo ${idx + 1} (${grupo.length} personas):`);
        grupo.forEach((persona, personaIdx) => {
            console.log(`  ${personaIdx + 1}. ${persona}`);
        });
        console.log(''); // Línea en blanco entre grupos
    });
    
    console.log('=====================================');
    console.log(`✅ Total de grupos: ${grupos.length}`);
    console.log(`👥 Total de personas: ${grupos.reduce((total, grupo) => total + grupo.length, 0)}`);
    
    // Mostrar estadísticas de distribución
    const tamaños = grupos.map(grupo => grupo.length);
    const min = Math.min(...tamaños);
    const max = Math.max(...tamaños);
    const promedio = (tamaños.reduce((a, b) => a + b, 0) / tamaños.length).toFixed(1);
    
    console.log(`📊 Distribución: min ${min}, max ${max}, promedio ${promedio} personas por grupo`);
    
    // Mostrar también un formato más compacto
    console.log('\n� RESUMEN COMPACTO:');
    grupos.forEach((grupo, idx) => {
        console.log(`Grupo ${idx + 1} (${grupo.length}): [${grupo.join(', ')}]`);
    });
}

function renderizarGrupos(grupos, animar = false) {
    let html = '<div class="row">';
    grupos.forEach((grupo, idx) => {
        html += `<div class="col-md-6 col-lg-4 mb-3">
            <div class="card grupo-card" style="opacity:0;transform:scale(.85) translateY(30px);transition:all .7s;">
                <div class="card-header bg-primary text-white text-center">
                    <h6 class="mb-0">Grupo ${idx + 1} <span class='ms-1'>🎉</span></h6>
                </div>
                <div class="card-body">`;
        grupo.forEach((persona, personaIdx) => {
            html += `<div class="mb-2">${persona}</div>`;
        });
        html += `</div>
            </div>
        </div>`;
    });
    html += '</div>';
    
    setTimeout(() => {
        if (animar) {
            document.querySelectorAll('.grupo-card').forEach((el, i) => {
                setTimeout(() => {
                    el.style.opacity = 1;
                    el.style.transform = 'scale(1) translateY(0)';
                }, 220 * i);
            });
        }
    }, 80);
    return html;
}

function mostrarResultado(html) {
    document.getElementById('resultado').innerHTML = html;
}

function mostrarAnimacionIntriga(mostrar) {
    const loader = document.getElementById('animacionIntriga');
    if (mostrar) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

function ocultarEstadoInicial() {
    document.getElementById('estadoInicial').classList.add('hidden');
}

function mostrarEstadoInicial() {
    document.getElementById('estadoInicial').classList.remove('hidden');
}

function mostrarBotonExportar(mostrar) {
    document.getElementById('exportarBtn').style.display = mostrar ? 'inline-block' : 'none';
}

function toggleBotonRestricciones() {
    const boton = document.getElementById('btnRestricciones');
    const estaOculto = boton.classList.contains('hidden');
    
    if (estaOculto) {
        boton.classList.remove('hidden');
        // Mostrar una pequeña animación y notificación
        boton.style.transform = 'scale(0.8)';
        boton.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            boton.style.transform = 'scale(1)';
        }, 50);
        
        // Mostrar notificación temporal
        mostrarNotificacionRestricciones('🔧 Botón de restricciones activado!', 'success');
    } else {
        boton.classList.add('hidden');
        mostrarNotificacionRestricciones('🔒 Botón de restricciones oculto', 'info');
    }
}

function mostrarNotificacionRestricciones(mensaje, tipo) {
    // Crear notificación temporal
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        transform: translateX(400px);
        transition: all 0.4s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Color según tipo
    if (tipo === 'success') {
        notificacion.style.backgroundColor = '#198754';
    } else if (tipo === 'info') {
        notificacion.style.backgroundColor = '#0dcaf0';
    }
    
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    // Animar entrada
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
    }, 50);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 400);
    }, 3000);
}

function exportarImagen() {
    const elemento = document.getElementById('resultado');
    const titulo = document.createElement('div');
    titulo.style.cssText = 'text-align:center;padding:20px;background:#fff;font-size:24px;font-weight:bold;color:#0d6efd;';
    titulo.textContent = 'Grupos Generados Aleatoriamente';
    
    // Crear contenedor temporal
    const contenedor = document.createElement('div');
    contenedor.style.cssText = 'background:#fff;padding:20px;';
    contenedor.appendChild(titulo);
    contenedor.appendChild(elemento.cloneNode(true));
    
    // Agregar al DOM temporalmente
    document.body.appendChild(contenedor);
    
    html2canvas(contenedor, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
    }).then(canvas => {
        // Remover elemento temporal
        document.body.removeChild(contenedor);
        
        // Crear y descargar imagen
        const link = document.createElement('a');
        link.download = 'grupos-aleatorios.png';
        link.href = canvas.toDataURL();
        link.click();
    }).catch(error => {
        document.body.removeChild(contenedor);
        alert('Error al exportar imagen: ' + error.message);
    });
}

function actualizarListasPersonas() {
    const personasText = document.getElementById('personas').value.trim();
    const personas = personasText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    
    const select1 = document.getElementById('persona1');
    const select2 = document.getElementById('persona2');
    
    // Limpiar opciones
    select1.innerHTML = '<option value="">Seleccionar persona...</option>';
    select2.innerHTML = '<option value="">Seleccionar persona...</option>';
    
    // Agregar personas
    personas.forEach(persona => {
        select1.innerHTML += `<option value="${persona}">${persona}</option>`;
        select2.innerHTML += `<option value="${persona}">${persona}</option>`;
    });
}

function agregarRestriccion() {
    const persona1 = document.getElementById('persona1').value;
    const persona2 = document.getElementById('persona2').value;
    
    if (!persona1 || !persona2) {
        alert('Selecciona ambas personas');
        return;
    }
    
    if (persona1 === persona2) {
        alert('Una persona no puede tener restricción consigo misma');
        return;
    }
    
    // Agregar restricción bidireccional
    if (!restricciones.has(persona1)) {
        restricciones.set(persona1, new Set());
    }
    if (!restricciones.has(persona2)) {
        restricciones.set(persona2, new Set());
    }
    
    restricciones.get(persona1).add(persona2);
    restricciones.get(persona2).add(persona1);
    
    // Limpiar selección
    document.getElementById('persona1').value = '';
    document.getElementById('persona2').value = '';
    
    mostrarRestricciones();
}

function mostrarRestricciones() {
    const container = document.getElementById('restriccionesList');
    
    if (restricciones.size === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay restricciones configuradas</p>';
        return;
    }
    
    let html = '<div class="alert alert-info"><strong>Restricciones activas:</strong></div>';
    
    const restriccionesArray = [];
    restricciones.forEach((personas, persona) => {
        personas.forEach(otraPersona => {
            const restriccion = [persona, otraPersona].sort();
            const restriccionStr = restriccion.join(' ↔ ');
            if (!restriccionesArray.includes(restriccionStr)) {
                restriccionesArray.push(restriccionStr);
            }
        });
    });
    
    restriccionesArray.forEach(restriccion => {
        const [p1, p2] = restriccion.split(' ↔ ');
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <span><strong>${p1}</strong> ❌ <strong>${p2}</strong></span>
                <button class="btn btn-outline-danger btn-sm" onclick="eliminarRestriccion('${p1}', '${p2}')">
                    🗑️
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function eliminarRestriccion(persona1, persona2) {
    if (restricciones.has(persona1)) {
        restricciones.get(persona1).delete(persona2);
        if (restricciones.get(persona1).size === 0) {
            restricciones.delete(persona1);
        }
    }
    
    if (restricciones.has(persona2)) {
        restricciones.get(persona2).delete(persona1);
        if (restricciones.get(persona2).size === 0) {
            restricciones.delete(persona2);
        }
    }
    
    mostrarRestricciones();
}

function limpiarRestricciones() {
    if (confirm('¿Estás seguro de que quieres eliminar todas las restricciones?')) {
        restricciones.clear();
        mostrarRestricciones();
    }
}

// Procesar archivo de restricciones
function procesarArchivoRestricciones(contenido) {
    const lineas = contenido.split('\n').filter(linea => linea.trim() !== '');
    let restriccionesImportadas = 0;
    let errores = [];
    
    lineas.forEach((linea, index) => {
        const lineaLimpia = linea.trim();
        if (lineaLimpia === '') return;
        
        // Buscar el separador |
        const partes = lineaLimpia.split('|');
        if (partes.length !== 2) {
            errores.push(`Línea ${index + 1}: Formato incorrecto. Use "Persona1 | Persona2"`);
            return;
        }
        
        const persona1 = partes[0].trim();
        const persona2 = partes[1].trim();
        
        if (persona1 === '' || persona2 === '') {
            errores.push(`Línea ${index + 1}: Nombres de personas no pueden estar vacíos`);
            return;
        }
        
        if (persona1 === persona2) {
            errores.push(`Línea ${index + 1}: Una persona no puede tener restricción consigo misma`);
            return;
        }
        
        // Verificar si ya existe la restricción
        const restriccionExiste = Array.from(restricciones.entries()).some(([p1, conjunto]) => {
            return (p1 === persona1 && conjunto.has(persona2)) || 
                   (p1 === persona2 && conjunto.has(persona1));
        });
        
        if (!restriccionExiste) {
            // Agregar restricción bidireccional
            if (!restricciones.has(persona1)) {
                restricciones.set(persona1, new Set());
            }
            if (!restricciones.has(persona2)) {
                restricciones.set(persona2, new Set());
            }
            
            restricciones.get(persona1).add(persona2);
            restricciones.get(persona2).add(persona1);
            restriccionesImportadas++;
        }
    });
    
    // Mostrar resultado
    let mensaje = `✅ Se importaron ${restriccionesImportadas} restricciones correctamente.`;
    
    if (errores.length > 0) {
        mensaje += `\n\n⚠️ Se encontraron ${errores.length} errores:\n` + errores.join('\n');
    }
    
    alert(mensaje);
    
    // Actualizar la visualización de restricciones
    mostrarRestricciones();
    actualizarListasPersonas();
}

// Exportar restricciones actuales
function exportarRestricciones() {
    if (restricciones.size === 0) {
        alert('No hay restricciones para exportar.');
        return;
    }
    
    let contenido = '';
    const procesadas = new Set();
    
    // Generar contenido del archivo
    for (const [persona1, conjunto] of restricciones.entries()) {
        for (const persona2 of conjunto) {
            // Evitar duplicados (ya que las restricciones son bidireccionales)
            const clave = [persona1, persona2].sort().join('|');
            if (!procesadas.has(clave)) {
                contenido += `${persona1} | ${persona2}\n`;
                procesadas.add(clave);
            }
        }
    }
    
    // Crear y descargar archivo
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'restricciones_grupos.txt';
    link.click();
    
    // Limpiar
    window.URL.revokeObjectURL(link.href);
}

function armarGruposConRestricciones(personas, numGrupos, personasMinPorGrupo, restriccionesMap) {
    const personasMezcladas = [...personas].sort(() => Math.random() - 0.5);
    const grupos = Array.from({ length: numGrupos }, () => []);
    
    // Fase 1: Asegurar el mínimo por grupo
    for (const persona of personasMezcladas.slice()) {
        const personasRestringidas = restriccionesMap.get(persona) || new Set();
        let asignado = false;
        
        // Buscar un grupo que necesite personas (por debajo del mínimo)
        for (let i = 0; i < numGrupos && !asignado; i++) {
            const grupo = grupos[i];
            
            // Solo asignar si el grupo aún no tiene el mínimo
            if (grupo.length >= personasMinPorGrupo) continue;
            
            const hayConflicto = grupo.some(miembro => personasRestringidas.has(miembro));
            
            if (!hayConflicto) {
                grupo.push(persona);
                asignado = true;
                // Remover de la lista para la siguiente fase
                const index = personasMezcladas.indexOf(persona);
                if (index > -1) personasMezcladas.splice(index, 1);
            }
        }
    }
    
    // Fase 2: Distribuir personas restantes equitativamente
    for (const persona of personasMezcladas) {
        const personasRestringidas = restriccionesMap.get(persona) || new Set();
        let asignado = false;
        
        // Ordenar grupos por cantidad de personas (menos personas primero)
        const gruposOrdenados = grupos
            .map((grupo, index) => ({ grupo, index, size: grupo.length }))
            .sort((a, b) => a.size - b.size);
        
        // Intentar asignar al grupo con menos personas que no tenga conflictos
        for (const { grupo, index } of gruposOrdenados) {
            const hayConflicto = grupo.some(miembro => personasRestringidas.has(miembro));
            
            if (!hayConflicto) {
                grupo.push(persona);
                asignado = true;
                break;
            }
        }
        
        // Si no se pudo asignar por restricciones, forzar en el grupo menos poblado
        if (!asignado) {
            const grupoMenosPoblado = grupos.reduce((min, grupo, index) => 
                grupo.length < grupos[min].length ? index : min, 0
            );
            grupos[grupoMenosPoblado].push(persona);
            console.warn(`⚠️ ${persona} fue asignado/a al Grupo ${grupoMenosPoblado + 1} ignorando restricciones por falta de opciones.`);
        }
    }
    
    return grupos;
}
