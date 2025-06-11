"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useUser } from "../../context/UserContext"

export default function PageConnexion() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useUser()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error("Échec de connexion")
      const data = await res.json()
      setUser({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        role: data.user.role,
        avatarUrl: data.user.avatarUrl || null, 
      })
      window.location.replace(data.user.role === "admin" ? "/admin" : "/client")
      return
    } catch (err) {
      setError("Email ou mot de passe incorrect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <form
        onSubmit={handleLogin}
        className="bg-white/90 shadow-xl rounded-2xl p-8 space-y-6 w-full max-w-sm border border-brand-yellow"
      >
        <h1 className="text-3xl font-extrabold text-center mb-2 text-brand-dark drop-shadow">
          Connexion
        </h1>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-brand-yellow focus:border-brand-blue p-2 rounded-lg outline-none transition"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full border border-brand-yellow focus:border-brand-blue p-2 rounded-lg outline-none transition"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-500 text-xs text-center">{error}</div>}
        <Button
          type="submit"
          className="w-full bg-brand-yellow text-brand-dark font-semibold py-2 rounded-lg hover:bg-brand-blue hover:text-white transition"
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
        <div className="text-center text-sm text-gray-500 pt-3">
          Pas de compte ?{" "}
          <a
            href="/register"
            className="text-brand-blue hover:text-brand-yellow font-medium underline transition"
          >
            S'inscrire
          </a>
        </div>
      </form>
    </div>
  )
}