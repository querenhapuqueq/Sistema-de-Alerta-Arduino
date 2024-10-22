// Importando as dependências necessárias
const express = require('express'); // Framework web para Node.js
const bodyParser = require('body-parser'); // Middleware para analisar o corpo das requisições
const cors = require('cors'); // Middleware para habilitar CORS
const sqlite3 = require('sqlite3').verbose(); // Biblioteca para manipulação de banco de dados SQLite
const path = require('path'); // Módulo para manipulação de caminhos de arquivos
const fs = require('fs'); // Módulo para manipulação de arquivos do sistema

// Inicializa o aplicativo Express
const app = express();
const PORT = 3000; // Porta onde o servidor irá escutar

//Servir arquivos estáticos como HTML, CSS e JS
app.use(express.static(path.join(__dirname, 'public')));

//Rota página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware para habilitar CORS e entender JSON
app.use(cors()); // Permite requisições de diferentes origens
app.use(bodyParser.json()); // Habilita o suporte a JSON no corpo das requisições

// Define o caminho do banco de dados SQLite
const dbDir = path.join(__dirname, 'db'); // Cria um caminho para o diretório do banco de dados
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir); // Cria o diretório se não existir
}
const dbPath = path.join(dbDir, 'banco.db'); // Define o caminho do arquivo do banco de dados

// Cria ou abre o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message); // Exibe erro caso ocorra
        return;
    }
    console.log("Banco de dados conectado com sucesso!"); // Mensagem de conexão bem-sucedida

    // Criação da tabela de sensores, caso não exista
    db.run(`CREATE TABLE IF NOT EXISTS sensores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        temperatura REAL NOT NULL, 
        umidade REAL NOT NULL,
        umidadeSolo REAL NOT NULL 
    );`, (err) => {
        if (err) {
            console.error("Erro ao criar a tabela de sensores:", err.message); // Exibe erro caso ocorra
        }
    });

    // Criação da tabela de atuadores, caso não exista
    db.run(`CREATE TABLE IF NOT EXISTS atuadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        status INTEGER NOT NULL DEFAULT 0 
    );`, // status(desligado - 0/ ligado - 1)
     (err) => {
        if (err) {
            console.error("Erro ao criar a tabela de atuadores:", err.message); // Exibe erro caso ocorra
        }
    });
});

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
    } else if (umidadeAr === 100) {
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

// Rota para cadastrar um sensor
app.post('/sensores', (req, res) => {
    const { nome, temperatura, umidade, umidadeSolo } = req.body; // Desestrutura o corpo da requisição

    // Verifica se todos os campos foram preenchidos
    if (!nome || temperatura === undefined || umidade === undefined || umidadeSolo === undefined) {
        return res.status(400).json({ error: "Todos os campos devem ser preenchidos." }); // Retorna erro 400 se faltar algum campo
    }

    // Insere os dados do sensor no banco de dados
    db.run(`INSERT INTO sensores (nome, temperatura, umidade, umidadeSolo) VALUES (?, ?, ?, ?)`,
        [nome, temperatura, umidade, umidadeSolo],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message }); // Retorna erro 500 se ocorrer erro
            }
            // Retorna os dados do sensor cadastrado com as mensagens de alerta geradas
            res.status(201).json({
                id: this.lastID,
                nome,
                temperatura,
                umidade,
                umidadeSolo,
                mensagens: gerarAlertas(temperatura, umidade, umidadeSolo)
            });
        });
});

// Rota para consultar todos os sensores
app.get('/sensores', (req, res) => {
    db.all(`SELECT * FROM sensores`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message }); // Retorna erro 500 se ocorrer erro
        }

        // Gera mensagens de alerta para cada sensor
        const resultados = rows.map(row => ({
            ...row,
            mensagens: gerarAlertas(row.temperatura, row.umidade, row.umidadeSolo)
        }));

        res.json(resultados); // Retorna todos os sensores com seus dados
    });
});

