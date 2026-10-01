# Helpful Pigeon — versão corrigida

Esta versão corrige o erro do app anterior em que o conteúdo era colocado diretamente em um iframe.

## Arquivos
- `index.html` — interface + login Supabase
- `server.js` — gateway HTTP que busca páginas através do 3proxy
- `pigeon.png` — logo
- `package.json`

## Importante
O `3proxy` está em `192.168.68.118:3128`, que é um endereço privado da sua rede. Portanto, **a Vercel não consegue acessar esse proxy diretamente**.

O `server.js` precisa rodar em uma máquina que consiga alcançar `192.168.68.118:3128` (por exemplo, a própria máquina do 3proxy ou outra máquina na mesma LAN).

### Rodar na máquina da rede
```bash
npm install
npm start
```

Por padrão:
- app: `http://0.0.0.0:8080`
- 3proxy: `http://192.168.68.118:3128`

Você pode mudar o proxy com:
```bash
PROXY_URL=http://192.168.68.118:3128 npm start
```

## Sobre o domínio da Vercel
Se quiser manter `https://helpful-pigeon-proxy.com`, a Vercel pode continuar hospedando a interface, mas o endpoint `/proxy` precisa apontar para um backend público que esteja na sua rede e consiga alcançar o 3proxy. Não coloque `192.168.68.118` como backend da Vercel: esse IP só existe na rede local.

Para uma implantação pública, uma opção é colocar o backend atrás de um túnel HTTPS (por exemplo, Cloudflare Tunnel) e então configurar a interface para usar esse backend.

## Limitação
O gateway é um proxy HTTP simples. Sites muito complexos que dependem de WebSockets, service workers, autenticação própria, CORS sofisticado ou CSP podem exigir uma solução de navegador remoto mais completa.
