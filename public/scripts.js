async function getSensores() {
    try {
        const response = await fetch('/sensores');
        const data = await response.json();
        //console.log(data);
        return data;
    } catch (e) {
        console.error('Erro ao obter os dados: ', e);
    }
}

async function getAtuadores() {
    try {
        const response = await fetch('/atuadores');
        const data = await response.json();
        //console.log(data);
        return data;
    } catch (e) {
        console.error('Erro ao obter os dados: ', e);
    }
}

//btn-status
const btnStatus = document.querySelectorAll('.btn-status');

// Temperatura
const marcadorTemperatura = document.getElementById('marcadorTemperatura');
const alertaTemperatura = document.getElementById('alerta-temperatura');

//Umidade do ar
const marcadorUmidade = document.getElementById('marcadorUmidadeAr');
const alertaUmidadeAr = document.getElementById('alerta-umidade-ar');

//Umidade do solo
const marcadorUmidadeSolo = document.getElementById('marcadorUmidadeSolo');
const alertaUmidadeSolo = document.getElementById('alerta-umidade-solo');

//data e hora navbar
setInterval(() => {
    const date = new Date();
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    const segundos = String(date.getSeconds()).padStart(2, '0');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const horaFormatada = `${horas}:${minutos}:${segundos}`;
    document.querySelector('.data').innerHTML = dataFormatada;
    document.querySelector('.hora').innerHTML = horaFormatada; 
}, 1000);

function updateSensor(tipoSensor, valor) {
    if(tipoSensor == 'temperatura') {
        marcadorTemperatura.style.color = valor > 30 ? '#FF3131' : '#004AAD';
        marcadorTemperatura.textContent = valor + ' °C';
    }

    if(tipoSensor == 'umidadeAr') {
        if(valor >= 70 && valor <90) {
            marcadorUmidade.style.color = '#004AAD';
        } else {
            marcadorUmidade.style.color = '#FF3131';
        }
        marcadorUmidade.textContent = valor + '%';
    }

    if(tipoSensor == 'umidadeSolo') {
        if(valor >= 30 && valor <= 70) {
            marcadorUmidadeSolo.style.color = '#004AAD';
        } else {
            marcadorUmidade.style.color = '#FF3131';
        }
        marcadorUmidadeSolo.textContent = valor + '%';
    }
}

function formataAlerta(texto) {
    if(texto.includes('ALERTA:')) {
        texto = texto.replace('ALERTA:', '<span class="text-danger font-weight-bold">ALERTA: </span>');
    }

    if(texto.toLowerCase().includes('normal')) {
        const posicaoTextoNormal = texto.toLowerCase().indexOf('normal');
        const textoSlice = texto.slice(0, (posicaoTextoNormal + 6));
        texto = texto.replace(textoSlice, `<span class="text-primary font-weight-bold">${textoSlice.toUpperCase()}</span>`);
    }
    
    return texto;
}

function obterDados() {
    let dadosSensores;
    getSensores().then(data => {
        dadosSensores = data;
        updateSensor('temperatura', dadosSensores[0].umidade);
        updateSensor('umidadeAr', Math.floor((dadosSensores[0].temperatura - 1) * 100));
        updateSensor('umidadeSolo', dadosSensores[0].umidadeSolo + 60 + Math.floor(Math.random()*10));
        let alertas = gerarAlertas(dadosSensores[0].umidade, Math.floor((dadosSensores[0].temperatura - 1) * 100), dadosSensores[0].umidadeSolo + 60);
        alertaTemperatura.innerHTML = formataAlerta(alertas[0]);
        alertaUmidadeAr.innerHTML = formataAlerta(alertas[1]);
        alertaUmidadeSolo.innerHTML = formataAlerta(alertas[2]);
    }).catch(error => {
        console.error('Erro ao obter dados: ', error);
    });
}

let sensores = setInterval(() => {
    let dadosSensores;
    getSensores().then(data => {
        dadosSensores = data;
        updateSensor('temperatura', dadosSensores[0].umidade);
        updateSensor('umidadeAr', Math.floor((dadosSensores[0].temperatura - 1) * 100));
        updateSensor('umidadeSolo', dadosSensores[0].umidadeSolo + 60 + Math.floor(Math.random()*10));
        let alertas = gerarAlertas(dadosSensores[0].umidade, Math.floor((dadosSensores[0].temperatura - 1) * 100), dadosSensores[0].umidadeSolo + 60);
        console.log(alertas)
        alertaTemperatura.innerHTML = formataAlerta(alertas[0]);
        alertaUmidadeAr.innerHTML = formataAlerta(alertas[1]);
        alertaUmidadeSolo.innerHTML = formataAlerta(alertas[2]);
        console.log();
    }).catch(error => {
        console.error('Erro ao obter dados: ', error);
    });
}, 5000);

