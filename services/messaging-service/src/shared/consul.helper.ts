export async function registerInConsul(name: string, port: number): Promise<void> {
  if (!process.env.CONSUL_HOST) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Consul = require('consul');
    const consul = new Consul({ host: process.env.CONSUL_HOST });
    const id = `${name}-${process.env.HOSTNAME || Date.now()}`;

    await consul.agent.service.register({
      name,
      id,
      address: process.env.SERVICE_HOST || 'localhost',
      port,
      check: {
        http: `http://${process.env.SERVICE_HOST || 'localhost'}:${port}/api/health`,
        interval: '10s',
        timeout: '5s',
        deregistercriticalserviceafter: '30s',
      },
    });

    process.on('SIGTERM', async () => {
      await consul.agent.service.deregister(id);
      process.exit(0);
    });

    console.log(`[Consul] Registered ${name} (${id})`);
  } catch (err) {
    console.warn(`[Consul] Registration failed: ${(err as Error).message}`);
  }
}
