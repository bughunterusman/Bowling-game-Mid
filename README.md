# 🎳 Bowling Game Mid

A 3D Bowling Game developed in Unity featuring realistic ball and pin physics, score calculation, strike detection, and dynamic menu systems.

[![Play / Download Game](https://img.shields.io/badge/Download-Windows%20Build%20(v1.0.0)-brightgreen?style=for-the-badge&logo=windows)](https://github.com/bughunterusman/Bowling-game-Mid/releases/tag/v1.0.0)

---

## 👥 Contributors & Submission Details

- **M Usman Ali** — SAP ID: 62506
- **Abdul Rafay Saqib** — SAP ID: 67265
- **Course / Project**: Unity 3D Project Submission

---

## 🎮 How to Play & Controls

| Action | Control Key |
|---|---|
| **Aim / Move Ball** | `A` / `D` or `Left Arrow` / `Right Arrow` |
| **Bowl / Throw Ball** | `Enter` / `Return` |
| **Next Turn / Reset Pins** | `Spacebar` (also resets automatically if ball falls) |
| **Menu / Pause** | Automatically displays after 10 turns or via UI |

### Gameplay Mechanics
- **Physics-Based Pin Collisions**: Pins react dynamically to the impact angle and ball velocity.
- **Score & Strike System**: Evaluates pin orientation (`> 5°` tilt marks a knocked pin) and updates the scoreboard.
- **High Score Tracking**: Stores and tracks high scores across sessions.
- **Audio Feedback**: Strike sound triggers upon impact with the pin triangle.
- **10 Frame Match**: Complete 10 throws to reach the final leaderboard screen.

---

## 🚀 Quick Download & Run (Windows 10 / 11)

1. Go to the [Releases page](https://github.com/bughunterusman/Bowling-game-Mid/releases/tag/v1.0.0).
2. Download **`Bowling-Game-Mid-v1.0.0-Windows.zip`**.
3. Extract the ZIP to any folder.
4. Double-click **`Bowling game Mid.exe`** to launch and play immediately!

---

## 🛠️ Project Structure & Source Code

- `Assets/`
  - `scripts/`: C# scripts managing gameplay (`Ball.cs`, `GameManager.cs`, `Strike.cs`, `HighScore.cs`, `GameMenu.cs`, `MainMenu.cs`)
  - `Scenes/`: `MainMenu.unity` and `Game.unity`
  - `Audio/`: Sound effects for bowling strikes and ball roll
  - `Materials/` & `prefabs/`: Ball, pins, alley, and UI assets
- `Packages/`: Unity package manager manifests (TextMeshPro, Input System)
- `ProjectSettings/`: Physics, Tag, and Input settings

---

## 💻 Development Requirements

- **Engine**: Unity 6 (6000.6.4f1) or Unity 2022+ LTS
- **Platform**: Windows 10/11 Standalone (64-bit)
