require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(cors());

// Teste das variáveis de ambiente
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);


// Configuração do Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'guia_ensino',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306, 
    logging: false,
  }
);

sequelize.sync({ alter: true })
  .then(() => console.log('Tabelas sincronizadas/atualizadas!'))
  .catch(err => console.error('Erro ao sincronizar tabelas:', err));


sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    return sequelize.sync();
  })
  .then(() => console.log('Tabelas sincronizadas.'))
  .catch(err => console.error('Erro ao conectar/sincronizar:', err));

// Configuração do MySQL (opcional, se necessário)
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados MySQL:', err.message);
    return;
  }
  console.log('Conexão com o banco de dados MySQL estabelecida com sucesso.');
});

// Modelos
const GuiaEnsino = sequelize.define('guia_ensino', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome_professor: DataTypes.STRING(100),
  ano_turma: DataTypes.STRING(50),
  componente_curricular: DataTypes.STRING(100),
  mes_bimestre: DataTypes.STRING(50),
  breve_justificativa: DataTypes.TEXT,
  conteudos: DataTypes.TEXT,
  habilidades_cognitivas: DataTypes.TEXT,
  situacoes_didaticas: DataTypes.JSON,
  atividades: DataTypes.JSON,
  praticas_educativas: DataTypes.TEXT,
  espacos_educativos: DataTypes.TEXT,
  recursos_didaticos: DataTypes.TEXT,
  estrategias_avaliacao: DataTypes.TEXT,
  fonte_referencia: DataTypes.TEXT,
}, {
  timestamps: false,
  freezeTableName: true,
});

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  masp: { type: DataTypes.STRING, allowNull: true }, 
  senha: { type: DataTypes.STRING, allowNull: false },
}, {
  timestamps: false,
  freezeTableName: true,
});

// Middleware para autenticação JWT
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  jwt.verify(token, process.env.JWT_SECRET || 'segredo', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

const Professor = sequelize.define('professores', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  masp: { type: DataTypes.STRING, allowNull: true },
  senha: { type: DataTypes.STRING, allowNull: false } // Adicione este campo
}, {
  timestamps: false,
  freezeTableName: true,
});


// Rotas de autenticação
app.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, masp } = req.body; // Inclua o campo masp
    const hash = await bcrypt.hash(senha, 10);
    const user = await User.create({ nome, email, masp, senha: hash });
    res.status(201).json({ id: user.id, nome: user.nome, email: user.email, masp: user.masp });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.put('/register_adm/:id', async (req, res) => {
  try {
    const { nome, email, senha, masp } = req.body;
    const { id } = req.params; // Extraia o ID dos parâmetros da URL
    const hash = await bcrypt.hash(senha, 10);
    const user = await User.update({ nome, email, masp, senha: hash }, { where: { id } });
    if (user[0] === 1) {
      res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



app.post('/register_adm', async (req, res) => {
  try {
    const { nome, email, senha, masp } = req.body; 
    const hash = await bcrypt.hash(senha, 10);
    const user = await User.create({ nome, email, masp, senha: hash }); // Inclua masp na criação
    res.status(201).json({ id: user.id, nome: user.nome, email: user.email, masp: user.masp });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.put('/register_adm/:id', async (req, res) => {
  try {
    const { nome, email, senha, masp } = req.body;
    const { id } = req.params; 
    const hash = await bcrypt.hash(senha, 10);
    const user = await User.update({ nome, email, masp, senha: hash }, { where: { id } });
    if (user[0] === 1) {
      res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.post('/professores', async (req, res) => {
  try {
    const { nome, email, masp } = req.body;
    const professor = await Professor.create({ nome, email, masp });
    res.status(201).json(professor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/login_professor', async (req, res) => {
  const { email, senha } = req.body;
  const professor = await Professor.findOne({ where: { email } });
  if (!professor) return res.status(401).json({ error: 'Professor não encontrado' });
  const valido = await bcrypt.compare(senha, professor.senha);
  if (!valido) return res.status(401).json({ error: 'Senha inválida' });
  const token = jwt.sign(
    { id: professor.id, email: professor.email, tipo: 'professor' },
    process.env.JWT_SECRET || 'segredo',
    { expiresIn: '1h' }
  );
  res.json({ token });
});
   
// Middleware para autenticação de professores
app.get('/professores', async (req, res) => {
  const professores = await Professor.findAll();
  res.json(professores);
});

// Buscar professor por ID
app.get('/professores/:id', async (req, res) => {
  const professor = await Professor.findByPk(req.params.id);
  if (professor) res.json(professor);
  else res.status(404).json({ error: 'Professor não encontrado' });
});

// Atualizar professor
app.put('/professores/:id', async (req, res) => {
  try {
    const { nome, email, masp } = req.body;
    const { id } = req.params;
    const [updated] = await Professor.update({ nome, email, masp }, { where: { id } });
    if (updated) {
      const professor = await Professor.findByPk(id);
      res.json(professor);
    } else {
      res.status(404).json({ error: 'Professor não encontrado' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Deletar professor
app.delete('/professores/:id', async (req, res) => {
  const deleted = await Professor.destroy({ where: { id: req.params.id } });
  if (deleted) res.json({ message: 'Professor removido' });
  else res.status(404).json({ error: 'Professor não encontrado' });
});


app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  const valido = await bcrypt.compare(senha, user.senha);
  if (!valido) return res.status(401).json({ error: 'Senha inválida' });
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'segredo', { expiresIn: '1h' });
  res.json({ token });
});

app.get('/guia_ensino', async (req, res) => {
  const dados = await GuiaEnsino.findAll();
  res.json(dados);
});

app.get('/guia_ensino/:id', async (req, res) => {
  const dado = await GuiaEnsino.findByPk(req.params.id);
  if (dado) res.json(dado);
  else res.status(404).json({ error: 'Registro não encontrado' });
});

app.post('/guia_ensino', async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body); // Verifica os dados recebidos
    const novo = await GuiaEnsino.create(req.body);
    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro ao criar registro:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.put('/guia_ensino/:id', async (req, res) => {
  try {
    const [updated] = await GuiaEnsino.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const atualizado = await GuiaEnsino.findByPk(req.params.id);
      res.json(atualizado);
    } else {
      res.status(404).json({ error: 'Registro não encontrado' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/guia_ensino/:id', async (req, res) => {
  const deleted = await GuiaEnsino.destroy({ where: { id: req.params.id } });
  if (deleted) res.json({ message: 'Registro removido' });
  else res.status(404).json({ error: 'Registro não encontrado' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});