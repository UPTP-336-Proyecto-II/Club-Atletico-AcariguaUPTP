# 📋 Guía de Implementación de la Base de Datos

---

## 🔄 Cómo Actualizar el Proyecto (PARA TODOS)

Si tus compañeros han subido cambios y necesitas tener la versión más reciente en tu computadora, sigue estos pasos **antes** de arrancar el sistema:

1. **Abrir la terminal** en la carpeta raíz del proyecto.
2. Escribir el siguiente comando y presionar Enter:
   ```bash
   git pull
   ```
3. (Opcional) Si ves que hubo cambios grandes en el backend, es bueno reconstruir los módulos (solo si falla algo):
   ```bash
   npm install
   cd backend
   npm install
   cd ..
   ```

---

## ✅ Pasos Completados

### 1. **Instalación de Dependencias** ✓
   - Se instalaron correctamente todos los módulos necesarios:
     - cors, express, jsonwebtoken, bcryptjs, mysql2, multer

### 2. **Creación de Archivos SQL** ✓
   - **`backend/database/import_cada_sql.sql`** - Schema completo de la base de datos
   - Base de datos: `cada_db`
   - 28 tablas creadas
   - Datos iniciales cargados

### 3. **Importación de Base de Datos** ✓
   - Script: `backend/database/import_database.js`
   - Ejecutado correctamente
   - Base de datos `cada_db` creada

### 4. **Inicialización del Backend** ✓
   - Servidor en puerto 3000
   - Conexión MySQL establecida
   - CORS configurado

---

## 👥 Credenciales de Usuarios Predefinidos

| Email | Password | Rol |
|-------|----------|-----|
| directivo@gmail.com | 12345678 | super_user |
| admin@gmail.com | 12345678 | administrador |
| entrenador@gmail.com | 12345678 | entrenador |
| medico@gmail.com | 12345678 | medico |
| test@gmail.com | 12345678 | super_user |

---

## 📊 Estructura de la Base de Datos

### Tablas Principales:
- **usuarios** - Gestión de usuarios y autenticación
- **personal** - Personal del club
- **atletas** - Información de atletas
- **categoria** - Categorías de juego
- **asistencias** - Control de asistencias
- **medidas_antropometricas** - Mediciones de atletas
- **ficha_medica** - Fichas médicas
- **actividades** - Actividades programadas
- **posicion_juego** - Posiciones en el campo
- **rol_usuarios** - Roles del sistema
- Y más...

---

## 🚀 Cómo Ejecutar el Sistema

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
El servidor estará disponible en: `http://localhost:3000`

### Terminal 2 - Frontend:
```bash
npm run dev
```
La aplicación estará disponible en: `http://localhost:9527`

---

## 🔄 Reimportar la Base de Datos (si es necesario)

Si necesitas reiniciar la base de datos en el futuro, ejecuta:
```bash
cd backend/database
node import_database.js
```

---

## ⚠️ Notas Importantes

1. **XAMPP/MySQL**: Asegúrate de que MySQL esté en ejecución
2. **Puertos**: 
   - Backend: 3000
   - Frontend: 9527
3. **Contraseña MySQL**: Si has establecido una contraseña, edita `backend/config/database.js`
4. **Base de datos**: El sistema automaticamente crea `cada_db` cuando importas

---

## 📝 Variables de Configuración

### Archivo: `backend/config/database.js`
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Editar si tienes contraseña
  database: 'cada_db',
  // ... más configuración
};
```

---

## ✨ ¡Sistema Listo para Usar!

Tu aplicación "Club Atlético Deportivo Acarigua" está completamente configurada y lista para funcionamiento.

Los datos iniciales incluyen:
- 28 tablas de base de datos
- 5 usuarios de prueba
- Estructura completa de roles
- Preguntas de seguridad
- Datos geográficos (estados, municipios, parroquias)

Puedes iniciar la aplicación con los comandos mencionados arriba.
