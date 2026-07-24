// Lädt .env in process.env, falls vorhanden (Node >= 20.12).
// Wird als erster Import geladen, damit nachfolgende Module die Werte sehen.
try {
  process.loadEnvFile();
} catch {
  // keine .env-Datei vorhanden – kein Problem
}
