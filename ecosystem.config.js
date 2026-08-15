module.exports = {
  apps: [
    {
      name: "projectflow-backend",
      script: "node_modules/nodemon/bin/nodemon.js",
      args: "src/index.ts",
      cwd: "./server",
      env: {
        NODE_ENV: "development",
      }
    },
    {
      name: "projectflow-frontend",
      script: "node_modules/vite/bin/vite.js",
      args: "",
      cwd: "./client"
    },
    {
      name: "projectflow-ml",
      script: "python",
      args: "-m uvicorn main:app --port 8000",
      cwd: "./ml_service"
    }
  ]
};
