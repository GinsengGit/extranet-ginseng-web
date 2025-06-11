"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, User } from "lucide-react"
import { useUser } from "@/context/UserContext"

export default function ManageAdmins() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [admins, setAdmins] = useState<any[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== "admin") {
      router.replace("/login")
      return
    }
    fetch("/api/admins")
      .then(res => res.json())
      .then(data => setAdmins(data))
      .finally(() => setLoading(false))
  }, [user, isLoading])

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return
    await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newAdminEmail })
    })
    setNewAdminEmail("")
    const res = await fetch("/api/admins")
    try {
      const data = await res.json()
      setAdmins(data)
    } catch (e) {
      setAdmins([])
    }
  }

  const handleDeleteAdmin = async (email: string) => {
    if (!window.confirm("Supprimer cet admin ?")) return
    await fetch(`/api/admins?email=${encodeURIComponent(email)}`, { method: "DELETE" })
    const res = await fetch("/api/admins")
    setAdmins(await res.json())
  }

  if (isLoading || !user || user.role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center bg-white"><span className="text-gray-500 text-lg">Chargement...</span></div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-50 w-full bg-brand-dark text-white">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" className="text-white" onClick={() => router.push("/admin")}>Retour</Button>
          <h1 className="ml-4 text-xl font-bold">Gestion des administrateurs</h1>
        </div>
      </header>
      <main className="flex-1 py-8 px-4">
        <div className="container max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Liste des administrateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-200">
                {admins.map((admin) => (
                  <li key={admin.email} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2"><User className="w-4 h-4" /> {admin.email}</span>
                    <Button variant="outline" size="icon" className="text-red-500 border-red-200" onClick={() => handleDeleteAdmin(admin.email)}><Trash2 className="w-4 h-4" /></Button>
                  </li>
                ))}
              </ul>
              <div className="flex mt-6 gap-2">
                <input type="email" className="flex-1 border rounded px-3 py-2" placeholder="Nouvel email admin" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
                <Button onClick={handleAddAdmin} className="bg-brand-yellow text-brand-dark hover:bg-brand-yellow/90"><Plus className="w-4 h-4 mr-1" /> Ajouter</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
