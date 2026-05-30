import usePageContent from '../hooks/usePageContent.js';

export default function Men() {
  const content = usePageContent('men');

  return (
    <section className="page category">
      <h1>{content.title}</h1>
      <p>{content.body}</p>
    </section>
  );
}
