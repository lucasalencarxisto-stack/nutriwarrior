export function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"

  return "Boa noite"
}

export function getCurrentDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date())
}