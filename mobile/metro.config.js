const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

const prevEnhanceMiddleware = config.server && config.server.enhanceMiddleware;

config.server = {
    ...config.server,
    enhanceMiddleware: (metroMiddleware, metroServer) => {
        const wrappedMetro = prevEnhanceMiddleware
            ? prevEnhanceMiddleware(metroMiddleware, metroServer)
            : metroMiddleware;

        return (req, res, next) => {
            const url = req.url || '';
            if (
                url === '/api' ||
                url.startsWith('/api/') ||
                url === '/health' ||
                url === '/ready'
            ) {
                const proxyHeaders = { ...req.headers };
                delete proxyHeaders.host;

                const proxyReq = http.request(
                    {
                        hostname: '127.0.0.1',
                        port: Number(process.env.BACKEND_PORT || 3000),
                        path: url,
                        method: req.method,
                        headers: proxyHeaders,
                    },
                    (proxyRes) => {
                        const headers = { ...proxyRes.headers };
                        if (proxyRes.headers['set-cookie']) {
                            headers['x-set-cookie'] = JSON.stringify(
                                proxyRes.headers['set-cookie']
                            );
                        }
                        res.writeHead(proxyRes.statusCode || 502, headers);
                        proxyRes.pipe(res, { end: true });
                    }
                );

                proxyReq.on('error', (err) => {
                    if (!res.headersSent) {
                        res.writeHead(502, {
                            'Content-Type': 'application/json',
                        });
                        res.end(
                            JSON.stringify({
                                error: `Backend proxy error: ${err.message}`,
                            })
                        );
                    }
                });

                req.pipe(proxyReq, { end: true });
                return;
            }

            return wrappedMetro(req, res, next);
        };
    },
};

module.exports = config;
