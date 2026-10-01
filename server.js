const express = require('express');
const path = require('path');
const { ProxyAgent } = require('undici');

const app = express();
const PORT = Number(process.env.PORT || 8080);
const PROXY_URL = process.env.PROXY_URL || 'http://192.168.68.118:3128';
const agent = new ProxyAgent(PROXY_URL);

app.use(express.static(path.join(__dirname)));

function absolute(base, value) {
  try { return new URL(value, base).toString(); } catch { return value; }
}

function rewriteHtml(html, targetUrl) {
  // Keep navigation/resources inside Helpful Pigeon. This is intentionally
  // lightweight; complex sites using service workers, WebSockets, or strict
  // CSP may need a dedicated full browser/proxy solution.
  html = html.replace(/<base\b[^>]*>/ig, '');
  html = html.replace(/\b(href|src|action)\s*=\s*("([^"]*)"|'([^']*)')/ig, (m, attr, quoted, dq, sq) => {
    const value = dq ?? sq;
    if (!value || /^(#|data:|javascript:|mailto:|tel:|blob:)/i.test(value)) return m;
    const abs = absolute(targetUrl, value);
    return `${attr}="/proxy?url=${encodeURIComponent(abs)}"`;
  });
  html = html.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/ig, (m, q, value) => {
    if (/^(data:|https?:\/\/)/i.test(value)) {
      const abs = absolute(targetUrl, value);
      return `url("/proxy?url=${encodeURIComponent(abs)}")`;
    }
    return m;
  });
  return html;
}

app.get('/proxy', async (req, res) => {
  const raw = String(req.query.url || '');
  let target;
  try {
    target = new URL(raw);
    if (!/^https?:$/.test(target.protocol)) throw new Error('Somente HTTP/HTTPS');
  } catch {
    return res.status(400).send('URL inválida.');
  }

  try {
    const upstream = await fetch(target, {
      dispatcher: agent,
      redirect: 'follow',
      headers: {
        'user-agent': 'HelpfulPigeon/1.0',
        'accept': req.headers.accept || '*/*',
        'accept-language': req.headers['accept-language'] || 'pt-BR,pt;q=0.9,en;q=0.8'
      }
    });

    const type = upstream.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.status(upstream.status);
    res.set('Content-Type', type);
    res.set('Cache-Control', 'no-store');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');

    if (type.includes('text/html')) {
      return res.send(rewriteHtml(buffer.toString('utf8'), target.toString()));
    }
    return res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(502).send(`Não foi possível acessar o destino pelo proxy.<br><br>${String(e.message || e)}`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Helpful Pigeon: http://0.0.0.0:${PORT}`);
  console.log(`3proxy: ${PROXY_URL}`);
});
