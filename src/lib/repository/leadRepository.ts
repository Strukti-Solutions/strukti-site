export type Lead = {
  name: string;
  company: string;
  whatsapp: string;
  problem: string;
};

export interface LeadRepository {
  save(lead: Lead): Promise<void>;
}

export class RepositoryConfigError extends Error {}

class PostgresLeadRepository implements LeadRepository {
  constructor(private readonly connectionString: string) {}

  async save(lead: Lead): Promise<void> {
    // Import dinâmico: evita carregar o driver `pg` quando o repositório
    // não chega a ser usado (ex.: rota nunca chamada em build/testes).
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: this.connectionString });

    try {
      await pool.query(
        `INSERT INTO leads (name, company, whatsapp, problem, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [lead.name, lead.company, lead.whatsapp, lead.problem],
      );
    } finally {
      await pool.end();
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
