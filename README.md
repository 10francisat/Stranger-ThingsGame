# 🔴 Run from the Upside Down

A Stranger Things themed endless runner game built with vanilla JavaScript and the HTML5 Canvas API.

---

## 🎮 Gameplay

Run through the Upside Down and dodge Demogorgons and Demobats coming your way. The longer you survive, the faster and harder it gets.

| Action | Key |
|--------|-----|
| Jump | `Space` / `↑` |
| Crouch | `↓` / `S` |

---

## ✨ Features

- 6 playable characters — Mike, Dustin, Lucas, Max, El, Will
- Two enemy types — Demogorgon (ground) and Demobat (air)
- Increasing difficulty over time
- Animated sprites with 4-frame run cycle
- Screen shake, hit flash, slow motion, and death zoom effects
- Particle explosion on death
- Demogorgon roar on game over
- Scrolling Upside Down background
- Persistent high score with player name saved to localStorage
- Fully responsive canvas (works on any screen size)
- Enter your name on the home screen — high score shows who holds it

---

## 🗂️ Project Structure

```
MAGIC2/
├── index.html          # Main HTML — menu, canvas, game over screen
├── style.css           # All styling — menu, game over, name input
├── game.js             # All game logic — loop, physics, spawning, scoring
└── assets/
    ├── game-bg.png         # Scrolling game background
    ├── upside-bg.png       # Menu background
    ├── gameover-bg.png     # Game over screen background
    ├── demogorgon.png      # Ground enemy sprite
    ├── demobat.png         # Air enemy sprite
    ├── background-music.mp3
    ├── demogorgon-roar.mp3
    ├── mike.png / mike1.png / mike2.png
    ├── dustin.png / dustin1.png / dustin2.png
    ├── lucas.png / lucas1.png / lucas2.png
    ├── max.png / max1.png / max2.png
    ├── el.png / el1.png / el2.png
    └── will.png / will1.png / will2.png
```

---

## 🚀 How to Run

1. Clone the repo
   ```bash
   git clone https://github.com/10francisat/Stranger-ThingsGame.git
   ```

2. Open the project folder in VS Code

3. Install the **Live Server** extension

4. Right click `index.html` → **Open with Live Server**

5. Game opens at `http://localhost:5500`

> ⚠️ Must be run via Live Server or a local server — opening `index.html` directly as a `file://` will block audio and assets.

---

## 🛠️ Built With

- Vanilla JavaScript (no frameworks)
- HTML5 Canvas API
- Web Audio API
- localStorage API
- CSS3

---

## 👾 Characters

| Character | From |
|-----------|------|
| Mike Wheeler | Stranger Things |
| Dustin Henderson | Stranger Things |
| Lucas Sinclair | Stranger Things |
| Max Mayfield | Stranger Things |
| Eleven | Stranger Things |
| Will Byers | Stranger Things |

---
