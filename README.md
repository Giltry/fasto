# FASTO — Gran Premio Retro

Juego de carreras pseudo-3D para navegador, inspirado en *Top Gear* de SNES.
Hecho con JavaScript puro y canvas, sin dependencias ni imágenes externas: todos los gráficos se generan por código.

## Cómo jugar

Abre `index.html` en el navegador (doble clic). También puedes servir la carpeta:

```bash
python -m http.server 8765
```

y entrar a http://localhost:8765

## Controles

| Tecla | Acción |
|---|---|
| ↑ / W | Acelerar |
| ↓ / S | Frenar |
| ← → / A D | Girar |
| Espacio / Shift | Nitro (3 por carrera) |
| Esc / P | Pausa |
| M | Silenciar |

## Contenido

- **4 autos**: Rayo (equilibrado), Titán (velocidad), Víbora (aceleración), Fantasma (manejo y agarre).
- **4 dificultades**: Fácil, Normal, Difícil y **Leyenda**, que se desbloquea al terminar carreras en Difícil en 3 pistas distintas (el progreso se guarda en el navegador).
- **4 circuitos** de 3 vueltas: Costa Verde, Desierto Rojo, Ciudad Neón y Montaña Nevada, cada uno con su trazado, colinas y escenario.
- **2 autopistas** de un solo tramo (de la salida a la meta, 4 carriles): Autopista Neón y Ruta del Sol, con tráfico civil (autos, camionetas, pickups, camiones y autobuses) que circula a velocidad normal y con el que puedes chocar.
- **8 competidores**, parrilla de salida y cuenta regresiva. Los rivales son más rápidos, esquivan mejor y se reponen antes de los choques conforme sube la dificultad.
- Choques entre autos, auto más lento y con vibración fuera de la pista.
- Obstáculos que cambian de lugar en cada carrera: conos (frenan), aceite/hielo (derrapas), rocas/barreras (te detienen un momento), lodo/arena/nieve (te hunden).
- Minimapa con la posición de todos los autos y fondo panorámico que gira según hacia dónde mira el auto.

## Estructura

```
index.html
css/style.css
js/util.js      constantes y utilidades del motor
js/sprites.js   gráficos procedurales (autos, escenario, obstáculos, fondos)
js/tracks.js    temas, trazados, decoración y minimapa
js/audio.js     efectos de sonido sintetizados
js/race.js      simulación, IA, colisiones, render pseudo-3D y HUD
js/ui.js        menús
js/main.js      bucle principal, entrada y guardado
```
