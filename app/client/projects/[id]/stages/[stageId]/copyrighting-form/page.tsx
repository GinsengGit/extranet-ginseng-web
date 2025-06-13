"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function CopyrightingFormPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const stageId = Array.isArray(params.stageId) ? params.stageId[0] : params.stageId;
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [stage, setStage] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      const res = await fetch(`/api/projects/${id}`)
      const data = await res.json()
      setProject(data)
      const st = (data.stages || []).find((s: any) => s.id === Number(stageId))
      setStage(st)
      setForm(st?.copyrightingAnswers || {})
      setLoading(false)
    }
    fetchProject()
  }, [id, stageId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`/api/projects/${id}/stages/${stageId}/copyrighting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSuccess(true);
      // Redirection immédiate après le succès
      router.push("/client");
    } catch (error) {
      console.error("Erreur lors de l'envoi du formulaire:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>
  if (!project || !stage) return <div className="p-8 text-center text-red-500">Projet ou étape introuvable.</div>

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold text-brand-dark mb-2">Formulaire – Rédaction des pages légales</h2>
      <div className="text-xs text-gray-600 mb-4">Merci de remplir ce formulaire avec précision afin que nous puissions rédiger vos pages légales conformément aux obligations légales en vigueur.</div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Informations générales */}
        <div className="space-y-8">
          <div className="font-medium text-brand-dark">1. Informations générales sur l'éditeur du site</div>
          <div className="mb-6"><input className="input w-full" name="nomSociete" placeholder="Nom complet de la société / entité" value={form.nomSociete || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="formeJuridique" placeholder="Forme juridique" value={form.formeJuridique || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="capitalSocial" placeholder="Capital social" value={form.capitalSocial || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="adresseSiege" placeholder="Adresse complète du siège social" value={form.adresseSiege || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="telephone" placeholder="Numéro de téléphone à afficher" value={form.telephone || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="emailContact" placeholder="Email de contact à afficher" value={form.emailContact || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="siret" placeholder="Numéro SIRET / SIREN" value={form.siret || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="rcs" placeholder="Numéro RCS + ville d'immatriculation" value={form.rcs || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="ape" placeholder="Code APE / NAF" value={form.ape || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="tva" placeholder="Numéro de TVA intracommunautaire" value={form.tva || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="directeurPublication" placeholder="Nom du directeur / responsable de la publication" value={form.directeurPublication || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="responsableRedaction" placeholder="Nom du responsable de la rédaction (si différent)" value={form.responsableRedaction || ''} onChange={handleChange} /></div>
        </div>
        {/* 2. Professions réglementées */}
        <div className="space-y-8">
          <div className="font-medium text-brand-dark mt-4">2. Informations spécifiques à certaines professions réglementées</div>
          <div className="mb-6"><input className="input w-full" name="numLicence" placeholder="Numéro de licence / d'agrément / d'enregistrement professionnel" value={form.numLicence || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="autoritePro" placeholder="Nom et coordonnées de l'autorité ou de l'ordre professionnel" value={form.autoritePro || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="assurance" placeholder="Conditions d'assurance (RC pro, garantie financière, etc.)" value={form.assurance || ''} onChange={handleChange} /></div>
        </div>
        {/* 3. Hébergement */}
        <div className="space-y-8">
          <div className="font-medium text-brand-dark mt-4">3. Informations sur l'hébergement du site</div>
          <div className="flex items-center gap-4 mb-4">
            <label><input type="checkbox" name="hebergementOui" checked={!!form.hebergementOui} onChange={handleChange} /> Oui</label>
            <label><input type="checkbox" name="hebergementNon" checked={!!form.hebergementNon} onChange={handleChange} /> Non</label>
            <label><input type="checkbox" name="hebergementAdefinir" checked={!!form.hebergementAdefinir} onChange={handleChange} /> À définir</label>
          </div>
          {form.hebergementNon && (
            <>
              <div className="mb-6"><input className="input w-full" name="nomHebergeur" placeholder="Nom de l'hébergeur" value={form.nomHebergeur || ''} onChange={handleChange} /></div>
              <div className="mb-6"><input className="input w-full" name="adresseHebergeur" placeholder="Adresse complète de l'hébergeur" value={form.adresseHebergeur || ''} onChange={handleChange} /></div>
              <div className="mb-6"><input className="input w-full" name="telHebergeur" placeholder="Téléphone de l'hébergeur" value={form.telHebergeur || ''} onChange={handleChange} /></div>
              <div className="mb-6"><input className="input w-full" name="siteHebergeur" placeholder="Site web de l'hébergeur" value={form.siteHebergeur || ''} onChange={handleChange} /></div>
            </>
          )}
        </div>
        {/* 4. RGPD */}
        <div className="space-y-8">
          <div className="font-medium text-brand-dark mt-4">4. Politique de confidentialité & RGPD</div>
          <div className="mb-6"><input className="input w-full" name="emailFormulaire" placeholder="Adresse email de réception des formulaires" value={form.emailFormulaire || ''} onChange={handleChange} /></div>
          <div className="flex items-center gap-4 mb-4">
            <label><input type="checkbox" name="collecteOui" checked={!!form.collecteOui} onChange={handleChange} /> Oui</label>
            <label><input type="checkbox" name="collecteNon" checked={!!form.collecteNon} onChange={handleChange} /> Non</label>
          </div>
          {form.collecteOui && (
            <>
              <label className="block text-xs font-medium text-brand-dark mb-1 mt-2">Pour quelles finalités ?</label>
              <div className="flex flex-wrap gap-4 mb-4">
                <label><input type="checkbox" name="finaliteContact" checked={!!form.finaliteContact} onChange={handleChange} /> Gestion de contact</label>
                <label><input type="checkbox" name="finaliteNewsletter" checked={!!form.finaliteNewsletter} onChange={handleChange} /> Newsletters</label>
                <label><input type="checkbox" name="finaliteCompte" checked={!!form.finaliteCompte} onChange={handleChange} /> Création de compte</label>
                <label><input type="checkbox" name="finaliteCommande" checked={!!form.finaliteCommande} onChange={handleChange} /> Commandes/paiements</label>
                <label><input type="checkbox" name="finaliteRecrutement" checked={!!form.finaliteRecrutement} onChange={handleChange} /> Recrutement</label>
                <label><input type="checkbox" name="finaliteAutre" checked={!!form.finaliteAutre} onChange={handleChange} /> Autre</label>
              </div>
              {form.finaliteAutre && (
                <div className="mb-6"><input className="input w-full" name="finaliteAutrePreciser" placeholder="Précisez la finalité autre" value={form.finaliteAutrePreciser || ''} onChange={handleChange} /></div>
              )}
            </>
          )}
          <label className="block text-xs font-medium text-brand-dark mb-1 mt-2">Outils de suivi ou cookies utilisés :</label>
          <div className="flex flex-wrap gap-4 mb-4">
            <label><input type="checkbox" name="cookieAnalytics" checked={!!form.cookieAnalytics} onChange={handleChange} /> Google Analytics</label>
            <label><input type="checkbox" name="cookieMeta" checked={!!form.cookieMeta} onChange={handleChange} /> Pixel Meta/Facebook</label>
            <label><input type="checkbox" name="cookiePub" checked={!!form.cookiePub} onChange={handleChange} /> Publicité ciblée</label>
            <label><input type="checkbox" name="cookieAutre" checked={!!form.cookieAutre} onChange={handleChange} /> Autres</label>
          </div>
          {form.cookieAutre && (
            <div className="mb-6"><input className="input w-full" name="cookieAutrePreciser" placeholder="Précisez l'outil autre" value={form.cookieAutrePreciser || ''} onChange={handleChange} /></div>
          )}
          <div className="flex items-center gap-4 mb-4 mt-2">
            <label><input type="checkbox" name="bandeauOui" checked={!!form.bandeauOui} onChange={handleChange} /> Bandeau cookies en place</label>
            <label><input type="checkbox" name="bandeauNon" checked={!!form.bandeauNon} onChange={handleChange} /> Non</label>
            <label><input type="checkbox" name="bandeauAfaire" checked={!!form.bandeauAfaire} onChange={handleChange} /> À mettre en place</label>
          </div>
        </div>
        {/* 5. Conditions Générales */}
        <div className="space-y-8">
          <div className="font-medium text-brand-dark mt-4">5. Conditions Générales (si e-commerce ou services)</div>
          <div className="flex items-center gap-4 mb-4">
            <label><input type="checkbox" name="venteOui" checked={!!form.venteOui} onChange={handleChange} /> Oui</label>
            <label><input type="checkbox" name="venteNon" checked={!!form.venteNon} onChange={handleChange} /> Non</label>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label><input type="checkbox" name="cgvOui" checked={!!form.cgvOui} onChange={handleChange} /> Rédaction CGV/CGU</label>
            <label><input type="checkbox" name="cgvNon" checked={!!form.cgvNon} onChange={handleChange} /> Non</label>
          </div>
          <div className="mb-6"><input className="input w-full" name="typeProduits" placeholder="Types de produits/services concernés" value={form.typeProduits || ''} onChange={handleChange} /></div>
          <label className="block text-xs font-medium text-brand-dark mb-1 mt-2">Modes de paiement acceptés :</label>
          <div className="flex flex-wrap gap-4 mb-4">
            <label><input type="checkbox" name="paiementCB" checked={!!form.paiementCB} onChange={handleChange} /> CB</label>
            <label><input type="checkbox" name="paiementVirement" checked={!!form.paiementVirement} onChange={handleChange} /> Virement</label>
            <label><input type="checkbox" name="paiementPaypal" checked={!!form.paiementPaypal} onChange={handleChange} /> Paypal</label>
            <label><input type="checkbox" name="paiementLivraison" checked={!!form.paiementLivraison} onChange={handleChange} /> À la livraison</label>
            <label><input type="checkbox" name="paiementAutre" checked={!!form.paiementAutre} onChange={handleChange} /> Autre</label>
          </div>
          {form.paiementAutre && (
            <div className="mb-6"><input className="input w-full" name="paiementAutrePreciser" placeholder="Précisez le mode de paiement autre" value={form.paiementAutrePreciser || ''} onChange={handleChange} /></div>
          )}
          <div className="mb-6"><input className="input w-full" name="zones" placeholder="Zones géographiques desservies / livrées" value={form.zones || ''} onChange={handleChange} /></div>
          <div className="mb-6"><input className="input w-full" name="remboursement" placeholder="Conditions de remboursement / droit de rétractation" value={form.remboursement || ''} onChange={handleChange} /></div>
        </div>
        <Button type="submit" className="w-full bg-brand-blue text-white hover:bg-brand-yellow hover:text-brand-dark mt-4" disabled={submitting}>
          {submitting ? "Envoi en cours..." : "Envoyer le formulaire"}
        </Button>
        {success && <div className="text-green-600 text-sm mt-2">Formulaire envoyé avec succès ! Redirection...</div>}
      </form>
    </div>
  )
} 