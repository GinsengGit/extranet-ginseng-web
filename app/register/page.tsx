'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useUser } from "../../context/UserContext"

export default function PageInscription() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useUser()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })
      if (!res.ok) throw new Error("Échec d'inscription")
      
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!loginRes.ok) throw new Error("Problème lors de la connexion automatique")

      const loginData = await loginRes.json()
      setUser({
        firstName: loginData.user.firstName,
        lastName: loginData.user.lastName,
        email: loginData.user.email,
        role: "client",
      })
      router.push("/client")
    } catch (err) {
      setError("Une erreur est survenue lors de l'inscription. Essayez un autre email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <form
        onSubmit={handleRegister}
        className="bg-white/90 shadow-xl rounded-2xl p-8 space-y-6 w-full max-w-sm border border-brand-yellow"
      >
        <h1 className="text-3xl font-extrabold text-center mb-2 text-brand-dark drop-shadow">
          Inscription
        </h1>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Prénom"
            className="w-full border border-brand-yellow focus:border-brand-blue p-2 rounded-lg outline-none transition"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            autoFocus
          />
          <input
            type="text"
            placeholder="Nom"
            className="w-full border border-brand-yellow focus:border-brand-blue p-2 rounded-lg outline-none transition"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-brand-yellow focus:border-brand-blue p-2 rounded-lg outline-none transition"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full border border-brand-yellow focus:border-brand-blue p-2 rounded-lg outline-none transition"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            className="w-full border border-brand-yellow focus:border-brand-blue p-2 rounded-lg outline-none transition"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-500 text-xs text-center">{error}</div>}
        <Button
          type="submit"
          className="w-full bg-brand-yellow text-brand-dark font-semibold py-2 rounded-lg hover:bg-brand-blue hover:text-white transition"
          disabled={loading}
        >
          {loading ? "Inscription en cours..." : "S'inscrire"}
        </Button>
        <div className="text-center text-sm text-gray-500 pt-3">
          Vous avez déjà un compte ?{" "}
          <a
            href="/login"
            className="text-brand-blue hover:text-brand-yellow font-medium underline transition"
          >
            Se connecter
          </a>
        </div>
      </form>
    </div>
  )
}