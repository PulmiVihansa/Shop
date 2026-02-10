// Login page placeholder.
export default function Login() {
  return (
    <section className="page auth">
      <h1>Login</h1>
      <p>Placeholder login form.</p>
      <form className="auth-form">
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button className="btn btn-primary" type="button">Login</button>
      </form>
    </section>
  );
}
