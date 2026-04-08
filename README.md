# AllHazards: Frontline Commander (全災害救護指揮官)

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[繁體中文](#繁體中文) | [English](#english)

---

<a name="繁體中文"></a>

## 🇹🇼 專案介紹 (Traditional Chinese)

**AllHazards: Frontline Commander** 是一款沉浸式的全災害救護模擬練習平台。玩家將扮演現場總指揮 (Incident Commander)，在壓力環境下執行大量的檢傷分類 (Triage)、急救處置與資源調度。

### 核心功能
*   **START 檢傷系統**：精確模擬「呼吸、血液循環、意識」的三步驟評估，實作精準的點擊式檢傷操作。
*   **現場指揮中心 (ICP)**：具備動態地圖與任務清單，挑戰玩家在限時內的決策優先級。
*   **全球即時排行榜**：整合 Supabase Realtime 技術，讓全球玩家的成績即時跳動同步。
*   **戰術地圖模態框**：支援即時設置 ICP、救護站與集結區。

### 技術堆疊
*   **前端**：React.js + Vite
*   **風格**：Glassmorphism (玻璃擬態) 暗色調 UI
*   **後端/資料庫**：Supabase (PostgreSQL + Realtime)
*   **部署**：Vercel

---

<a name="english"></a>

## 🇺🇸 Project Introduction (English)

**AllHazards: Frontline Commander** is an immersive disaster simulation platform. Players take on the role of an Incident Commander, performing mass casualty triage, emergency treatment, and resource dispatch under high-pressure scenarios.

### Key Features
*   **START Triage System**: Precise simulation of the "Respiration, Perfusion, Mental Status" assessment with a tactical click-based interface.
*   **Incident Command Post (ICP)**: Dynamic map and action checklist to challenge decision-making priorities under time constraints.
*   **Global Realtime Leaderboard**: Powered by Supabase Realtime, synchronized instantly across all players worldwide.
*   **Tactical Placement**: Integrated map modals for strategic placement of medical post and decontamination zones.

### Technical Stack
*   **Frontend**: React.js + Vite
*   **Aesthetics**: Glassmorphism Dark Mode UI
*   **Database/Backend**: Supabase (PostgreSQL + Realtime)
*   **Deployment**: Vercel

---

## 🛠️ 本地安裝 / Local Setup

1.  **Clone the project**:
    ```bash
    git clone https://github.com/tangep90g-ui/AllHazards_Game.git
    cd AllHazards_Game
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env` file in the root and fill in your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run locally**:
    ```bash
    npm run dev
    ```

---

## 📄 License
MIT License. Created by [Your Name/Handle].
