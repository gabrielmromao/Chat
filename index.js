const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const usuarios = [{ nome: 'Admin', nickname: 'admin', senha: '123456' }];
const mensagens = [];

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'chave-secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 } // 30 minutos
}));

// Middleware para restringir acesso a páginas
function verificarLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    next();
}

function verificarAdmin(req, res, next) {
    if (!req.session.usuario || req.session.usuario.nickname !== 'admin') {
        return res.send('<h1>Acesso restrito</h1><a href="/">Voltar ao Login</a>');
    }
    next();
}

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    const user = usuarios.find(u => u.nickname === usuario && u.senha === senha);

    if (user) {
        req.session.usuario = user;
        return res.redirect('/menu');
    }
    res.send('<h1>Login inválido</h1><a href="/">Voltar ao Login</a>');
});

app.get('/menu', verificarLogin, (req, res) => {
    res.send(`
        <link rel="stylesheet" href="./style.css">
        <h1>Menu Principal</h1>
        <p>Bem-vindo, ${req.session.usuario.nome}!</p>
        <a href="/batepapo.html">Bate-papo</a>
        ${req.session.usuario.nickname === 'admin' ? '<a href="/cadastroUsuario.html">Cadastro de Usuários</a>' : ''}
        <form action="/logout" method="post"><button type="submit">Logout</button></form>
    `);
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/cadastroUsuario.html', verificarAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/cadastroUsuario.html'));
});

app.post('/cadastrarUsuario', verificarAdmin, (req, res) => {
    const { nome, nickname } = req.body;

    if (usuarios.some(u => u.nickname === nickname)) {
        return res.send('<h1>Usuário já existe</h1><a href="/cadastroUsuario.html">Voltar</a>');
    }

    usuarios.push({ nome, nickname, senha: '123456' }); // Senha padrão
    res.redirect('/menu');
});

app.get('/batepapo.html', verificarLogin, (req, res) => {
    const mensagensList = mensagens.map(m => `<li><strong>${m.usuario}</strong>: ${m.mensagem} (${m.data})</li>`).join('');
    const usuariosOptions = usuarios.map(u => `<option value="${u.nickname}">${u.nome}</option>`).join('');

    res.send(`
        <h1>Bate-papo</h1>
        <form action="/postarMensagem" method="post">
            <label for="usuario">Usuário:</label>
            <select id="usuario" name="usuario">${usuariosOptions}</select>
            <label for="mensagem">Mensagem:</label>
            <textarea id="mensagem" name="mensagem" required></textarea>
            <button type="submit">Enviar</button>
        </form>
        <h2>Mensagens</h2>
        <ul>${mensagensList}</ul>
        <a href="/menu">Voltar ao Menu</a>
    `);
});

app.post('/postarMensagem', verificarLogin, (req, res) => {
    const { usuario, mensagem } = req.body;
    const dataHora = new Date().toLocaleString();

    mensagens.push({ usuario, mensagem, data: dataHora });
    res.redirect('/batepapo.html');
});

app.use(express.static(path.join(__dirname, 'public')));


app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
