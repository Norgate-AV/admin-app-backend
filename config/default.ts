export default {
    host: "localhost",
    port: 3500,
    db: {
        uri: "",
    },
    cors: {
        origins: ["http://localhost:3000"],
    },
    user: {
        password: {
            saltWorkFactor: 10,
        },
    },
    jwt: {
        algorithm: "ES256",
        access: {
            ttl: "15m",
            key: {
                private: "",
                public: "",
            },
        },
        refresh: {
            ttl: "7d",
            key: {
                private: "",
                public: "",
            },
        },
    },
    api: {
        root: "/api/v1",
    },
    metrics: {
        port: 9400,
    },
};
