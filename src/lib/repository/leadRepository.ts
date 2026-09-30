export type Lead = {
  name: string;
  company: string;
  whatsapp: string;
  problem: string;
  consentAt: Date;
  privacyPolicyVersion: string;
};

export interface LeadRepository {
  save(lead: Lead): Promise<void>;
}

export class RepositoryConfigError extends Error {}

const CONNECTION_TIMEOUT_MS = 5_000;

class PostgresLeadRepository implements LeadRepository {
  constructor(private readonly connectionString: string) {}

  async save(lead: Lead): Promise<void> {
    // Import dinâmico: evita carregar o driver `pg` quando o repositório
    // não chega a ser usado (ex.: rota nunca chamada em build/testes).
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: this.connectionString,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    });

    await client.connect();
    try {
      await client.query(
        `INSERT INTO leads (name, company, whatsapp, problem, consent_at, privacy_version, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          lead.name,
          lead.company,
          lead.whatsapp,
          lead.problem,
          lead.consentAt,
          lead.privacyPolicyVersion,
        ],
      );
    } finally {
      await client.end();
    }
  }
}

export function createLeadRepository(): LeadRepository {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new RepositoryConfigError(
      "DATABASE_URL não configurado. Defina a variável de ambiente para habilitar o envio do formulário.",
    );
  }

  return new PostgresLeadRepository(connectionString);
}
