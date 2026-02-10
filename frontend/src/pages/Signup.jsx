// Signup page placeholder.
export default function Signup() {
  return (
    <section className="page auth">
      <h1>Sign Up</h1>
      <p>Placeholder signup form.</p>
      <form className="auth-form">
        <input type="text" placeholder="Name" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button className="btn btn-primary" type="button">Create Account</button>
      </form>
    </section>
  );
}
