interface PlaceholderPageProps {
  title: string
  description: string
}

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  )
}

export default PlaceholderPage