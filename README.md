# 🎳 Bowling Game Mid

A 3D Bowling Game featuring realistic ball and pin physics, score calculation, strike detection, and dynamic menu systems.

[![Play in Browser](https://img.shields.io/badge/PLAY%20ONLINE-Live%20Web%20Game-blueviolet?style=for-the-badge&logo=googlechrome)](https://bughunterusman.github.io/Bowling-game-Mid/)
[![Download Windows Build](https://img.shields.io/badge/Download-Windows%20Build%20(v1.0.0)-brightgreen?style=for-the-badge&logo=windows)](https://github.com/bughunterusman/Bowling-game-Mid/releases/tag/v1.0.0)
[![CrazyGames / WebGL Zip](https://img.shields.io/badge/CrazyGames-WebGL%20Bundle-orange?style=for-the-badge&logo=html5)](https://github.com/bughunterusman/Bowling-game-Mid/releases/download/v1.0.0/Bowling-Game-Mid-CrazyGames-WebGL.zip)

---

## 🕹️ Live Playable Online Link

Play directly in your browser without downloading:  
👉 **[https://bughunterusman.github.io/Bowling-game-Mid/](https://bughunterusman.github.io/Bowling-game-Mid/)** 👈

---

## 👥 Contributors & Submission Details

- **M Usman Ali** — SAP ID: 62506
- **Abdul Rafay Saqib** — SAP ID: 67265
- **Course / Project**: Unity 3D Project Submission

---

## 🎮 How to Play & Controls

| Action | Control Key |
|---|---|
| **Aim / Move Ball** | `A` / `D` or `Left Arrow` / `Right Arrow` or On-screen Slider |
| **Bowl / Throw Ball** | `Enter` / `Return` or Click "Bowl Ball" |
| **Next Turn / Reset Pins** | `Spacebar` (also resets automatically if ball falls) |
| **Switch Camera** | Click Camera Icon 🎥 (Chaser Cam / Overhead Alley Cam) |
| **Toggle Audio** | Click Sound Icon 🔊 |

### Gameplay Mechanics
- **Physics-Based Pin Collisions**: Pins react dynamically to the impact angle and ball velocity.
- **Score & Strike System**: Evaluates pin orientation (`> 5°` tilt marks a knocked pin) and updates the scoreboard.
- **High Score Tracking**: Stores and tracks high scores across sessions in local storage.
- **Audio Feedback**: Strike sound triggers upon impact with the pin triangle.
- **10 Frame Match**: Complete 10 throws to reach the final leaderboard screen.

---

## 📦 Deployment Options

### 1. Instant Web Play
- Play on GitHub Pages: [bughunterusman.github.io/Bowling-game-Mid/](https://bughunterusman.github.io/Bowling-game-Mid/)

### 2. Standalone Windows PC (64-bit)
1. Go to the [Releases page](https://github.com/bughunterusman/Bowling-game-Mid/releases/tag/v1.0.0).
2. Download **`Bowling-Game-Mid-v1.0.0-Windows.zip`**.
3. Extract and double-click **`Bowling game Mid.exe`** to play.

### 3. CrazyGames / Itch.io Web Submission
1. Download **`Bowling-Game-Mid-CrazyGames-WebGL.zip`** from the [v1.0.0 release](https://github.com/bughunterusman/Bowling-game-Mid/releases/tag/v1.0.0).
2. Upload directly to the [CrazyGames Developer Portal](https://developer.crazygames.com/) or [itch.io](https://itch.io/game/new) under HTML5 Game.

---

## 🛠️ Project Structure

- `web/`: In-browser 3D WebGL game edition (Three.js + Cannon.js + original assets).
- `Assets/`: Unity game assets, 3D models, textures, materials, and C# scripts (`Ball.cs`, `GameManager.cs`, `Strike.cs`, etc.).
- `Packages/`: Unity package manager manifests.
- `ProjectSettings/`: Physics, Tag, and Input settings.
- `Build/`: Standalone 64-bit Windows build.
