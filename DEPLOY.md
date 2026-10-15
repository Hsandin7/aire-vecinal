# Guía de Despliegue en Vercel - AireVecinal 🚀

Esta aplicación está completamente preparada para desplegarse en **Vercel** en menos de 2 minutos conectando el repositorio de GitHub.

---

## 1. Despliegue automático desde GitHub

1. Haz push de tus cambios a tu repositorio de GitHub:
   ```bash
   git push origin main
   ```
2. Entra en tu panel de control de [Vercel](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New..."** → **"Project"**.
4. Selecciona tu repositorio `aire-vecinal` e impórtalo.
5. Vercel detectará automáticamente la configuración gracias al archivo `vercel.json`:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. En la sección **Environment Variables**, añade:
   - `DATA_MODE`: `real` *(o `simulated` si deseas forzar el modo de simulación sin consultar APIs externas)*.
7. Haz clic en **"Deploy"**.

---

## 2. Arquitectura Serverless en Vercel

- **Frontend (SPA):** Se compila con Vite en la carpeta `dist`. Todas las rutas cliente de React Router (`/`, `/detail`, `/alerts`, `/profile`) se reescriben a `/index.html` mediante las reglas de `vercel.json`.
- **Backend (Serverless Functions en `/api`):**
  - `/api/zones`: Listado de las 24 estaciones de control del Ayuntamiento de Madrid y las 4 rutas protegidas.
  - `/api/air-quality`: Lectura y procesamiento en tiempo real del CSV municipal (`ciudadesabiertas.madrid.es`) con fallback a simulación.
  - `/api/forecast`: Predicción a 6 horas alimentada con Open-Meteo.
  - `/api/recommendations`: Evaluación del motor de riesgo y selección de la mejor ruta alternativa.
- **Sin escritura en disco:** Las funciones serverless operan de forma *stateless* con caché volátil en memoria. Las preferencias de los usuarios se almacenan exclusivamente en el navegador (`localStorage`).

---

## 3. Comprobación post-despliegue

Una vez completado el despliegue, verifica tu dominio asignado por Vercel (ej. `https://aire-vecinal.vercel.app`):
- Prueba `https://tu-app.vercel.app/api/zones` para comprobar que las funciones serverless responden en JSON.
- Comprueba que la navegación entre pestañas (Inicio, Detalle, Alertas, Perfil) funciona sin recargas.
- Pulsa **"Simular episodio"** para comprobar la demo de la estación Escuelas Aguirre y la recomendación de la ruta por el Retiro.
