# 🚀 SocialBeats API Gateway

Una **API Gateway** avanzada desarrollada en **Express.js** que actúa como punto de entrada único para la arquitectura de microservicios de SocialBeats. Implementa patrones de resiliencia, autenticación centralizada, rate limiting dinámico y agregación de datos.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Tabla de Contenidos

- [🎯 Características Principales](#-características-principales)
- [🏗️ Arquitectura](#️-arquitectura)
- [🛠️ Tecnologías](#️-tecnologías)
- [⚡ Inicio Rápido](#-inicio-rápido)
- [🔧 Configuración](#-configuración)
- [🚀 Tutoriales de Instalación](#-tutoriales-de-instalación)
- [📡 API Endpoints](#-api-endpoints)
- [🔐 Autenticación](#-autenticación)
- [⚡ Rate Limiting](#-rate-limiting)
- [🔄 Circuit Breaker](#-circuit-breaker)
- [📊 Monitoreo y Logs](#-monitoreo-y-logs)
- [🧪 Testing](#-testing)
- [🚀 Despliegue](#-despliegue)
- [🤝 Contribución](#-contribución)

## 🎯 Características Principales

### 🔒 **Autenticación Centralizada**

- ✅ Autenticación JWT centralizada
- ✅ Propagación automática de datos de usuario
- ✅ Validación de tokens con manejo de errores
- ✅ Headers enriquecidos para microservicios

### ⚡ **Rate Limiting Dinámico**

- ✅ Límites basados en planes de precios (Free, Basic, Premium, Enterprise)
- ✅ Storage distribuido con Redis
- ✅ Fallback a memoria local
- ✅ Headers estándar de rate limiting

### 🔄 **Resiliencia y Tolerancia a Fallos**

- ✅ Circuit Breaker pattern con Opossum
- ✅ Fallbacks automáticos
- ✅ Timeouts configurables
- ✅ Estadísticas en tiempo real

### 🌐 **Proxy y Agregación**

- ✅ Proxy transparente a microservicios
- ✅ Agregación de datos de múltiples servicios
- ✅ Peticiones paralelas optimizadas
- ✅ Manejo de errores por servicio

### 📊 **Observabilidad**

- ✅ Logging estructurado con Winston
- ✅ Métricas de rendimiento
- ✅ Health checks automáticos
- ✅ Trazabilidad de peticiones

## 🏗️ Arquitectura

```
┌─────────────┐    ┌─────────────────────────────────┐    ┌─────────────────┐
│   Cliente   │───▶│         API Gateway             │───▶│ Microservicios  │
│  (Web/App)  │    │                                 │    │                 │
└─────────────┘    │  ┌─────────────────────────┐   │    │ ┌─────────────┐ │
                   │  │    Middlewares          │   │    │ │   Users     │ │
                   │  │ • Helmet (Seguridad)    │   │    │ │ :3001       │ │
                   │  │ • CORS                  │   │    │ └─────────────┘ │
                   │  │ • Rate Limiter          │   │    │ ┌─────────────┐ │
                   │  │ • JWT Auth              │   │    │ │  Payments   │ │
                   │  └─────────────────────────┘   │    │ │ :3002       │ │
                   │                                 │    │ └─────────────┘ │
                   │  ┌─────────────────────────┐   │    │ ┌─────────────┐ │
                   │  │    Routing              │   │    │ │ Analytics   │ │
                   │  │ • Proxy Routes          │   │    │ │ :3003       │ │
                   │  │ • Aggregation Routes    │   │    │ └─────────────┘ │
                   │  │ • Circuit Breakers      │   │    │ ┌─────────────┐ │
                   │  └─────────────────────────┘   │    │ │Notifications│ │
                   └─────────────────────────────────┘    │ │ :3004       │ │
                                                          │ └─────────────┘ │
                   ┌─────────────┐                       └─────────────────┘
                   │    Redis    │
                   │ Rate Limit  │
                   │   Store     │
                   └─────────────┘
```

### 🔄 Flujo de una Petición

```
Cliente → Security → Rate Limit → JWT Auth → Circuit Breaker → Microservicio
   ↓                                                               ↓
Response ← Logger ← Error Handler ← Aggregator ← Response ← Microservicio
```

## 🛠️ Tecnologías

### **Backend Core**

- **Node.js 20+** - Runtime JavaScript
- **Express.js 4.18** - Framework web
- **ES Modules** - Sintaxis moderna

### **Autenticación y Seguridad**

- **jsonwebtoken** - JWT tokens
- **helmet** - Headers de seguridad
- **cors** - Políticas CORS

### **Resiliencia y Performance**

- **opossum** - Circuit breaker
- **express-rate-limit** - Rate limiting
- **redis** - Cache distribuido
- **compression** - Compresión gzip

### **Observabilidad**

- **winston** - Logging estructurado
- **axios** - Cliente HTTP

### **Development & Testing**

- **vitest** - Testing framework
- **nodemon** - Auto-reload
- **prettier** - Formateo de código
- **husky** - Git hooks

### **DevOps**

- **Docker** - Containerización
- **Docker Compose** - Orquestación local

## ⚡ Inicio Rápido

### 📋 Prerrequisitos

- **Node.js 20+** ([Descargar](https://nodejs.org/))
- **Docker** ([Descargar](https://www.docker.com/get-started))
- **Git** ([Descargar](https://git-scm.com/))

### 🚀 Instalación Express (5 minutos)

```bash
# 1. Clonar repositorio
git clone https://github.com/SocialBeats/api-gateway.git
cd api-gateway

# 2. Instalar dependencias
npm install

# 3. Configurar ambiente local
npm run env:local

# 4. Iniciar desarrollo
npm run start
```

✅ **¡Listo!** La API Gateway estará disponible en `http://localhost:3000`

## 🔧 Configuración

### 📁 Archivos de Ambiente

El proyecto incluye múltiples configuraciones de ambiente:

```bash
# Desarrollo local (sin Docker)
npm run env:local     # Copia .env.example → .env

# Docker standalone
npm run env:docker    # Copia .env.docker.example → .env

# Docker Compose (con Redis)
npm run env:compose   # Copia .env.docker-compose.example → .env
```

### ⚙️ Variables de Entorno Principales

Crea tu archivo `.env` basado en `.env.example`:

```env
# 🚀 Servidor
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# 🔐 Seguridad
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# 🗄️ Redis (Rate Limiting)
REDIS_URL=redis://localhost:6379

# 🌐 Microservicios
USERS_SERVICE_URL=http://localhost:3001
PAYMENTS_SERVICE_URL=http://localhost:3002
ANALYTICS_SERVICE_URL=http://localhost:3003
NOTIFICATIONS_SERVICE_URL=http://localhost:3004
```

## 🚀 Tutoriales de Instalación

### 🖥️ **Opción 1: Desarrollo Local**

**Ideal para**: Desarrollo activo, debugging, testing

```bash
# 1. Prerrequisitos
node --version    # Debe ser 20+
npm --version     # Debe ser 9+

# 2. Instalar proyecto
git clone https://github.com/SocialBeats/api-gateway.git
cd api-gateway
npm install

# 3. Configurar ambiente
npm run env:local
# Esto copia .env.example a .env

# 4. Configurar Redis (Opcional)
# Instalar Redis localmente o usar Docker:
docker run -d -p 6379:6379 --name redis redis:7-alpine

# 5. Configurar microservicios (Mock)
# Para desarrollo, puedes usar servicios mock en otros puertos
# O configurar las URLs en .env apuntando a servicios reales

# 6. Iniciar desarrollo
npm run start
# O con auto-reload:
npm run dev:local

# 7. Verificar funcionamiento
curl http://localhost:3000/health
```

### 🐳 **Opción 2: Docker Compose (Recomendado)**

**Ideal para**: Entorno completo, testing de integración, demos

```bash
# 1. Verificar Docker
docker --version
docker-compose --version

# 2. Clonar y configurar
git clone https://github.com/SocialBeats/api-gateway.git
cd api-gateway

# 3. Configurar para Docker Compose
npm run env:compose

# 4. Iniciar stack completo
npm run dev:compose
# Esto ejecuta: docker-compose up --build

# 5. Verificar servicios
docker-compose ps
curl http://localhost:3000/health
```

**Servicios incluidos:**

- ✅ API Gateway: `localhost:3000`
- ✅ Redis: `localhost:6379`
- ✅ Health checks automáticos
- ✅ Restart policies
- ✅ Volúmenes persistentes

### 🐳 **Opción 3: Docker Standalone**

**Ideal para**: Despliegue simple, testing rápido

```bash
# 1. Configurar ambiente Docker
npm run env:docker

# 2. Construir imagen
npm run docker:build

# 3. Ejecutar contenedor
npm run docker:run

# 4. Verificar
curl http://localhost:3000/health
```

### 🔧 **Configuración de Microservicios**

Para un entorno completo, necesitas configurar los microservicios:

```bash
# Estructura recomendada de proyecto
SocialBeats/
├── api-gateway/          # Este proyecto
├── users-service/        # Puerto 3001
├── payments-service/     # Puerto 3002
├── analytics-service/    # Puerto 3003
└── notifications-service/ # Puerto 3004
```

**Servicios Mock para Testing:**

```javascript
// mock-services.js - Servicios de prueba rápidos
const express = require('express');

// Users Service Mock (Puerto 3001)
const usersApp = express();
usersApp.get('/api/v1/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Mock User', email: 'user@example.com' });
});
usersApp.listen(3001, () => console.log('Users service mock on :3001'));

// Payments Service Mock (Puerto 3002)
const paymentsApp = express();
paymentsApp.get('/api/v1/payments/users/:id/recent', (req, res) => {
  res.json([{ id: 1, amount: 99.99, status: 'completed' }]);
});
paymentsApp.listen(3002, () => console.log('Payments service mock on :3002'));

// Analytics Service Mock (Puerto 3003)
const analyticsApp = express();
analyticsApp.get('/api/v1/analytics/users/:id/stats', (req, res) => {
  res.json({ views: 1234, clicks: 567, conversions: 89 });
});
analyticsApp.listen(3003, () => console.log('Analytics service mock on :3003'));

// Notifications Service Mock (Puerto 3004)
const notificationsApp = express();
notificationsApp.get('/api/v1/notifications', (req, res) => {
  res.json([{ id: 1, message: 'Welcome!', read: false }]);
});
notificationsApp.listen(3004, () => console.log('Notifications service mock on :3004'));
```

## 📡 API Endpoints

### 🏥 **Health Check**

```http
GET /health
```

**Respuesta:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "uptime": 3600.25,
  "environment": "development"
}
```

### 🌐 **Proxy Endpoints**

Todos los endpoints bajo `/api/v1/*` requieren autenticación JWT:

```http
# Usuarios
GET    /api/v1/users/{id}
POST   /api/v1/users
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}

# Pagos
GET    /api/v1/payments/users/{id}
POST   /api/v1/payments
GET    /api/v1/payments/{id}

# Analytics
GET    /api/v1/analytics/users/{id}/stats
POST   /api/v1/analytics/events

# Notificaciones
GET    /api/v1/notifications
POST   /api/v1/notifications
PUT    /api/v1/notifications/{id}/read
```

### 🔗 **Aggregation Endpoints**

#### **Dashboard Completo**

```http
GET /api/v1/dashboard
Authorization: Bearer {jwt_token}
```

**Respuesta:**

```json
{
  "profile": { "id": 123, "name": "Usuario", "email": "user@example.com" },
  "payments": [{ "id": 1, "amount": 99.99, "status": "completed" }],
  "analytics": { "views": 1234, "clicks": 567, "conversions": 89 },
  "metadata": {
    "aggregationTime": "245ms",
    "timestamp": "2025-11-18T10:30:00.000Z"
  }
}
```

#### **Estadísticas Circuit Breaker** (Admin)

```http
GET /api/v1/circuit-breaker-stats
Authorization: Bearer {admin_jwt_token}
```

## 🔐 Autenticación

### 🎫 **JWT Token Format**

```javascript
// Payload del JWT
{
  "userId": "user123",
  "email": "user@example.com",
  "role": "user",           // user | admin
  "pricingPlan": "premium", // free | basic | premium | enterprise
  "iat": 1700304600,
  "exp": 1700391000
}
```

### 📝 **Ejemplo de Uso**

```bash
# 1. Generar token (en tu servicio de auth)
curl -X POST http://auth-service/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# 2. Usar token en peticiones
curl -X GET http://localhost:3000/api/v1/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 🔧 **Headers Automáticos**

El gateway automáticamente agrega estos headers a las peticiones a microservicios:

```http
x-user-id: user123
x-user-email: user@example.com
x-user-role: user
x-pricing-plan: premium
x-gateway-authenticated: true
```

## ⚡ Rate Limiting

### 📊 **Límites por Plan**

| Plan           | Límite       | Precio    |
| -------------- | ------------ | --------- |
| **Free**       | 10 req/min   | Gratis    |
| **Basic**      | 50 req/min   | $9/mes    |
| **Premium**    | 200 req/min  | $29/mes   |
| **Enterprise** | 1000 req/min | Contactar |

### 📈 **Headers de Rate Limiting**

```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 150
X-RateLimit-Reset: 1700304660
Retry-After: 60
```

### 🚫 **Respuesta al Exceder Límite**

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded for premium plan",
  "currentPlan": "premium",
  "upgradeInfo": "Upgrade your plan for higher limits",
  "retryAfter": "60"
}
```

## 🔄 Circuit Breaker

### 📊 **Configuración por Defecto**

```javascript
{
  timeout: 5000,                    // 5s timeout
  errorThresholdPercentage: 50,     // 50% fallos = abrir
  resetTimeout: 30000,              // Reintentar cada 30s
  volumeThreshold: 5                // Mínimo 5 peticiones
}
```

### 🚦 **Estados del Circuit Breaker**

#### 🟢 **CLOSED (Normal)**

- ✅ Todas las peticiones pasan
- ✅ Estadísticas normales
- ✅ Respuesta directa del servicio

#### 🟡 **HALF-OPEN (Probando)**

- ⚠️ Permitiendo peticiones limitadas
- ⚠️ Evaluando si el servicio se recuperó
- ⚠️ Puede abrir o cerrar según resultado

#### 🔴 **OPEN (Fallback)**

- ❌ Bloqueando peticiones al servicio
- ❌ Respondiendo con fallback
- ❌ Esperando timeout para reintentar

### 📋 **Respuesta Fallback**

```json
{
  "error": "Service temporarily unavailable",
  "service": "users",
  "fallback": true,
  "message": "Please try again later"
}
```

## 📊 Monitoreo y Logs

### 📝 **Niveles de Log**

```bash
# Configurar nivel en .env
LOG_LEVEL=debug   # debug, info, warn, error
```

#### **Tipos de Logs:**

```bash
# 🔵 INFO - Información general
2025-11-18 10:30:00 [INFO]: 🚀 API Gateway running on port 3000
2025-11-18 10:30:01 [INFO]: ✅ Proxy routes configured

# 🟡 WARN - Advertencias
2025-11-18 10:30:15 [WARN]: Authentication failed: No token provided for /api/v1/users
2025-11-18 10:30:20 [WARN]: 🟡 Circuit breaker HALF-OPEN for payments

# 🔴 ERROR - Errores críticos
2025-11-18 10:30:25 [ERROR]: 🔴 Circuit breaker OPENED for analytics
2025-11-18 10:30:30 [ERROR]: Redis error: Connection refused

# 🟢 DEBUG - Información detallada
2025-11-18 10:30:35 [DEBUG]: User authenticated: user123 (premium)
2025-11-18 10:30:40 [DEBUG]: Proxying to Users Service: GET /api/v1/users/123
```

### 📊 **Métricas de Monitoreo**

```javascript
// Endpoint de estadísticas (Admin only)
GET /api/v1/circuit-breaker-stats

// Respuesta
{
  "circuitBreakers": {
    "users": {
      "state": "closed",
      "stats": {
        "successful": 150,
        "failed": 2,
        "timeout": 0,
        "total": 152
      }
    },
    "payments": {
      "state": "half-open",
      "stats": {
        "successful": 80,
        "failed": 45,
        "timeout": 5,
        "total": 130
      }
    }
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

## 🧪 Testing

### 🏃‍♂️ **Comandos de Testing**

```bash
# Tests unitarios
npm test

# Tests con watch mode
npm run test:watch

# Cobertura de código
npm run test:coverage

# Tests de integración (requiere Docker)
npm run test:integration

# Health check
npm run test:health

# Test de conectividad
npm run test:connectivity
```

### 📊 **Estructura de Tests**

```
tests/
├── unit/
│   ├── middleware/
│   │   ├── authentication.test.js
│   │   ├── rateLimiter.test.js
│   │   └── circuitBreaker.test.js
│   └── utils/
│       └── errorHandler.test.js
├── integration/
│   ├── proxy.test.js
│   ├── aggregation.test.js
│   └── end-to-end.test.js
└── fixtures/
    ├── tokens.js
    └── responses.js
```

### 🧪 **Ejemplo de Test**

```javascript
// tests/integration/dashboard.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { generateToken } from '../../src/middleware/authentication.js';

describe('Dashboard Aggregation', () => {
  it('should aggregate user dashboard data', async () => {
    const token = generateToken({
      userId: 'test123',
      email: 'test@example.com',
      role: 'user',
      pricingPlan: 'premium',
    });

    const response = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('profile');
    expect(response.body).toHaveProperty('payments');
    expect(response.body).toHaveProperty('analytics');
    expect(response.body.metadata).toHaveProperty('aggregationTime');
  });
});
```

## 🚀 Despliegue

### 🐳 **Docker Production**

```bash
# 1. Construir imagen optimizada
docker build -t socialbeats/api-gateway:latest .

# 2. Ejecutar en producción
docker run -d \
  --name api-gateway-prod \
  -p 80:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  socialbeats/api-gateway:latest

# 3. Verificar logs
docker logs api-gateway-prod -f
```

### ☁️ **Cloud Deployment**

#### **Variables de Entorno Producción**

```env
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
PORT=3000

# Secrets (usar secretos del proveedor)
JWT_SECRET=${JWT_SECRET_FROM_SECRETS}
REDIS_URL=${REDIS_CLOUD_URL}

# Servicios internos
USERS_SERVICE_URL=http://users-service:3001
PAYMENTS_SERVICE_URL=http://payments-service:3002
ANALYTICS_SERVICE_URL=http://analytics-service:3003
NOTIFICATIONS_SERVICE_URL=http://notifications-service:3004
```

#### **Health Checks**

```yaml
# docker-compose.prod.yml
healthcheck:
  test:
    [
      'CMD',
      'node',
      '-e',
      "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})",
    ]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 📋 **Checklist de Producción**

- [ ] **Seguridad**
  - [ ] JWT_SECRET seguro y único
  - [ ] CORS configurado correctamente
  - [ ] Rate limits apropiados
  - [ ] Headers de seguridad habilitados

- [ ] **Performance**
  - [ ] Redis configurado y optimizado
  - [ ] Compresión habilitada
  - [ ] Timeouts apropiados
  - [ ] Circuit breakers configurados

- [ ] **Monitoreo**
  - [ ] Logs centralizados
  - [ ] Métricas de APM
  - [ ] Alertas configuradas
  - [ ] Health checks funcionando

- [ ] **Infraestructura**
  - [ ] Auto-scaling configurado
  - [ ] Load balancer configurado
  - [ ] Backup de Redis
  - [ ] Rollback strategy definida

## 📚 **Scripts NPM Disponibles**

```bash
# 🚀 Desarrollo
npm run start              # Iniciar con nodemon
npm run dev:local         # Ambiente local completo
npm run dev:compose       # Docker Compose + Redis
npm run dev:docker        # Docker standalone

# 🔧 Configuración
npm run env:local         # Configurar .env local
npm run env:docker        # Configurar .env Docker
npm run env:compose       # Configurar .env Compose

# 🐳 Docker
npm run docker:build      # Construir imagen
npm run docker:run        # Ejecutar contenedor

# 🧪 Testing
npm test                  # Tests unitarios
npm run test:watch        # Tests con watch
npm run test:coverage     # Cobertura de código
npm run test:integration  # Tests de integración
npm run test:health       # Health check
npm run test:connectivity # Test de conectividad

# 🎨 Code Quality
npm run lint              # Verificar formato
npm run lint:fix          # Corregir formato automáticamente

# 🔄 Git Hooks
npm run prepare           # Configurar Husky
```

## 🔧 **Troubleshooting**

### ❌ **Problemas Comunes**

#### **Redis Connection Failed**

```bash
# Error
❌ Redis error: Connection refused

# Solución
# 1. Verificar Redis corriendo
docker ps | grep redis

# 2. Iniciar Redis si no está corriendo
docker run -d -p 6379:6379 --name redis redis:7-alpine

# 3. Verificar conectividad
redis-cli ping
```

#### **JWT Secret Not Set**

```bash
# Error
Authentication failed: JWT secret not configured

# Solución
# Agregar JWT_SECRET a .env
echo "JWT_SECRET=your-super-secret-key-here" >> .env
```

#### **Microservice Timeout**

```bash
# Error
🔴 Circuit breaker OPENED for users

# Diagnóstico
curl http://localhost:3001/health

# Solución
# Verificar que el microservicio esté corriendo en el puerto correcto
```

#### **Rate Limit Issues**

```bash
# Error
Rate limit exceeded for free plan

# Solución
# Verificar plan en JWT token o usar token con plan superior
# O esperar que se reinicie la ventana de rate limiting
```

### 🛠️ **Debug Mode**

```bash
# Activar logs detallados
export LOG_LEVEL=debug
npm start

# Ver todos los logs
tail -f logs/app.log
```

## 🤝 Contribución

### 📋 **Guía de Contribución**

1. **Fork** el repositorio
2. **Clone** tu fork localmente
3. **Crea** una rama para tu feature: `git checkout -b feature/amazing-feature`
4. **Commit** tus cambios: `git commit -m 'feat: add amazing feature'`
5. **Push** a tu rama: `git push origin feature/amazing-feature`
6. **Crea** un Pull Request

### 📝 **Convenciones**

#### **Commit Messages** (Conventional Commits)

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, no afecta lógica
refactor: refactoring de código
test: agregar o corregir tests
chore: tareas de mantenimiento
```

#### **Code Style**

```bash
# Verificar formato
npm run lint

# Corregir automáticamente
npm run lint:fix
```

### 🧪 **Testing Requirements**

- ✅ Todos los tests deben pasar
- ✅ Cobertura mínima del 80%
- ✅ Tests de integración incluidos
- ✅ Documentación actualizada

## 📄 Licencia

Este proyecto está licenciado bajo la **MIT License** - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙋‍♂️ Soporte

### 📧 **Contacto**

- **Author**: danvelcam
- **Email**: [tu-email@socialbeats.com]
- **GitHub**: [@danvelcam]

### 📚 **Recursos Adicionales**

- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Documentation](https://docs.docker.com/)
- [Opossum Circuit Breaker](https://nodeshift.dev/opossum/)

### 🐛 **Reportar Issues**

Si encuentras algún problema, por favor [abre un issue](https://github.com/SocialBeats/api-gateway/issues) con:

- Descripción detallada del problema
- Pasos para reproducir
- Logs relevantes
- Ambiente (OS, Node.js version, etc.)

---

<div align="center">

**⭐ Si este proyecto te ha sido útil, considera darle una estrella ⭐**

**🚀 SocialBeats API Gateway - Construido con ❤️ y mucho ☕**

</div>
