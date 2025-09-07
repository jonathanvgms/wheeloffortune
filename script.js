console.log('Script cargado correctamente');

// Mostrar estado inicial al cargar
document.addEventListener('DOMContentLoaded', function() {
    mostrarEstadoInicial();
});

document.getElementById('groupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const personasRaw = document.getElementById('personas').value.trim();
    let personas = personasRaw.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    const numGrupos = parseInt(document.getElementById('numGrupos').value, 10);
    const personasPorGrupo = parseInt(document.getElementById('personasPorGrupo').value, 10);

    if (personas.length === 0) {
        mostrarResultado('<div class="alert alert-danger text-center">Ingrese al menos una persona.</div>');
        mostrarBotonExportar(false);
        mostrarEstadoInicial();
        return;
    }
    if (numGrupos < 1 || personasPorGrupo < 1) {
        mostrarResultado('<div class="alert alert-danger text-center">Los valores deben ser mayores a cero.</div>');
        mostrarBotonExportar(false);
        mostrarEstadoInicial();
        return;
    }
    if (numGrupos * personasPorGrupo > personas.length) {
        mostrarResultado('<div class="alert alert-danger text-center">No hay suficientes personas para la configuración elegida.</div>');
        mostrarBotonExportar(false);
        mostrarEstadoInicial();
        return;
    }

    mostrarAnimacionIntriga(true);
    mostrarResultado('');
    mostrarBotonExportar(false);
    ocultarEstadoInicial();
    setTimeout(() => {
        let personasMezcladas = mezclarArray([...personas]);
        let grupos = [];
        let idx = 0;
        for (let i = 0; i < numGrupos; i++) {
            let grupo = [];
            for (let j = 0; j < personasPorGrupo && idx < personasMezcladas.length; j++) {
                grupo.push(personasMezcladas[idx++]);
            }
            grupos.push(grupo);
        }
        let restante = personasMezcladas.slice(idx);
        for (let i = 0; i < restante.length; i++) {
            grupos[i % grupos.length].push(restante[i]);
        }
        mostrarAnimacionIntriga(false);
        mostrarResultado(renderizarGrupos(grupos, true));
        mostrarBotonExportar(true);
        ocultarEstadoInicial();
    }, 1600 + Math.random() * 900); // 1.6 a 2.5 seg de "intriga viteh"
});

function mezclarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
