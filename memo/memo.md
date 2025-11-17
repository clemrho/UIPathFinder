## 测试前端

npm run dev

打开浏览器访问 Vite 给你的链接，例如：
http://localhost:5173/

## 测试后端

四、写 Express 后端代码（index.js）

复制下面完整代码 ⬇️

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Example API
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

// Start server
app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});


启动后端：

node index.js


访问测试：

http://localhost:3001/api/hello

你会看到：

{"message":"Hello from Express backend!"}


React 前端调用 Express API

在 frontend/src/App.jsx 里加入 fetch 调用：

import { useEffect, useState } from "react";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/hello")
      .then(res => res.json())
      .then(data => setMsg(data.message));
  }, []);

  return (
    <div>
      <h1>React + Express Fullstack</h1>
      <p>Backend says: {msg}</p>
    </div>
  );
}

export default App;


启动前端：

npm run dev


你会看到：

Backend says: Hello from Express backend!

⭐ 六、前端自动代理到后端（可选但强烈推荐）

避免写跨域 URL（http://localhost:3001），你可以用
 Vite 代理。

编辑：frontend/vite.config.js

export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3001"
    }
  }
});


然后 fetch 可以直接写：

fetch("/api/hello")

⭐ 七、最终项目目录长这样
my-fullstack-app/
  frontend/
    vite.config.js
    src/
      App.jsx
    package.json
  backend/
    index.js
    package.json

⭐ 八、启动方式

开两个终端：

前端
cd frontend
npm run dev

后端
cd backend
node index.js
