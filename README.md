# Focus Tomato

Aplicación Pomodoro visual y minimalista para Windows.

## Como probarla

Opcion rapida: abre `src/renderer/index.html` en tu navegador.

Opcion con servidor local:

```powershell
node server.js
```

Luego abre `http://127.0.0.1:4173`.

## Qué incluye

- Temporizador Pomodoro configurable.
- Descanso corto y descanso largo.
- Tareas de trabajo con selección de tarea activa.
- Estadísticas básicas del día.
- Tomate flotante animado que cambia de verde a rojo según avanza el tiempo.
- Minutero dentro del tomate.
- Sonido y notificaciones al terminar una sesión.

## Siguiente paso recomendado

Convertir esta versión web local en aplicación de escritorio con Electron o Tauri para generar un instalador `.exe` de Windows.

## Modo escritorio con Electron

Para abrir como aplicacion de escritorio:

```powershell
.\abrir-focus-tomato.bat
```

Tambien puedes usar:

```powershell
npm.cmd run desktop
```

## Crear instalador para Windows

Para generar archivos que puedas instalar en cualquier PC con Windows:

```powershell
npm.cmd run dist
```

Los instaladores quedan en la carpeta `dist`.

## Estructura del proyecto

```
src/
  main/            Proceso principal de Electron (ventana, IPC, auto-update)
    main.js
    preload.js
  renderer/        Interfaz (lo que se ve en la ventana)
    index.html
    styles.css
    js/
      dom.js       Referencias a elementos del DOM
      state.js     Estado, persistencia (localStorage) y ajustes
      audio.js     Generacion de tonos con Web Audio
      tasks.js     Lista de tareas
      tomato.js    Tomate flotante, animaciones, arrastre
      timer.js     Logica del temporizador y ciclos
      render.js    Renderizado de la UI a partir del estado
      events.js    Listeners de eventos y arranque de la app
assets/
  icons/           Iconos generados (no editar a mano, ver scripts/generate-icon.js)
scripts/
  generate-icon.js Genera los PNG del icono a partir de un SVG
server.js          Servidor estatico simple para probar en el navegador
```

Los archivos de `js/` se cargan como scripts clasicos (sin `type="module"`) y en un orden especifico definido en `index.html`, para poder seguir abriendo la app directo desde el navegador sin bloqueos de CORS.
