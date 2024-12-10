const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const usuarios = []; // Lista de usuários
const mensagens = []; // Lista de mensagens

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'sua-chave-secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 } // 30 minutos
}));

// Servir arquivos estáticos (como HTML e CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Rota de login
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (usuario === 'admin' && senha === '123456') {
        req.session.usuario = usuario;
        res.cookie('ultimoAcesso', new Date().toLocaleString());
        res.redirect('/menu');
    } else {
        res.send(`
            <h1>Login ou senha incorretos</h1>
            <p>Tente novamente.</p>
            <a href="/">Voltar ao login</a>
        `);
    }
});

// Rota do menu
app.get('/menu', (req, res) => {
    if (!req.session.usuario) return res.redirect('/');
    const ultimoAcesso = req.cookies.ultimoAcesso || 'Primeiro acesso';
    res.send(`
        <h1>Menu Principal</h1>
        <p>Bem-vindo, ${req.session.usuario}!</p>
        <p>Último acesso: ${ultimoAcesso}</p>
        <a href="/cadastroUsuario.html">Cadastro de Usuários</a> |
        <a href="/batepapo.html">Bate-papo</a>
        <form action="/logout" method="post"><button type="submit">Logout</button></form>
    `);
});

// Cadastro de usuários 
app.post('/cadastrarUsuario', (req, res) => {
    if (!req.session.usuario || req.session.usuario !== 'admin') {
        return res.send(`
            <h1>Acesso Restrito</h1>
            <p>Você precisa estar logado como admin para cadastrar novos usuários.</p>
            <a href="/menu">Voltar ao Menu</a>
        `);
    }

    const { nome, nascimento, nickname } = req.body;
    if (!nome || !nascimento || !nickname) {
        return res.send(`
            <h1>Erro no Cadastro</h1>
            <p>Todos os campos são obrigatórios!</p>
            <a href="/cadastroUsuario.html">Voltar ao Cadastro</a>
        `);
    }

    // Evitar duplicados
    if (usuarios.find(u => u.nickname === nickname)) {
        return res.send(`
            <h1>Erro no Cadastro</h1>
            <p>O nickname "${nickname}" já está em uso.</p>
            <a href="/cadastroUsuario.html">Voltar ao Cadastro</a>
        `);
    }

    usuarios.push({ nome, nascimento, nickname });
    res.send(`
        <h1>Usuários Cadastrados</h1>
        <ul>${usuarios.map(u => `<li>${u.nome} (${u.nickname})</li>`).join('')}</ul>
        <a href="/cadastroUsuario.html">Voltar ao Cadastro</a> |
        <a href="/menu">Menu</a>
    `);
});





// Rota do bate-papo
app.get('/batepapo.html', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/');
    }

    const usuariosOptions = usuarios.map(u => `<option value="${u.nickname}">${u.nome}</option>`).join('');
    const mensagensList = mensagens.map(m => `<li><strong>${m.usuario}</strong> (${m.data}): ${m.mensagem}</li>`).join('');

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bate-papo</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <h1>Bate-papo</h1>

            <form action="/postarMensagem" method="post">
                <label for="usuario">Usuário:</label>
                <select id="usuario" name="usuario" required>
                    ${usuariosOptions}  <!-- Aqui vai a lista de usuários -->
                </select>

                <label for="mensagem">Mensagem:</label>
                <textarea id="mensagem" name="mensagem" required></textarea>
                <button type="submit">Enviar</button>
            </form>

            <h2>Mensagens</h2>
            <ul>
                ${mensagensList}  <!-- Aqui vão as mensagens -->
            </ul>

            <a href="/menu">Voltar ao Menu</a>
        </body>
        </html>
    `);
});



app.post('/postarMensagem', (req, res) => {
    const { usuario, mensagem } = req.body;
    const dataHora = new Date().toLocaleString();

    if (!usuario || !mensagem) {
        return res.send(`
            <h1>Erro no Bate-papo</h1>
            <p>Usuário e mensagem são obrigatórios!</p>
            <a href="/batepapo.html">Voltar ao Bate-papo</a>
        `);
    }

    mensagens.push({ usuario, mensagem, data: dataHora }); // Adiciona a mensagem
    res.redirect('/batepapo.html');  // Recarrega a página de bate-papo
});




// Rota de logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Servir o arquivo de CSS
app.use('/style.css', express.static(path.join(__dirname, 'public/style.css')));

// Inicia o servidor
app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
