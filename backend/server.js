const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const { syncVersionMiddleware } = require('./middleware/syncVersion');
const { getSyncState } = require('./services/syncVersionService');

const { dbConfig, testConnection } = pool;

const usuariosRoutes = require('./routes/usuarios');
const atletasRoutes = require('./routes/atletas');
const asistenciasRoutes = require('./routes/asistencias');
const medicionesRoutes = require('./routes/mediciones');
const testsRoutes = require('./routes/tests');
const categoriaRoutes = require('./routes/categoria');
const fichaMedicaRoutes = require('./routes/fichaMedica');
const graficaRendimientoRoutes = require('./routes/graficaRendimiento');
const implementosRoutes = require('./routes/implementos');
const pagosRoutes = require('./routes/pagos');
const plantelRoutes = require('./routes/plantel');
const tutorRoutes = require('./routes/tutor');
const rolesRoutes = require('./routes/roles');
const preguntasSeguridadRoutes = require('./routes/preguntasSeguridad');
const posicionesRoutes = require('./routes/posiciones');

function createApp() {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:9527', 'http://localhost:9528'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
  app.use('/api', syncVersionMiddleware);

  app.get('/api/sync/version', (req, res) => {
    res.json(getSyncState());
  });

  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/atletas', atletasRoutes);
  app.use('/api/asistencias', asistenciasRoutes);
  app.use('/api/mediciones', medicionesRoutes);
  app.use('/api/tests', testsRoutes);
  app.use('/api/categoria', categoriaRoutes);
  app.use('/api/ficha-medica', fichaMedicaRoutes);
  app.use('/api/grafica-rendimiento', graficaRendimientoRoutes);
  app.use('/api/implementos', implementosRoutes);
  app.use('/api/pagos', pagosRoutes);
  app.use('/api/plantel', plantelRoutes);
  app.use('/api/tutor', tutorRoutes);
  app.use('/api/roles', rolesRoutes);
  app.use('/api/preguntas-seguridad', preguntasSeguridadRoutes);
  app.use('/api/posiciones', posicionesRoutes);

  app.get('/api', (req, res) => {
    res.json({
      message: 'API Club Atletico Deportivo Acarigua - Sistema de Gestion Deportiva',
      version: '2.0.0',
      database: dbConfig.database,
      endpoints: {
        usuarios: '/api/usuarios',
        atletas: '/api/atletas',
        asistencias: '/api/asistencias',
        mediciones: '/api/mediciones',
        tests: '/api/tests',
        categoria: '/api/categoria',
        fichaMedica: '/api/ficha-medica',
        graficaRendimiento: '/api/grafica-rendimiento',
        implementos: '/api/implementos',
        pagos: '/api/pagos',
        plantel: '/api/plantel',
        tutor: '/api/tutor',
        roles: '/api/roles',
        preguntasSeguridad: '/api/preguntas-seguridad',
        posiciones: '/api/posiciones',
        syncVersion: '/api/sync/version'
      }
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'Ruta no encontrada',
      path: req.path,
      method: req.method,
      message: `La ruta ${req.method} ${req.path} no existe`
    });
  });

  app.use((error, req, res, next) => {
    console.error('Error del servidor:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  });

  return app;
}

function logStartup(port) {
  console.log(`Servidor API corriendo en: http://localhost:${port}`);
  console.log(`Base de datos configurada: ${dbConfig.database}`);
  console.log(`Ruta principal: http://localhost:${port}/api`);
  console.log('Endpoints disponibles:');
  console.log('   - Usuarios: /api/usuarios');
  console.log('   - Atletas: /api/atletas');
  console.log('   - Asistencias: /api/asistencias');
  console.log('   - Mediciones: /api/mediciones');
  console.log('   - Tests: /api/tests');
  console.log('   - Categorias: /api/categoria');
  console.log('   - Fichas Medicas: /api/ficha-medica');
  console.log('   - Graficas de Rendimiento: /api/grafica-rendimiento');
  console.log('   - Implementos: /api/implementos');
  console.log('   - Pagos: /api/pagos');
  console.log('   - Plantel: /api/plantel');
  console.log('   - Tutores: /api/tutor');
  console.log('   - Roles: /api/roles');
  console.log('   - Preguntas Seguridad: /api/preguntas-seguridad');
  console.log('   - Posiciones: /api/posiciones');
  console.log('   - Sincronizacion: /api/sync/version');
}

function startServer(options = {}) {
  const port = Number(options.port || process.env.PORT || 3000);
  const app = createApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, async() => {
      logStartup(port);
      await testConnection();
      resolve(server);
    });

    server.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        console.error(`No se pudo iniciar el backend: el puerto ${port} ya esta en uso.`);
        console.log(`Si ya tienes una instancia activa, usa http://localhost:${port}/api`);
        console.log('Si necesitas otra instancia, inicia el backend con otro puerto.');
      } else {
        console.error('Error al iniciar el servidor:', error);
      }

      reject(error);
    });
  });
}

if (require.main === module) {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}

module.exports = {
  createApp,
  startServer
};
