import Navbar from '../components/Navbar';

export default function AboutPage() {
    return (
        <div>
            <Navbar activeLink="about" />
            <div className="page-container" style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        fontSize: '5rem',
                        lineHeight: 1,
                        marginBottom: '1rem',
                        filter: 'drop-shadow(0 4px 16px rgba(147,112,219,0.35))'
                    }}>
                        🐱
                    </div>
                    <h1 style={{
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-2, #b48aff))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.4rem'
                    }}>
                        PawMatch
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontStyle: 'italic' }}>
                        Опитування на сумісність
                    </p>
                </div>

                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-body">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            🐾 Про додаток
                        </h2>
                        <p style={{ color: 'var(--text-mid)', lineHeight: 1.7 }}>
                            <strong>PawMatch</strong> — це платформа для визначення сумісності між людьми за допомогою
                            опитувань. Система дозволяє проходити тематичні анкети, отримувати детальні результати
                            та порівнювати свої відповіді з іншими учасниками.
                        </p>
                        <p style={{ color: 'var(--text-mid)', lineHeight: 1.7, marginTop: '0.75rem' }}>
                            Додаток розроблено в рамках лабораторної роботи №1 з дисципліни
                            «Веб-технології та веб-дизайн», з метою демонстрації повного циклу
                            розробки серверної та клієнтської частин Web-застосунку.
                        </p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            🛠️ Використані технології
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                            {['Python', 'Django', 'Django REST Framework', 'React', 'Vite', 'JavaScript', 'SQLite'].map(tech => (
                                <span key={tech} style={{
                                    background: 'var(--lavender-light)',
                                    color: 'var(--accent)',
                                    borderRadius: '20px',
                                    padding: '0.3rem 0.9rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    border: '1px solid var(--lavender-border)'
                                }}>
                                    {tech}
                                </span>
                            ))}
                        </div>
                        <div style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Виконала: <strong style={{ color: 'var(--text-mid)' }}>Омельчук Ніка Романівна</strong>
                            &nbsp;·&nbsp; Група: <strong style={{ color: 'var(--text-mid)' }}>КВ-51мп</strong>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
