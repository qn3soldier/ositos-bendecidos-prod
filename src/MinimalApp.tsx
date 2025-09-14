function MinimalApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <div>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐻</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ositos Bendecidos</h2>
        <p style={{ fontSize: '1.2rem' }}>Server is working! ✅</p>
        <p style={{ fontSize: '1rem', marginTop: '1rem', opacity: 0.8 }}>
          "God's blessing is the best value—it's free"
        </p>
      </div>
    </div>
  );
}

export default MinimalApp;