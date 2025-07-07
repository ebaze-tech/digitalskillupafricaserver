module.exports = {
    apps: [
        {
            name: "digitalskillupafricamentorshipplatformserver",
            script: "./dist/server.js",
            interpreter: "ts-node",
            watch: false,
            env: {
                PORT: process.env.PORT || 5000,
                NODE_ENV: "production"
            }
        }
    ]
};
