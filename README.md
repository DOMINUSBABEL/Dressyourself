# Dress Yourself Web & Mobile (Rediseñado) 👗✨

**Dress Yourself** es una plataforma de armario virtual y asistente de estilo inteligente de alta gama. Esta versión ha sido rediseñada completamente desde cero bajo una arquitectura híbrida web y móvil (responsividad adaptativa), funcionando tanto de forma nativa desde un navegador de escritorio como empaquetado en una APK para Android mediante WebView.

---

## 💎 Características Principales

### 1. 👚 Armario Virtual con Visión Local
- **Escaneo Inteligente Local (Sin APIs de IA externas)**: Sube fotos de tus prendas y un motor de visión local de Python (`vision_engine.py` usando OpenCV y Pillow) las analizará en tiempo real:
  - **Color Dominante y Secundario**: Detección mediante clustering K-Means de color mapeado a nombres elegantes en español (ej: *Blanco Puro*, *Azul Mezclilla*, *Verde Musgo*, *Rojo Carmín*).
  - **Clasificación Geométrica**: Análisis por contornos y relación de aspecto de la prenda (*Tops*, *Bottoms*, *Footwear*, *Outerwear*, *Accessory*).
  - **Patrón Textil**: Detección de patrones (*Liso*, *Rayas*, *Cuadros*, *Estampado*) mediante desviación estándar de gradientes Sobel.
  - **Porcentaje de Confianza**: Cálculo basado en la validez del contorno detectado.

### 2. ☀️ Asistente de Imagen y Clima
- Selecciona tu ciudad o simula el clima (temperatura, lluvia, viento).
- El recomendador inteligente de estilos (`styling_engine.py`) coordina un outfit completo adaptado a la ocasión (*Casual*, *Formal*, *Deportivo*, *Fiesta*) y las restricciones climáticas (sugiere abrigos si la temperatura es <= 15°C y prioriza telas impermeables en caso de lluvia).

### 3. 🧠 Innovador de Estilo (Styling Innovations)
- Un motor editorial de estilismo analiza tu closet real y genera combinaciones inusuales pero armónicas bajo 4 conceptos de diseño:
  - **Armonía Monocromática**: Tonos continuos y juego de intensidades.
  - **Contraste Complementario**: Contraste audaz con colores opuestos.
  - **Armonía Análoga**: Colores vecinos en la rueda de color.
  - **Style Clash (Streetwear)**: Mezclas subversivas con estilo (ej. calzado deportivo con abrigos elegantes).
- Incluye una justificación estilística redactada con el tono de una revista de modas.

### 4. 🧷 Ganchito: Asistente Vintage Interactivo
- Inspirado en los asistentes de oficina retro, **Ganchito** te acompaña en pantalla con diálogos divertidos y consejos.
- Permite seleccionar 4 personalidades: *Clásico*, *Diva* (glamuroso), *Sarcástico* (humor negro) y *Nervioso* (miedo a que se oxide su gancho de metal). Su avatar y diálogos cambian en tiempo real.

### 5. 🛍️ Boutique, Probador y Envío
- Explora prendas en venta de tiendas de moda (Zara, H&M, Mango) con indicadores claros de "Aún no está comprada".
- **Probador Híbrido (Fitting Room)**: Contrasta visualmente una prenda de boutique a la par de tus prendas del closet para comprobar compatibilidad de colores y formas antes de adquirirla.
- Compra simulada con generador de códigos de rastreo e hilo de segundo plano (background thread) que actualiza el porcentaje de entrega de tus despachos cada 5 segundos de forma autónoma.

### 6. 📱 Compatibilidad con APK y Modo Offline
- La interfaz de usuario es **100% responsiva** (Mobile-First):
  - **En móviles (APK)**: Activa controles adaptados a gestos táctiles y una barra de navegación inferior (Bottom Navigation Bar) idéntica a una aplicación nativa.
  - **En escritorio (Web)**: Expande paneles laterales de alta gama y cuadrículas amplias.
- **Resiliencia Local (Mocking Forense)**: El script frontend `app.js` tiene motores locales de contingencia. Si el servidor Flask no está activo o corres la APK sin conexión a internet, la aplicación ejecutará simulaciones en el cliente para que el armario, escáner, recomendaciones y boutique sigan siendo 100% funcionales.

---

## 🛠️ Estructura del Proyecto

```
DressYourself-Web/
│
├── app.py                # Servidor Flask e hilos de despacho
├── database.py           # Conexión a SQLite y precarga de prendas iniciales
├── vision_engine.py      # Algoritmos de visión local (OpenCV, PIL, NumPy)
├── styling_engine.py     # Reglas de moda, color y clima
├── templates/
│   └── index.html        # Plantilla web responsiva
├── static/
│   ├── css/
│   │   └── style.css     # Estilos premium, glassmorphism y animaciones
│   └── js/
│       └── app.js        # Lógica SPA, fetches, personalidades de Ganchito y Mocks
└── .gitignore            # Exclusión de bases de datos locales y cachés
```

---

## 🚀 Guía de Ejecución Local

### Requisitos
1. Python 3.10 o superior.
2. Dependencias locales de visión y servidor:
   ```bash
   pip install flask flask-cors opencv-python pillow numpy
   ```

### Pasos
1. Corre el servidor Flask:
   ```bash
   python app.py
   ```
2. Abre la URL en tu navegador:
   `http://localhost:5000`

---

## 📲 Empaquetado APK (Android)
El código de Android se encuentra en el directorio hermano `dy-preliminar-src`. 
Este ha sido modificado para actuar como contenedor nativo Fullscreen WebView cargando los recursos web en local (`assets/index.html`), permitiendo al usuario una experiencia fashionista fluida en su celular y acceso directo a la galería de fotos para subir prendas.

Para compilar de forma nativa la APK:
1. Asegúrate de configurar la variable `$env:JAVA_HOME` apuntando al JBR de Android Studio.
2. Ejecuta el empaquetador de Gradle:
   ```powershell
   .\gradlew.bat assembleDebug
   ```
3. El APK resultante se encontrará en `app/build/outputs/apk/debug/app-debug.apk`.