/*function updateAtuadores(dados) {
    dados.forEach((atuador) => {
        let divAtuador = document.createElement('div');
        divAtuador.className = 'div-status d-flex flex-column pr-4 pl-3 pt-4';
        divAtuador.innerHTML = `
                <div class="d-flex">
                    <p class="mr-auto">ID:</p>
                    <small class="text-status"><strong>${atuador.id}</strong></small>
                </div>
                <div class="d-flex">
                    <p class="mr-auto">NOME:</p>
                    <small class="text-status"><strong>${atuador.nome}</strong></small>
                </div>
                <div class="d-flex">
                    <p class="mr-auto">STATUS:</p>
                    <button class="btn bg-transparent">
                        <i class="bi bi-toggle-off  btn-status" style="font-size: 26px; color: #6b0000;"></i>
                    </button>
                </div>`;

        document.getElementById('gerenciamento').append(divAtuador);
    })
}*/


//Botão Status
btnStatus.forEach(elemento => {
    elemento.addEventListener('click', () => {
        if (elemento.classList.contains('bi-toggle-off')) {
            elemento.classList.remove('bi-toggle-off');
            elemento.classList.add('bi-toggle-on');
            elemento.style.color = '#007c32';
            console.log('Ligado');
            sensores = setInterval(obterDados, 5000);
        } else if (elemento.classList.contains('bi-toggle-on')) {
            elemento.classList.remove('bi-toggle-on');
            elemento.classList.add('bi-toggle-off');
            elemento.style.color = '#6b0000';
            console.log('Desligado');
            marcadorTemperatura.innerHTML = '--';
            marcadorTemperatura.style.color = 'black';
            marcadorUmidade.innerHTML = '--';
            marcadorUmidade.style.color = 'black';
            marcadorUmidadeSolo.innerHTML = '--';
            marcadorUmidadeSolo.style.color = 'black';
            alertaTemperatura.innerHTML = '';
            alertaUmidadeAr.innerHTML = '';
            alertaUmidadeSolo.innerHTML = '';
            clearInterval(sensores);
        }
    })
})


function gerarAlertas(temperatura, umidadeAr, umidadeSolo) {
    const mensagens = []; // Array para armazenar as mensagens de alerta

    // Lógica de alerta para temperatura (ajustada para a floresta amazônica)
    if (temperatura <= 30) {
        mensagens.push("Temperatura normal. Tudo em ordem.");
    } else if (temperatura > 30 && temperatura <= 40) {
        mensagens.push("ALERTA: Atenção! Temperatura elevada, tenha cuidado.");
    } else if (temperatura > 40 && temperatura <= 60) {
        mensagens.push("ALERTA: Possível início de queimadas! Aja com cautela.");
    } else if (temperatura > 60) {
        mensagens.push("ALERTA: Queimada começou! Aja imediatamente!");
    }

    // Lógica de alerta para umidade do ar (ajustada para a floresta amazônica)
    if (umidadeAr < 50) {
        mensagens.push("ALERTA: Umidade do ar muito baixa! Risco de desidratação.");
    } else if (umidadeAr >= 50 && umidadeAr < 70) {
        mensagens.push("ALERTA: Umidade do ar baixa! Verifique as plantas.");
    } else if (umidadeAr >= 70 && umidadeAr < 90) {
        mensagens.push("Umidade do ar normal. Tudo em ordem.");
    } else if (umidadeAr >= 90 && umidadeAr < 100) {
        mensagens.push("ALERTA: Umidade do ar alta! Cuidado com possíveis doenças nas plantas.");
    } else if (umidadeAr >= 100) {
        mensagens.push("ALERTA: Umidade do ar muito alta! Risco de mofo.");
    }

    // Lógica de alerta para umidade do solo (ajustada para a floresta amazônica)
    if (umidadeSolo < 30) {
        mensagens.push("ALERTA: Solo muito seco! Risco de morte das plantas.");
    } else if (umidadeSolo >= 30 && umidadeSolo <= 70) {
        mensagens.push("Estado Normal: Umidade do solo adequada.");
    } else if (umidadeSolo > 70) {
        mensagens.push("ALERTA: Solo muito úmido! Risco de alagamento.");
    }

    return mensagens; // Retorna as mensagens de alerta geradas
}
