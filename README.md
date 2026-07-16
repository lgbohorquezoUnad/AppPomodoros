# Focus Tomato

Aplicación Pomodoro visual y minimalista para Windows.

## Como probarla

Opcion rapida: abre `index.html` en tu navegador.

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