// Rota para consultar um sensor específico
app.get('/sensores/:id', (req, res) => {
    const { id } = req.params; // Obtém o ID do sensor da rota
    db.get(`SELECT * FROM sensores WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message }); // Retorna erro 500 se ocorrer erro
        }

        if (!row) {
            return res.status(404).json({ error: "Sensor não encontrado." }); // Retorna erro 404 se não encontrar o sensor
        }

        // Retorna os dados do sensor encontrado com as mensagens de alerta
        res.json({
            ...row,
            mensagens: gerarAlertas(row.temperatura, row.umidade, row.umidadeSolo)
        });
    });
});

// Rota para atualizar os dados de um sensor
app.put('/sensores/:id', (req, res) => {
    const { id } = req.params; // Obtém o ID do sensor da rota
    const { temperatura, umidade, umidadeSolo } = req.body; // Desestrutura o corpo da requisição

    // Verifica se todos os campos foram preenchidos
    if (temperatura === undefined || umidade === undefined || umidadeSolo === undefined) {
        return res.status(400).json({ error: "Todos os campos devem ser preenchidos." }); // Retorna erro 400 se faltar algum campo
    }

    // Atualiza os dados do sensor no banco de dados
    db.run(`UPDATE sensores SET temperatura = ?, umidade = ?, umidadeSolo = ? WHERE id = ?`,
        [temperatura, umidade, umidadeSolo, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message }); // Retorna erro 500 se ocorrer erro
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Sensor não encontrado." }); // Retorna erro 404 se não encontrar o sensor
            }
            // Retorna os dados atualizados do sensor com as mensagens de alerta geradas
            res.status(200).json({
                message: "Sensor atualizado com sucesso.",
                id,
                temperatura,
                umidade,
                umidadeSolo,
                mensagens: gerarAlertas(temperatura, umidade, umidadeSolo)
            });
        });
});


// Rota para cadastrar um atuador
app.post('/atuadores', (req, res) => {
    const { nome } = req.body; // Desestrutura o corpo da requisição

    // Verifica se o campo nome foi preenchido
    if (!nome) {
        return res.status(400).json({ error: "O campo nome deve ser preenchido." }); // Retorna erro 400 se faltar o campo
    }

    // Insere os dados do atuador no banco de dados
    db.run(`INSERT INTO atuadores (nome) VALUES (?)`,
        [nome],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message }); // Retorna erro 500 se ocorrer erro
            }
            res.status(201).json({ id: this.lastID, nome, status: 0 }); // Retorna o atuador cadastrado
        });
});

// Rota para consultar todos os atuadores
app.get('/atuadores', (req, res) => {
    db.all(`SELECT * FROM atuadores`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message }); // Retorna erro 500 se ocorrer erro
        }
        res.json(rows); // Retorna todos os atuadores
    });
});

// Rota para consultar um atuador específico
app.get('/atuadores/:id', (req, res) => {
    const { id } = req.params; // Obtém o ID do atuador da rota
    db.get(`SELECT * FROM atuadores WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message }); // Retorna erro 500 se ocorrer erro
        }

        if (!row) {
            return res.status(404).json({ error: "Atuador não encontrado." }); // Retorna erro 404 se não encontrar o atuador
        }

        res.json(row); // Retorna o atuador encontrado
    });
});

// Rota para atualizar o status de um atuador
app.put('/atuadores/:id', (req, res) => {
    const { id } = req.params; // Obtém o ID do atuador da rota
    const { status } = req.body; // Desestrutura o corpo da requisição

    // Verifica se o status foi fornecido
    if (status === undefined) {
        return res.status(400).json({ error: "O campo status deve ser fornecido." }); // Retorna erro 400 se faltar o campo
    }

    // Atualiza o status do atuador no banco de dados
    db.run(`UPDATE atuadores SET status = ? WHERE id = ?`,
        [status, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message }); // Retorna erro 500 se ocorrer erro
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Atuador não encontrado." }); // Retorna erro 404 se não encontrar o atuador
            }
            res.status(200).json({ message: "Atuador atualizado com sucesso." }); // Retorna sucesso na atualização
        });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`); // Mensagem de sucesso ao iniciar o servidor
});